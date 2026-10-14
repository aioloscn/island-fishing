// GPU regression for the production fishing line under default TAA and motion blur.
// The line moves over a flat sky; any distant non-sky pixels are stale line images.
import './headless.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { worldHarness, done } from './world-harness.mjs';
import { writePNG } from './headless.mjs';
import { FishingRod } from '../src/game/FishingRod.js';
import { TemporalUpscale } from '../src/post/TemporalUpscale.js';
import { MotionBlur } from '../src/post/MotionBlur.js';
import { FullscreenPass } from '../src/engine/render/FullscreenPass.js';
import { RenderTarget } from '../src/engine/gpu/Texture.js';
import { readTexture } from '../src/engine/gpu/Readback.js';
import { FrameUniforms, setFrameCamera } from '../src/engine/render/Frame.js';

const W = 640, H = 960;
const h = await worldHarness( { width: W, height: H } );
const { GPU, E, scene, camera, mr, rt } = h;
GPU.device.pushErrorScope( 'validation' );
h.setView( { pos: [ 0, 1.7, 0 ], target: [ 0, 2.1, - 4 ] } );
const rod = new FishingRod( { scene, camera, query: { allocate: () => 0, setPoint() {}, cpuValid: false }, terrain: { heightAt: () => - 5 } } );
rod.equip( true );
// Diagnostic negative control: the former static motion / unmasked history path
// should fail the same image comparison, without changing production files.
const legacy = process.env.LINE_GHOST_LEGACY === '1';
if ( legacy ) {

	rod.lineMat.vertex = rod.lineMat.vertex.replace( /\tif \( mat.prevLineShow > 0.0 \) \{[\s\S]*?\n\t\}/, '' );
	rod.lineMat.output = '';

}
const out = new RenderTarget( W, H, { colors: [ 'rgba8unorm' ] } );
const outDir = process.argv[ 2 ] || join( tmpdir(), 'tidewater-line-ghosting' );
mkdirSync( outDir, { recursive: true } );
let totalGhosts = 0, maxMotion = 0;
for ( const scale of [ 1, 0.5 ] ) {

	rt.setSize( W * scale, H * scale );
	const taa = new TemporalUpscale( rt.texture, rt.depthTexture, rt.textures[ 1 ], camera, rt.textures[ 2 ] );
	taa.setSize( W, H );
	const blur = new MotionBlur( { velocityTexture: rt.textures[ 1 ], depthTexture: rt.depthTexture, color: () => taa.output, reactiveMaskTexture: rt.textures[ 2 ] } );
	const pass = new FullscreenPass( { label: 'line inspection', colorFormats: out.formats, modules: [ blur.module ],
		bindings: { hdr: { texture: () => taa.output } },
		code: `fn fragment( in: FSIn ) -> vec4f {
			let c = mbApply( textureSampleLevel( hdr, smpLinearClamp, in.uv, 0.0 ).rgb, in.uv );
			let a = c * 0.6; let t = ( a * ( 2.51 * a + 0.03 ) ) / ( a * ( 2.43 * a + 0.59 ) + 0.14 );
			return vec4f( linearToSrgb( sat3( t ) ), 1.0 ); }`,
	} );
	function frame( fight = null, visible = true ) {

		GPU.beginFrame();
		FrameUniforms.fields.time.value += 1 / 30;
		FrameUniforms.fields.frameIndex.value ++;
		rod.waterY = Math.sin( FrameUniforms.fields.time.value * 2.8 ) * 0.15;
		rod.update( 1 / 30, { visible, fight } );
		blur.updateCamera( camera ); taa.advance();
		const [ x, y ] = taa.jitter();
		setFrameCamera( camera, rt.width, rt.height, { jitterX: - x, jitterY: y } );
		FrameUniforms.fields.outputResolution.value.set( W, H );
		mr.render( scene, { camera, kind: 'main', filter: m => m === rod.lineMesh,
			colorViews: rt.textures.map( t => t.view() ), colorFormats: rt.formats,
			clearColors: [ [ 0.03, 0.16, 0.36, 1 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ],
			depthView: rt.depthTexture.view(), depthFormat: 'depth32float', clearDepth: 0 } );
		taa.render(); blur.compute( W, H ); pass.render( { colorViews: [ out.texture ] } );
		taa.clearViewOffset(); taa.endFrame(); GPU.submit();

	}
	async function inspect( phase, n ) {

		const mask = new Uint8Array( ( await readTexture( rt.textures[ 2 ] ) ).data );
		const depth = new Float32Array( ( await readTexture( rt.depthTexture ) ).data );
		const velocity = new Uint16Array( ( await readTexture( rt.textures[ 1 ] ) ).data );
		const img = new Uint8Array( ( await readTexture( out.texture ) ).data );
		const bg = img.slice( 0, 3 );
		let covered = 0, ghosts = 0;
		const radius = 3;
		const near = new Uint8Array( W * H );
		for ( let y = 0; y < rt.height; y ++ ) for ( let x = 0; x < rt.width; x ++ ) {

			const o = ( y * rt.width + x ) * 4;
			if ( depth[ y * rt.width + x ] <= 0 ) continue;
			if ( ! legacy ) assert.ok( mask[ o + 2 ] > 128, 'current line pixels reject stale history' );
			covered ++;
			maxMotion = Math.max( maxMotion, Math.hypot( half( velocity[ o ] ) * W, half( velocity[ o + 1 ] ) * H ) );
			for ( let yy = Math.max( 0, y - radius ); yy <= Math.min( rt.height - 1, y + radius ); yy ++ ) {

				const minX = Math.max( 0, ( x - radius ) / scale ), maxX = Math.min( W, ( x + radius + 1 ) / scale );
				for ( let row = yy / scale; row < ( yy + 1 ) / scale; row ++ ) near.fill( 1, row * W + minX, row * W + maxX );

			}

		}
		for ( let p = 0; p < W * H; p ++ ) {

			if ( ! near[ p ] && Math.max( ...bg.map( ( b, c ) => Math.abs( img[ p * 4 + c ] - b ) ) ) > 5 ) ghosts ++;

		}
		writePNG( join( outDir, `${ scale }-${ phase }-${ n }.png` ), W, H, img );
		assert.ok( covered > 50 * scale * scale, `${ phase }: the real line must be visible` );
		assert.ok( ghosts < 25, `${ scale }/${ phase }: ${ ghosts } stale line pixels beyond its current curve` );
		totalGhosts += ghosts;

	}
	rod.setState( 'idle' );
	for ( let n = 0; n < 20; n ++ ) { frame(); await GPU.queue.onSubmittedWorkDone(); }
	rod.startWindup();
	for ( let n = 0; n < 30; n ++ ) { frame(); await GPU.queue.onSubmittedWorkDone(); }
	rod.release();
	for ( let n = 0; n < 35; n ++ ) {

		frame(); await GPU.queue.onSubmittedWorkDone();
		if ( n > 5 && n % 10 === 0 ) await inspect( 'cast', n );

	}
	rod.setState( 'floating' ); rod.bobber.set( 1.3, 0, - 14 );
	for ( let n = 0; n < 60; n ++ ) {

		frame(); await GPU.queue.onSubmittedWorkDone();
		if ( n >= 30 && n % 10 === 0 ) await inspect( 'waiting', n );

	}
	rod.hook();
	for ( let n = 0; n < 45; n ++ ) {

		frame( { distance: 12 - n * 0.06, tension: 0.5, surge: ( 1 + Math.sin( n * 0.3 ) ) * 0.4 } );
		await GPU.queue.onSubmittedWorkDone();
		if ( n >= 20 && n % 10 === 0 ) await inspect( 'fighting', n );

	}
	rod.endFight();
	for ( let n = 0; n < 20; n ++ ) {

		frame(); await GPU.queue.onSubmittedWorkDone();
		if ( n > 0 && n % 5 === 0 ) await inspect( 'retrieving', n );

	}
	rod.land( 0.47 );
	for ( let n = 0; n < 30; n ++ ) {

		frame(); await GPU.queue.onSubmittedWorkDone();
		if ( n > 0 && n % 5 === 0 ) await inspect( 'landing', n );

	}
	rod.setState( 'idle' );
	for ( let n = 0; n < 3; n ++ ) { frame(); await GPU.queue.onSubmittedWorkDone(); }
	const hidden = new Uint8Array( ( await readTexture( out.texture ) ).data );
	assert.ok( hidden.every( ( v, i ) => i % 4 === 3 || Math.abs( v - hidden[ i % 4 ] ) <= 1 ), 'collecting leaves a clean sky' );

}
function half( n ) {

	const e = ( n >> 10 ) & 31, m = n & 1023;
	return ( n & 32768 ? - 1 : 1 ) * ( e ? Math.pow( 2, e - 15 ) * ( 1 + m / 1024 ) : Math.pow( 2, - 14 ) * m / 1024 );

}
assert.ok( maxMotion > 1, 'line deformation must produce its own motion with a static camera' );
assert.equal( await GPU.device.popErrorScope(), null );
console.log( JSON.stringify( { totalGhosts, maxMotion, outDir } ) );
await done();

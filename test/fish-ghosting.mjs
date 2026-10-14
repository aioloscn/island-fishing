// Focused GPU regression: a close-up fish struggling against a static sky, with
// default temporal AA and motion blur. Run separately from the CPU game tests.
import './headless.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { worldHarness, done } from './world-harness.mjs';
import { writePNG } from './headless.mjs';
import { CatchDisplay } from '../src/game/CatchDisplay.js';
import { TemporalUpscale } from '../src/post/TemporalUpscale.js';
import { MotionBlur } from '../src/post/MotionBlur.js';
import { FullscreenPass } from '../src/engine/render/FullscreenPass.js';
import { RenderTarget } from '../src/engine/gpu/Texture.js';
import { readTexture } from '../src/engine/gpu/Readback.js';
import { FrameUniforms, setFrameCamera } from '../src/engine/render/Frame.js';

const W = 512, H = 768;
const h = await worldHarness( { width: W, height: H } );
const { GPU, E, scene, camera, mr, rt } = h;
GPU.device.pushErrorScope( 'validation' );
h.setView( { pos: [ 0, 0, 0.85 ], target: [ 0, 0, 0 ] } );
const fish = new CatchDisplay( { scene } );
const mouth = new E.Vector3( 0, 0.22, 0 );
const taa = new TemporalUpscale( rt.texture, rt.depthTexture, rt.textures[ 1 ], camera, rt.textures[ 2 ] );
taa.setSize( W, H );
const blur = new MotionBlur( { velocityTexture: rt.textures[ 1 ], depthTexture: rt.depthTexture, color: () => taa.output, reactiveMaskTexture: rt.textures[ 2 ] } );
const out = new RenderTarget( W, H, { colors: [ 'rgba8unorm' ] } );
const pass = new FullscreenPass( { label: 'fish inspection', colorFormats: out.formats, modules: [ blur.module ],

	bindings: { hdr: { texture: () => taa.output } },
	code: `fn fragment( in: FSIn ) -> vec4f {
		let c = mbApply( textureSampleLevel( hdr, smpLinearClamp, in.uv, 0.0 ).rgb, in.uv );
		let a = c * 0.6; let t = ( a * ( 2.51 * a + 0.03 ) ) / ( a * ( 2.43 * a + 0.59 ) + 0.14 );
		return vec4f( linearToSrgb( sat3( t ) ), 1.0 ); }`,

} );
const outDir = process.argv[ 2 ] || join( tmpdir(), 'tidewater-fish-ghosting' );
mkdirSync( outDir, { recursive: true } );
function frame( dt ) {

	GPU.beginFrame();
	FrameUniforms.fields.time.value += dt;
	FrameUniforms.fields.frameIndex.value ++;
	fish.show( 'mullet', 1.1, mouth, 0, dt );
	blur.updateCamera( camera );
	taa.advance();
	const [ x, y ] = taa.jitter();
	setFrameCamera( camera, W, H, { jitterX: - x, jitterY: y } );
	FrameUniforms.fields.outputResolution.value.set( W, H );
	mr.render( scene, { camera, kind: 'main', colorViews: rt.textures.map( t => t.view() ), colorFormats: rt.formats,
		clearColors: [ [ 0.5, 0.62, 0.8, 1 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ], depthView: rt.depthTexture.view(), depthFormat: 'depth32float', clearDepth: 0 } );
	taa.render(); blur.compute( W, H ); pass.render( { colorViews: [ out.texture ] } );
	taa.clearViewOffset(); taa.endFrame(); GPU.submit();

}
function half( n ) {

	const e = ( n >> 10 ) & 31, m = n & 1023;
	return ( n & 32768 ? - 1 : 1 ) * ( e ? Math.pow( 2, e - 15 ) * ( 1 + m / 1024 ) : Math.pow( 2, - 14 ) * m / 1024 );

}
let maxVelocity = 0, totalGhosts = 0;
for ( let n = 0; n < 120; n ++ ) {

	// Larger frame steps cover the stronger pose changes seen under GPU load.
	frame( n < 60 ? 1 / 60 : 1 / 30 ); await GPU.queue.onSubmittedWorkDone();
	if ( n < 60 || n % 10 !== 0 ) continue;
	const mask = new Uint8Array( ( await readTexture( rt.textures[ 2 ] ) ).data );
	const vel = new Uint16Array( ( await readTexture( rt.textures[ 1 ] ) ).data );
	const img = new Uint8Array( ( await readTexture( out.texture ) ).data );
	let covered = 0, ghosts = 0;
	const bg = img.slice( 0, 3 );
	for ( let y = 4; y < H - 4; y ++ ) for ( let x = 4; x < W - 4; x ++ ) {

		const p = y * W + x, o = p * 4;
		if ( mask[ o + 2 ] > 128 ) {

			covered ++;
			maxVelocity = Math.max( maxVelocity, Math.hypot( half( vel[ o ] ) * W, half( vel[ o + 1 ] ) * H ) );
			continue;

		}
		// Allow the current reconstruction's 3-pixel edge footprint; beyond that
		// any departure from the flat sky is stale fish history or a blur streak.
		let near = false;
		for ( let dy = - 3; dy <= 3 && ! near; dy ++ ) for ( let dx = - 3; dx <= 3; dx ++ ) {

			if ( mask[ ( ( y + dy ) * W + x + dx ) * 4 + 2 ] > 128 ) { near = true; break; }

		}
		if ( ! near && Math.max( ...bg.map( ( b, c ) => Math.abs( img[ o + c ] - b ) ) ) > 5 ) ghosts ++;

	}
	writePNG( join( outDir, `fish-${ n }.png` ), W, H, img );
	assert.ok( covered > 3000, 'fish must actually be visible and write its reactive mask' );
	assert.ok( ghosts < 100, `frame ${ n }: ${ ghosts } stale pixels outside current fish silhouette` );
	totalGhosts += ghosts;
}
assert.ok( maxVelocity > 1, 'a static camera must still see body-deformation motion vectors' );
assert.equal( await GPU.device.popErrorScope(), null, 'real shaders and post effects must validate' );
console.log( JSON.stringify( { maxVelocity, totalGhosts, outDir } ) );
await done();

import assert from 'node:assert/strict';
import { PerspectiveCamera, Scene } from '../src/engine/index.js';
import { FishingRod } from '../src/game/FishingRod.js';
import { GPU } from '../src/engine/gpu/GPU.js';

const rod = new FishingRod( {
	scene: new Scene(), camera: new PerspectiveCamera( 62, 16 / 9, 0.1, 1000 ),
	query: { allocate: () => 0, setPoint() {}, cpuValid: false }, terrain: { heightAt: () => - 5 },
} );
rod.camera.position.set( 0, 2, 0 );
rod.equip( true );
const frame = GPU.frame, u = rod.lineMat.uniforms;
try {

	const step = ( visible = true ) => { GPU.frame ++; rod.update( 1 / 60, { visible } ); };
	for ( let n = 0; n < 40; n ++ ) step();
	assert.ok( rod.startWindup() );
	for ( let n = 0; n < 40; n ++ ) step();
	assert.ok( rod.release() );
	while ( ! rod.lineMesh.visible ) step();
	assert.equal( u.prevLineShow.value, 0, 'new casts cannot use the hidden old curve' );
	const curve = [ u.lineA.value.clone(), u.lineB.value.clone(), u.lineCtl.value.clone() ];
	step();
	for ( const [ i, key ] of [ 'prevLineA', 'prevLineB', 'prevLineCtl' ].entries() ) assert.deepEqual( u[ key ].value, curve[ i ] );
	assert.ok( u.lineB.value.distanceTo( curve[ 1 ] ) > 0, 'casting moves the line endpoint' );
	rod.update( 1 / 60, { visible: true } );
	assert.deepEqual( u.prevLineB.value, curve[ 1 ], 'repeated updates cannot advance the rendered history' );
	while ( rod.state === 'flying' ) step();
	assert.equal( rod.state, 'floating' );
	const floating = u.lineCtl.value.clone();
	rod.waterY += 0.2; step();
	assert.deepEqual( u.prevLineCtl.value, floating, 'wave-induced sag retains the previous curve' );
	rod.retrieve(); step();
	assert.equal( rod.state, 'retrieving' );
	while ( rod.lineMesh.visible ) step();
	step();
	assert.equal( u.prevLineShow.value, 0, 'collecting the line invalidates its pose history' );
	rod.bobber.set( 0, 0, - 10 ); rod.land( 0.47 ); step();
	assert.equal( u.prevLineShow.value, 0, 'a new landing begins without a streak from the last cast' );
	step( false ); step( true );
	assert.equal( u.prevLineShow.value, 0, 'showing the rod after a hidden frame resets the history' );

} finally {

	GPU.frame = frame;

}
console.log( 'Fishing line motion passed: casting, floating, retrieval, repeated updates and visibility reset.' );

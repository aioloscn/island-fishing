import assert from 'node:assert/strict';
import { ReefBatch } from '../src/world/reef/ReefBatch.js';
import { GPU } from '../src/engine/gpu/GPU.js';

// A render frame can upload repeatedly (hide, show, cull). None of these may
// replace the previous rendered pose with an intermediate pose from this frame.
const writes = [];
const batch = Object.assign( Object.create( ReefBatch.prototype ), {

	motion: true, motionFrame: - 1,
	data: new Float32Array( 32 ), previousData: new Float32Array( 32 ), lastData: new Float32Array( 32 ),
	instanceBuffer: { write() {} },
	previousInstanceBuffer: { write( data ) { writes.push( Array.from( data ) ); } },

} );
const frame = GPU.frame;
try {

	GPU.frame = 100;
	batch.data.fill( 1 ); batch.upload();
	assert.equal( writes.at( - 1 )[ 0 ], 1, 'first upload has no artificial motion' );
	GPU.frame ++;
	batch.data.fill( 2 ); batch.upload();
	batch.data.fill( 3 ); batch.upload();
	assert.equal( writes.at( - 1 )[ 0 ], 1, 'multiple uploads retain the last rendered frame' );
	GPU.frame ++;
	batch.data.fill( 4 ); batch.upload();
	assert.equal( writes.at( - 1 )[ 0 ], 3, 'next frame uses the final uploaded pose' );
	batch.resetMotion( 1 ); batch.upload();
	assert.equal( writes.at( - 1 )[ 16 ], 4, 'a newly shown fish does not inherit its parked pose' );
	assert.equal( writes.at( - 1 )[ 0 ], 3, 'spawn reset does not change another instance history' );

} finally {

	GPU.frame = frame;

}
console.log( 'Fish motion history passed: frame boundaries, repeated uploads and spawn reset.' );

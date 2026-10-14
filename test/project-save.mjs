import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createSaveMiddleware } from '../tools/project-save.mjs';
import { ProjectStorage } from '../src/game/ProjectStorage.js';
import { GameState } from '../src/game/GameState.js';
import { Guide } from '../src/game/Guide.js';
import { SAVE_KEY, GUIDE_KEY, MAX_SAVE_BYTES, validSaveValues } from '../src/game/SaveFormat.js';

const directory = await mkdtemp( join( tmpdir(), 'tidewater-save-' ) );
const file = join( directory, 'game-save.json' );
let server;
async function start() {

	const middleware = createSaveMiddleware( file );
	server = createServer( ( req, res ) => middleware( req, res, () => { res.writeHead( 404 ); res.end(); } ) );
	await new Promise( ( resolve ) => server.listen( 0, '127.0.0.1', resolve ) );
	return `http://127.0.0.1:${ server.address().port }`;

}
async function stop() {

	server.closeAllConnections();
	await new Promise( ( resolve ) => server.close( resolve ) );

}

try {

	let base = await start();
	const request = ( url, options ) => fetch( base + url, options );
	// A browser's obsolete local save is deliberately ignored, even on first launch.
	globalThis.localStorage = { getItem() { throw new Error( 'must not read browser saves' ); } };
	const status = [];
	const first = await new ProjectStorage( { fetch: request, onStatus: ( value ) => status.push( value ) } ).load();
	const game = new GameState( first );
	assert.equal( game.load(), true );
	assert.equal( game.money, 0 );
	game.addFish( 'grunt', 0.84, 9.5 );
	game.sell();
	game.money = 1000;
	game.buy( 'hold' );
	game.buy( 'reel' );
	game.burn( 12 );
	game.save();
	// Guide uses the very same production adapter without needing a DOM.
	const guide = Object.create( Guide.prototype );
	guide.game = { state: game };
	guide.seen = { intro: true, caught: true };
	guide._save();
	assert.equal( await first.flush(), true );
	const saved = JSON.parse( await readFile( file, 'utf8' ) );
	assert.equal( JSON.parse( saved.values[ SAVE_KEY ] ).fuel, 28 );
	assert.equal( JSON.parse( saved.values[ GUIDE_KEY ] ).intro, true );
	assert.deepEqual( ( await readdir( directory ) ), [ 'game-save.json' ], 'atomic writes leave no temporary files' );

	// An independent browser has no shared memory or localStorage, only the same HTTP server.
	const second = await new ProjectStorage( { fetch: request } ).load();
	const otherGame = new GameState( second );
	otherGame.load();
	assert.deepEqual( otherGame.toJSON(), game.toJSON() );
	guide.game = { state: otherGame };
	assert.deepEqual( guide._load(), { intro: true, caught: true } );

	// Restart the server: facts come from the file, not a process cache.
	await stop();
	base = await start();
	const restarted = await new ProjectStorage( { fetch: request } ).load();
	assert.equal( restarted.getItem( SAVE_KEY ), first.getItem( SAVE_KEY ) );

	otherGame.addFish( 'yellowtail', 1.31 );
	assert.equal( await second.flush(), true );
	game.addFish( 'jack', 3.2 );
	assert.equal( await first.flush(), false );
	assert.equal( status.at( - 1 ), 'conflict' );
	assert.equal( first.conflicted, true );
	assert.equal( JSON.parse( JSON.parse( await readFile( file, 'utf8' ) ).values[ SAVE_KEY ] ).inventory[ 0 ].species, 'yellowtail', 'stale browser cannot overwrite newer data' );

	// Recover a failed request, including a committed write whose response was lost.
	let fail = false, loseResponse = false;
	const retrying = await new ProjectStorage( { fetch: async ( url, options ) => {

		if ( fail ) throw new Error( 'offline' );
		const response = await request( url, options );
		if ( loseResponse ) { loseResponse = false; throw new Error( 'response lost' ); }
		return response;

	} } ).load();
	const retryGame = new GameState( retrying );
	retryGame.load();
	fail = true;
	retryGame.sell();
	assert.equal( await retrying.flush(), false );
	assert.ok( retrying.pending );
	fail = false;
	loseResponse = true;
	assert.equal( await retrying.flush(), false );
	assert.equal( await retrying.flush(), true );
	assert.equal( retrying.pending, null );

	const put = ( body, headers = {} ) => request( '/api/game-save', { method: 'PUT', headers: { 'X-Tidewater-Save': '1', ...headers }, body } );
	const before = await readFile( file, 'utf8' );
	assert.equal( ( await put( '{' ) ).status, 400 );
	const values = { ...retrying.values };
	const invalid = JSON.parse( values[ SAVE_KEY ] );
	invalid.money = - 1;
	values[ SAVE_KEY ] = JSON.stringify( invalid );
	assert.equal( ( await put( JSON.stringify( { revision: retrying.revision, values } ) ) ).status, 400 );
	assert.equal( ( await put( JSON.stringify( { revision: retrying.revision, values: retrying.values } ), { Origin: 'https://foreign.example' } ) ).status, 403 );
	assert.equal( ( await put( 'x'.repeat( MAX_SAVE_BYTES + 1 ) ) ).status, 413 );
	assert.equal( await readFile( file, 'utf8' ), before );

	// Concurrent writes at the same revision admit one winner, never both.
	const a = JSON.parse( retrying.getItem( SAVE_KEY ) ), b = structuredClone( a );
	a.money ++; b.money += 2;
	const results = await Promise.all( [ a, b ].map( ( d ) => put( JSON.stringify( { revision: retrying.revision, values: { ...retrying.values, [ SAVE_KEY ]: JSON.stringify( d ) } } ) ) ) );
	assert.deepEqual( results.map( ( r ) => r.status ).sort(), [ 200, 409 ] );

	// Overflow decisions survive independent browsers/reload. Closing after explicit
	// releases keeps the same pending ID, without a second journal count.
	const carrying = await new ProjectStorage( { fetch: request } ).load();
	const carryingGame = new GameState( carrying ); carryingGame.load();
	carryingGame.sell();
	carryingGame.upgrades.hold = 0;
	const oldFish = carryingGame.addFish( 'grouper', 28 );
	carryingGame.addFish( 'tarpon', 4, 18, true );
	const pending = { ...carryingGame.pendingCatch };
	assert.equal( carryingGame.holdKg, 28 );
	assert.throws( () => carryingGame.addFish( 'grunt', 1, 18, true ), /先处理/ );
	assert.equal( await carrying.flush(), true );
	const resumed = await new ProjectStorage( { fetch: request } ).load();
	const resumedGame = new GameState( resumed ); resumedGame.load();
	assert.deepEqual( resumedGame.pendingCatch, pending );
	assert.equal( resumedGame.boxKg, 32 );
	assert.equal( resumedGame.finishCapacityReview(), false );
	resumedGame.release( oldFish.id );
	assert.equal( resumedGame.pendingCatch.id, pending.id );
	assert.equal( resumedGame.finishCapacityReview(), true );
	assert.equal( resumedGame.pendingCatch, null );
	assert.equal( resumedGame.log.tarpon.count, 1 );
	assert.deepEqual( resumedGame.inventory, [ pending ] );
	assert.equal( await resumed.flush(), true );
	resumedGame.addFish( 'grouper', 26 );
	resumedGame.addFish( 'jack', 5, 18, true );
	assert.equal( resumedGame.holdKg, 30 );
	assert.equal( await resumed.flush(), true );
	const pendingValues = { ...resumed.values };
	const duplicate = JSON.parse( pendingValues[ SAVE_KEY ] );
	duplicate.pendingCatch.id = duplicate.inventory[ 0 ].id;
	assert.equal( validSaveValues( { ...pendingValues, [ SAVE_KEY ]: JSON.stringify( duplicate ) } ), false );
	duplicate.pendingCatch.id = duplicate.nextId;
	assert.equal( validSaveValues( { ...pendingValues, [ SAVE_KEY ]: JSON.stringify( duplicate ) } ), false );
	const oldFormat = JSON.parse( pendingValues[ SAVE_KEY ] ); delete oldFormat.pendingCatch; delete oldFormat.capacityReview;
	assert.equal( validSaveValues( { ...pendingValues, [ SAVE_KEY ]: JSON.stringify( oldFormat ) } ), true );
	const deciding = await new ProjectStorage( { fetch: request } ).load();
	const decidingGame = new GameState( deciding ); decidingGame.load();
	const currentId = decidingGame.pendingCatch.id;
	decidingGame.release( currentId );
	assert.equal( decidingGame.pendingCatch, null );
	assert.equal( decidingGame.holdKg, 30 );
	assert.equal( decidingGame.log.jack.count, 1 );
	assert.equal( decidingGame.finishCapacityReview(), false, 'exactly at the limit still requires a release' );
	decidingGame.release( decidingGame.inventory.find( fish => fish.species === 'tarpon' ).id );
	assert.equal( decidingGame.finishCapacityReview(), true );
	assert.equal( decidingGame.finishCapacityReview(), true, 'duplicate close is harmless' );
	assert.equal( await deciding.flush(), true );
	const keptRecord = JSON.parse( ( await new ProjectStorage( { fetch: request } ).load() ).getItem( SAVE_KEY ) );
	assert.equal( keptRecord.pendingCatch, null );
	assert.equal( keptRecord.inventory.length, 1 );

	// A damaged file fails closed and stays byte-for-byte unchanged.
	await writeFile( file, '{broken' );
	await assert.rejects( new ProjectStorage( { fetch: request } ).load() );
	assert.equal( ( await put( JSON.stringify( { revision: 0, values: retrying.values } ) ) ).status, 500 );
	assert.equal( await readFile( file, 'utf8' ), '{broken' );
	console.log( 'Project saves passed: pending catch reload/accept/release, backward compatibility, independent browsers, restart, conflicts, retry, validation and corrupt-file protection.' );

} finally {

	delete globalThis.localStorage;
	if ( server?.listening ) await stop();
	await rm( directory, { recursive: true, force: true } );

}

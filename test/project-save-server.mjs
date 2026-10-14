import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, preview } from 'vite';
import config from '../vite.config.js';
import { ProjectStorage } from '../src/game/ProjectStorage.js';
import { GameState } from '../src/game/GameState.js';

const root = await mkdtemp( join( tmpdir(), 'tidewater-vite-save-' ) );
let dev, built;
const requestAt = ( address ) => ( path, options ) => fetch( new URL( path, address ), options );
try {

	await writeFile( join( root, 'index.html' ), '<html>save-test</html>' );
	await mkdir( join( root, 'dist' ) );
	await writeFile( join( root, 'dist', 'index.html' ), '<html>preview-test</html>' );
	const options = {

		...config, configFile: false, root, logLevel: 'silent',
		server: { ...config.server, port: 0 }, preview: { ...config.preview, port: 0 },
		optimizeDeps: { noDiscovery: true, entries: [] },

	};
	dev = await createServer( options );
	await dev.listen();
	const devAddress = dev.resolvedUrls.local[ 0 ];
	const storage = await new ProjectStorage( { fetch: requestAt( devAddress ) } ).load();
	const game = new GameState( storage );
	game.load();
	game.addFish( 'grunt', 0.84 );
	game.sell();
	assert.equal( await storage.flush(), true );
	assert.equal( ( await fetch( new URL( '/data/game-save.json', devAddress ) ) ).status, 403, 'raw save files are blocked by the actual Vite config' );
	await dev.close();
	dev = null;
	built = await preview( options );
	const previewAddress = built.resolvedUrls.local[ 0 ];
	assert.match( await ( await fetch( previewAddress ) ).text(), /preview-test/ );
	const restored = await new ProjectStorage( { fetch: requestAt( previewAddress ) } ).load();
	const restoredGame = new GameState( restored );
	restoredGame.load();
	assert.deepEqual( restoredGame.toJSON(), game.toJSON(), 'preview reads the same project save created by dev' );
	restoredGame.addFish( 'jack', 3.2 );
	assert.equal( await restored.flush(), true );
	const independent = await new ProjectStorage( { fetch: requestAt( previewAddress ) } ).load();
	assert.equal( independent.getItem( 'tidewater.save.v1' ), restored.getItem( 'tidewater.save.v1' ) );
	console.log( 'Vite dev/preview passed: project saves shared across server restarts and raw file access blocked.' );

} finally {

	if ( dev ) await dev.close();
	if ( built ) {

		built.httpServer.closeAllConnections();
		await new Promise( ( resolve ) => built.httpServer.close( resolve ) );

	}
	await rm( root, { recursive: true, force: true } );

}

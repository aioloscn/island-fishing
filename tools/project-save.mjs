import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MAX_SAVE_BYTES, SAVE_ENDPOINT, validSaveRecord, validSaveValues } from '../src/game/SaveFormat.js';

function reply( res, status, data ) {

	res.writeHead( status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } );
	res.end( JSON.stringify( data ) );

}

// One middleware instance is shared by dev/preview. Serialize the read/check/rename transaction;
// a stale browser must never replace a newer save with its cached state.
export function createSaveMiddleware( file ) {

	let tail = Promise.resolve(), queued = 0;
	async function read() {

		let raw;
		try { raw = await readFile( file, 'utf8' ); }
		catch ( error ) { if ( error.code === 'ENOENT' ) return null; throw error; }
		const record = JSON.parse( raw );
		if ( ! validSaveRecord( record ) ) throw new Error( 'Invalid project save' );
		return record;

	}
	return async ( req, res, next ) => {

		if ( req.url.split( '?' )[ 0 ] !== SAVE_ENDPOINT ) return next();
		// No CORS access: only the page served by this local server may read/write the file.
		const origin = req.headers.origin;
		if ( origin && origin !== `http://${ req.headers.host }` && origin !== `https://${ req.headers.host }` ) return reply( res, 403, { error: '不允许跨来源访问存档' } );
		if ( req.method !== 'GET' && req.method !== 'PUT' ) return reply( res, 405, { error: '不支持的请求方法' } );
		if ( req.method === 'PUT' && req.headers[ 'x-tidewater-save' ] !== '1' ) return reply( res, 403, { error: '缺少存档请求标记' } );
		if ( queued >= 16 ) return reply( res, 503, { error: '存档请求过多，请稍后重试' } );
		queued ++;
		let body;
		try {

			if ( req.method === 'PUT' ) {

				let size = 0;
				const chunks = [];
				for await ( const chunk of req ) {

					size += chunk.length;
					if ( size > MAX_SAVE_BYTES ) { reply( res, 413, { error: '存档过大' } ); return; }
					chunks.push( chunk );

				}
				try { body = JSON.parse( Buffer.concat( chunks ).toString( 'utf8' ) ); }
				catch { reply( res, 400, { error: '无效的存档 JSON' } ); return; }
				if ( ! body || ! Number.isSafeInteger( body.revision ) || body.revision < 0 || ! validSaveValues( body.values ) ) {

					reply( res, 400, { error: '存档字段无效' } ); return;

				}

			}
			const operation = tail.then( async () => {

				const current = await read();
				if ( req.method === 'GET' ) return reply( res, 200, current );
				// Retrying a write whose response was lost is harmless.
				if ( current && JSON.stringify( current.values ) === JSON.stringify( body.values ) ) return reply( res, 200, current );
				if ( body.revision !== ( current?.revision ?? 0 ) ) return reply( res, 409, { error: '存档已被其他窗口更新，请刷新后继续' } );
				const record = { version: 1, revision: body.revision + 1, values: body.values };
				const temporary = `${ file }.${ randomUUID() }.tmp`;
				await mkdir( dirname( file ), { recursive: true } );
				try {

					await writeFile( temporary, JSON.stringify( record, null, 2 ) + '\n', { flag: 'wx' } );
					await rename( temporary, file );

				} finally { await rm( temporary, { force: true } ); }
				reply( res, 200, record );

			} );
			tail = operation.catch( () => {} );
			await operation;

		} catch ( error ) {

			console.error( '[project-save]', error.message );
			if ( ! res.headersSent ) reply( res, 500, { error: '项目存档读写失败，请检查 data/game-save.json 和目录权限' } );

		} finally { queued --; }

	};

}

export function projectSavePlugin() {

	let middleware;
	return {

		name: 'tidewater-project-save',
		configResolved( config ) { middleware = createSaveMiddleware( join( config.root, 'data', 'game-save.json' ) ); },
		configureServer( server ) { server.middlewares.use( middleware ); },
		configurePreviewServer( server ) { server.middlewares.use( middleware ); },

	};

}

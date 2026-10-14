import { GameState } from './GameState.js';
import { SAVE_KEY, GUIDE_KEY, SAVE_ENDPOINT, validSaveRecord, validSaveValues } from './SaveFormat.js';

// The synchronous cache keeps gameplay responsive; writes are serial and retain only the latest
// pending snapshot. Loading must finish before Game/Guide can mutate this shared save.
export class ProjectStorage {

	constructor( { fetch: request = globalThis.fetch.bind( globalThis ), onStatus = () => {} } = {} ) {

		this.request = request;
		this.onStatus = onStatus;
		this.values = {};
		this.revision = 0;
		this.pending = null;
		this.inflight = null;
		this.conflicted = false;

	}

	async readResponse( response ) {

		if ( ! response.ok ) {

			const error = new Error( response.status === 409 ? '存档已被其他窗口更新，请刷新后继续。' : '项目存档暂时不可用。' );
			error.conflict = response.status === 409;
			throw error;

		}
		const record = await response.json();
		if ( record !== null && ! validSaveRecord( record ) ) throw new Error( '项目存档格式无效，请检查 data/game-save.json。' );
		return record;

	}

	async write( values ) {

		const body = JSON.stringify( { revision: this.revision, values } );
		const response = await this.request( SAVE_ENDPOINT, {

			method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Tidewater-Save': '1' },
			body, keepalive: new TextEncoder().encode( body ).length < 60000,
			signal: AbortSignal.timeout( 10000 ),

		} );
		const record = await this.readResponse( response );
		if ( ! record ) throw new Error( '项目存档响应无效。' );
		return record;

	}

	async load() {

		let record = await this.readResponse( await this.request( SAVE_ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout( 10000 ) } ) );
		if ( ! record ) {

			const values = { [ SAVE_KEY ]: JSON.stringify( new GameState( null ).toJSON() ), [ GUIDE_KEY ]: '{}' };
			try { record = await this.write( values ); }
			catch ( error ) {

				if ( ! error.conflict ) throw error;
				// Another browser initialized first; no gameplay has started, so use its save.
				record = await this.readResponse( await this.request( SAVE_ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout( 10000 ) } ) );

			}

		}
		if ( ! record ) throw new Error( '无法读取项目存档。' );
		this.values = { ...record.values };
		this.revision = record.revision;
		return this;

	}

	getItem( key ) { return this.values[ key ] ?? null; }

	setItem( key, value ) {

		if ( this.values[ key ] === value ) return;
		const values = { ...this.values, [ key ]: value };
		if ( ! validSaveValues( values ) ) throw new Error( '无效的游戏存档' );
		this.values = values;
		this.pending = { ...values };
		void this.flush();

	}

	flush() {

		if ( this.inflight ) return this.inflight;
		if ( this.conflicted ) return Promise.resolve( false );
		this.inflight = this.drain().finally( () => { this.inflight = null; } );
		return this.inflight;

	}

	async drain() {

		while ( this.pending ) {

			const values = this.pending;
			try {

				const record = await this.write( values );
				this.revision = record.revision;
				if ( this.pending === values ) this.pending = null;
				this.onStatus( null );

			} catch ( error ) {

				this.conflicted = !! error.conflict;
				this.onStatus( this.conflicted ? 'conflict' : 'error' );
				return false; // Retain the pending snapshot for an explicit retry, without an endless loop.

			}

		}
		return true;

	}

}

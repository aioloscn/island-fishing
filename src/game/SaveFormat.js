import { FISH } from './FishTable.js';
import { UPGRADES } from './Gear.js';

export const SAVE_KEY = 'tidewater.save.v1';
export const GUIDE_KEY = 'tidewater.guide';
export const SAVE_ENDPOINT = '/api/game-save';
export const MAX_SAVE_BYTES = 1024 * 1024;

const object = ( v ) => v !== null && typeof v === 'object' && ! Array.isArray( v );
const nonnegative = ( v ) => Number.isFinite( v ) && v >= 0;
const positiveId = ( v ) => Number.isSafeInteger( v ) && v > 0;
const species = ( key ) => Object.hasOwn( FISH, key );

export function validFishEntry( f ) {

	return object( f ) && species( f.species ) && positiveId( f.id ) && nonnegative( f.kg ) && f.kg > 0 && nonnegative( f.cm ) && nonnegative( f.value ) && nonnegative( f.caughtAt ) && typeof f.record === 'boolean';

}

// Both the HTTP boundary and the client cache accept only the two known save records.
export function validSaveValues( values ) {

	if ( ! object( values ) || Object.keys( values ).some( ( key ) => key !== SAVE_KEY && key !== GUIDE_KEY ) ) return false;
	try {

		if ( typeof values[ SAVE_KEY ] !== 'string' ) return false;
		const d = JSON.parse( values[ SAVE_KEY ] );
		if ( ! object( d ) || d.v !== 1 || ! nonnegative( d.money ) || ! positiveId( d.nextId ) ) return false;
		if ( d.capacityReview !== undefined && typeof d.capacityReview !== 'boolean' ) return false;
		if ( ! Array.isArray( d.inventory ) || d.inventory.length > 2000 ) return false;
		const ids = new Set();
		for ( const f of d.inventory ) {

			if ( ! validFishEntry( f ) || ids.has( f.id ) || f.id >= d.nextId ) return false;
			ids.add( f.id );

		}
		// Optional for old v1 saves. A pending fish owns an ID but is not part of the box load.
		if ( d.pendingCatch !== undefined && d.pendingCatch !== null ) {

			const f = d.pendingCatch;
			if ( ! validFishEntry( f ) || ids.has( f.id ) || f.id >= d.nextId ) return false;

		}
		if ( ! object( d.log ) || Object.entries( d.log ).some( ( [ key, v ] ) => ! species( key ) || ! object( v ) || ! Number.isSafeInteger( v.count ) || v.count < 0 || ! nonnegative( v.bestKg ) || ! nonnegative( v.bestCm ) ) ) return false;
		if ( ! object( d.upgrades ) || Object.keys( d.upgrades ).some( ( key ) => ! Object.hasOwn( UPGRADES, key ) ) ) return false;
		for ( const [ key, track ] of Object.entries( UPGRADES ) ) {

			const level = d.upgrades[ key ];
			if ( ! Number.isInteger( level ) || level < 0 || level >= track.levels.length ) return false;

		}
		if ( d.fuel !== null && ! nonnegative( d.fuel ) ) return false;
		if ( values[ GUIDE_KEY ] !== undefined ) {

			if ( typeof values[ GUIDE_KEY ] !== 'string' ) return false;
			const seen = JSON.parse( values[ GUIDE_KEY ] );
			if ( ! object( seen ) || Object.keys( seen ).length > 32 || Object.values( seen ).some( ( v ) => typeof v !== 'boolean' ) ) return false;

		}
		return true;

	} catch { return false; }

}

export function validSaveRecord( record ) {

	return object( record ) && record.version === 1 && Number.isSafeInteger( record.revision ) && record.revision > 0 && validSaveValues( record.values );

}

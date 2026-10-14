import { FISH, fishValue, fishLengthCm } from './FishTable.js';
import { defaultUpgrades, gearStats, nextLevel, UPGRADES, FUEL_PRICE } from './Gear.js';
import { validFishEntry } from './SaveFormat.js';

const SAVE_KEY = 'tidewater.save.v1';

// Everything the player owns: wallet, the fish in the cooler / hold, the fish log and the gear
// levels. The game supplies a project-backed storage cache; tests/previews can use memory or null.
export class GameState {

	constructor( storage = null ) {

		this.storage = storage;
		this.money = 0;
		this.inventory = []; // { id, species, kg, cm, value, caughtAt (game hours), record }
		this.log = {}; // species -> { count, bestKg, bestCm }
		// the last addFish: { species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept } (the catch card)
		this.lastCatch = null;
		this.pendingCatch = null; // caught but awaiting room in the box; separate from its load
		this.capacityReview = false; // keep the box open until the player resolves an overflow
		this.upgrades = defaultUpgrades();
		this.fuel = null; // litres left (null = full tank)
		this._nextId = 1;
		this.listeners = new Set();

	}

	get stats() {

		return gearStats( this.upgrades );

	}

	get holdKg() {

		let kg = 0;
		for ( const f of this.inventory ) kg += f.kg;
		return kg;

	}

	get holdValue() {

		let v = 0;
		for ( const f of this.inventory ) v += f.value;
		return v;

	}

	get boxKg() {

		return this.holdKg + ( this.pendingCatch?.kg || 0 );

	}

	get canCloseInventory() {

		return ! this.capacityReview || this.boxKg < this.stats.holdKg - 1e-6;

	}

	// room in the cooler / hold for a fish of `kg`?
	fits( kg ) {

		return this.holdKg + kg <= this.stats.holdKg + 1e-6;

	}

	// Store a catch, or retain it as pending with deferOverflow; either path logs it once.
	// Legacy headless callers may leave deferOverflow off for immediate release on overflow.
	// A record beats an earlier catch of the species; the first one of a species is a new species.
	addFish( species, kg, timeOfDay = 12, deferOverflow = false ) {

		if ( this.capacityReview ) throw new Error( '请先处理超重的鱼获。' );
		kg = Math.round( kg * 100 ) / 100;
		const cm = Math.round( fishLengthCm( species, kg ) );
		const logEntry = this.log[ species ] || ( this.log[ species ] = { count: 0, bestKg: 0 } );
		const newSpecies = logEntry.count === 0;
		const prevBestKg = logEntry.bestKg, prevBestCm = logEntry.bestCm ?? ( prevBestKg > 0 ? Math.round( fishLengthCm( species, prevBestKg ) ) : 0 );
		const record = ! newSpecies && kg > prevBestKg;
		logEntry.count ++;
		if ( kg > prevBestKg ) {

			logEntry.bestKg = kg;
			logEntry.bestCm = cm;

		}

		const value = fishValue( species, kg );
		const kept = this.fits( kg );
		this.lastCatch = { species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept };
		const f = kept || deferOverflow ? { id: this._nextId ++, species, kg, cm, value, caughtAt: timeOfDay, record } : null;
		if ( ! kept ) {

			if ( deferOverflow ) {

				this.pendingCatch = f;
				this.capacityReview = true;
				this.lastCatch.pending = true;

			}
			this.save();
			this.emit();
			return null;

		}

		this.inventory.push( f );
		this.save();
		this.emit();
		return f;

	}

	// sell the given fish ids (all when omitted); returns the money made
	sell( ids = null ) {

		const keep = [], sold = [];
		for ( const f of this.inventory ) ( ids === null || ids.includes( f.id ) ? sold : keep ).push( f );
		let total = 0;
		for ( const f of sold ) total += f.value;
		this.inventory = keep;
		this.money += total;
		this.save();
		this.emit();
		return { total, count: sold.length };

	}

	release( id ) {

		this.inventory = this.inventory.filter( ( f ) => f.id !== id );
		if ( this.pendingCatch?.id === id ) {

			this.pendingCatch = null;
			if ( this.lastCatch?.pending ) this.lastCatch.pending = false;

		}
		this.save();
		this.emit();

	}

	// Resolve the decision only after the combined weight is below the current capacity.
	// The fish keeps its original ID and its journal record, regardless of which fish were released.
	finishCapacityReview() {

		if ( ! this.canCloseInventory ) return false;
		if ( ! this.capacityReview ) return true;
		const fish = this.pendingCatch;
		this.pendingCatch = null;
		if ( fish ) this.inventory.push( fish );
		if ( fish && this.lastCatch?.pending ) {

			this.lastCatch.pending = false;
			this.lastCatch.kept = true;

		}
		this.capacityReview = false;
		this.save();
		this.emit();
		return true;

	}

	// spend money (upgrade shop); false when it can't be afforded
	spend( amount ) {

		if ( amount > this.money ) return false;
		this.money -= amount;
		this.save();
		this.emit();
		return true;

	}

	// buy the next level of an upgrade track; returns the new level entry or null
	buy( key ) {

		if ( ! UPGRADES[ key ] ) return null;
		const next = nextLevel( this.upgrades, key );
		if ( ! next || next.cost > this.money ) return null;
		this.money -= next.cost;
		this.upgrades[ key ] = next.index;
		if ( key === 'fuel' ) this.fuel = null; // a new tank comes full
		this.save();
		this.emit();
		return next;

	}

	get fuelL() {

		return this.fuel === null ? this.stats.fuelL : Math.min( this.fuel, this.stats.fuelL );

	}

	// burn litres (no save: that happens when the boat stops or at the next sale / purchase)
	burn( litres ) {

		this.fuel = Math.max( 0, this.fuelL - litres );
		return this.fuel;

	}

	refuelCost() {

		return Math.ceil( ( this.stats.fuelL - this.fuelL ) * FUEL_PRICE );

	}

	// fill up as far as the money goes; returns litres bought
	refuel() {

		const missing = this.stats.fuelL - this.fuelL;
		const litres = Math.min( missing, Math.floor( this.money / FUEL_PRICE ) );
		if ( litres <= 0 ) return 0;
		this.money -= Math.ceil( litres * FUEL_PRICE );
		this.fuel = this.fuelL + litres;
		if ( this.fuel >= this.stats.fuelL - 1e-3 ) this.fuel = null;
		this.save();
		this.emit();
		return litres;

	}

	onChange( fn ) {

		this.listeners.add( fn );
		return () => this.listeners.delete( fn );

	}

	emit() {

		for ( const fn of this.listeners ) fn( this );

	}

	toJSON() {

		return { v: 1, money: this.money, inventory: this.inventory, log: this.log, upgrades: this.upgrades, fuel: this.fuel, nextId: this._nextId, pendingCatch: this.pendingCatch, capacityReview: this.capacityReview };

	}

	fromJSON( d ) {

		if ( ! d || d.v !== 1 ) return false;
		this.money = Number.isFinite( d.money ) ? d.money : 0;
		this.inventory = Array.isArray( d.inventory ) ? d.inventory.filter( ( f ) => f && FISH[ f.species ] && Number.isFinite( f.kg ) ) : [];
		// saves from before lengths were recorded
		for ( const f of this.inventory ) if ( ! Number.isFinite( f.cm ) ) f.cm = Math.round( fishLengthCm( f.species, f.kg ) );
		this.log = d.log && typeof d.log === 'object' ? d.log : {};
		for ( const [ k, v ] of Object.entries( this.log ) ) if ( FISH[ k ] && v && v.bestKg > 0 && ! Number.isFinite( v.bestCm ) ) v.bestCm = Math.round( fishLengthCm( k, v.bestKg ) );
		this.upgrades = { ...defaultUpgrades(), ...( d.upgrades || {} ) };
		this.fuel = Number.isFinite( d.fuel ) ? d.fuel : null;
		const pending = d.pendingCatch;
		this.pendingCatch = validFishEntry( pending ) && ! this.inventory.some( ( f ) => f.id === pending.id ) ? { ...pending } : null;
		this.capacityReview = d.capacityReview === true || !! this.pendingCatch;
		this.lastCatch = null;
		this._nextId = Math.max( d.nextId | 0, ...this.inventory.map( ( f ) => f.id + 1 ), ( this.pendingCatch?.id || 0 ) + 1, 1 );
		return true;

	}

	save() {

		if ( ! this.storage ) return;
		try {

			this.storage.setItem( SAVE_KEY, JSON.stringify( this.toJSON() ) );

		} catch ( e ) { console.error( '[game-save]', e.message ); }

	}

	load() {

		if ( ! this.storage ) return false;
		try {

			const raw = this.storage.getItem( SAVE_KEY );
			return raw ? this.fromJSON( JSON.parse( raw ) ) : false;

		} catch ( e ) {

			return false;

		}

	}

	reset() {

		this.money = 0;
		this.inventory = [];
		this.log = {};
		this.pendingCatch = null;
		this.capacityReview = false;
		this.lastCatch = null;
		this.upgrades = defaultUpgrades();
		this.fuel = null;
		this.save();
		this.emit();

	}

}

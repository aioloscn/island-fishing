import { Vector3, Color } from '../engine/index.js';
import { WORLD } from '../world/WorldLayout.js';
import { FISH } from './FishTable.js';
import { habitatAt, pickSpecies, rollWeight, biteDelay } from './Bites.js';
import { CatchMinigame } from './CatchMinigame.js';
import { GameState } from './GameState.js';
import { FishingRod } from './FishingRod.js';
import { FishStand } from './FishStand.js';
import { Chandlery } from './Chandlery.js';
import { CatchDisplay, fishLength } from './CatchDisplay.js';
import { UPGRADES, fuelBurn } from './Gear.js';
import { GameHUD } from './GameHUD.js';
import { Minimap } from './Minimap.js';
import { Guide } from './Guide.js';

const MIN_FISHING_UP = Math.cos( Math.PI / 3 ); // beyond 60 degrees the deck is unsafe for fishing
const _boatUp = new Vector3();
const BIG_FISH_TEST_CATCH = Object.freeze( { species: 'tarpon', kg: 35 } );

// The fishing game on top of the world:
//   R          take out / put away the rod (on foot, on the pier, on the boat's deck)
//   hold LMB   wind up, release to cast (hold longer = farther)
//   LMB        strike when a fish takes the bobber ("!"); then hold LMB to reel, let go to ease off
//   RMB        reel an empty line back in
//   I / Tab    cooler / hold contents and the fish log
//   E          at the fish stand: sell your catch
export class Game {

	constructor( app ) {

		this.app = app;
		this.state = new GameState( app.gameStorage );
		this.state.load();
		this.rod = new FishingRod( { scene: app.scene, camera: app.camera, query: app.query, terrain: app.terrainData, audio: app.audio } );
		this.rod.onLand = ( where ) => this.onBobberLanded( where );
		this.stand = new FishStand( { scene: app.scene, terrain: app.terrainData, colliders: app.colliders } );
		this.display = new CatchDisplay( { scene: app.scene, stall: this.stand.iceFish() } );
		this.landing = null; // { species, kg } while the caught fish swings in view
		this.chandlery = new Chandlery( { scene: app.scene, terrain: app.terrainData, colliders: app.colliders, material: this.stand.material } );
		this.vendors = [ this.stand.vendor, this.chandlery.vendor ];
		// boat upgrades: engine (thrust / top speed) and deck floodlights for night fishing
		const b = app.boatCtl;
		this._engineBase = { maxThrust: b.maxThrust, pitchSpeed: b.pitchSpeed };
		this.floods = [];
		if ( app.localLights ) this.addFloodlights( app.localLights, app.boat );
		this._fuelOut = false;
		this._sonarT = 0;
		this._sonar = null;
		this.hud = null;
		this.fight = null; // CatchMinigame while a fish is on
		this.bite = null; // { phase: 'wait' | 'nibble' | 'take', t, nibbles, species, kg }
		this.bigFishTest = false; // session-only, hidden B shortcut; keep the actual fight/gear rules
		this._lmb = false;
		this._rmb = false;
		this._hookedSpecies = null;
		this._pier = WORLD.pier;
		this._tmp = new Vector3();
		this.applyGear();
		this.state.onChange( () => this.applyGear() );
		if ( typeof window !== 'undefined' ) {

			window.addEventListener( 'pagehide', () => this.state.save() );
			document.addEventListener( 'visibilitychange', () => { if ( document.hidden ) this.state.save(); } );

		}

	}

	applyGear() {

		const g = this.state.stats;
		this.rod.setGear( { castM: g.castM, reelSpeed: g.reelSpeed } );
		const b = this.app.boatCtl;
		if ( b && this._engineBase ) {

			b.maxThrust = this._engineBase.maxThrust * g.speedMul * g.speedMul;
			b.pitchSpeed = this._engineBase.pitchSpeed * g.speedMul;

		}

		for ( const f of this.floods || [] ) f.scale = g.deckLights ? 1 : 0;

	}

	// two floodlights under the back of the wheelhouse roof, lighting the cockpit and the water
	// astern (night only, like every local light; switched by the lights upgrade)
	addFloodlights( lights, boat ) {

		const obj = boat.group;
		for ( const x of [ - 0.8, 0.8 ] ) {

			const local = new Vector3( x, 2.25, - 1.0 );
			const localDir = new Vector3( x * 0.25, - 0.75, - 0.62 ).normalize();
			const src = {
				position: new Vector3(), color: new Color( 1.0, 0.93, 0.8 ), intensity: 3.2, range: 14, kind: 'boatFlood',
				dir: new Vector3(), cosInner: 0.8, cosOuter: 0.45, scale: 0,
				update() {

					obj.updateWorldMatrix( true, false );
					this.position.copy( local ).applyMatrix4( obj.matrixWorld );
					this.dir.copy( localDir ).transformDirection( obj.matrixWorld );

				},
			};
			src.update();
			this.floods.push( src );
			lights.add( src );

		}

	}

	buy( key ) {

		const r = this.state.buy( key );
		if ( r ) this.toast( `${ UPGRADES[ key ].name }: ${ r.label }` );
		return r;

	}

	refuel() {

		const l = this.state.refuel();
		if ( l > 0 ) {

			this._fuelOut = false;
			this.toast( `已加油 · ${ l.toFixed( 0 ) } 升` );

		}

		return l;

	}

	toast( text, ms = 2600 ) {

		if ( this.hud ) this.hud.toast( text, ms );
		else console.log( '[game]', text );

	}

	get canFish() {

		const app = this.app, p = app.player;
		if ( app.freeCam || ( p.mode !== 'walk' && p.mode !== 'deck' ) || app.ui?.ui?._photo ) return false;
		if ( p.mode === 'deck' ) {

			// Deck movement stays attached to the boat even when it overturns. Check the hull's
			// actual up direction, rather than the player's partly stabilized camera orientation.
			const orientation = app.boatCtl?.quaternion;
			if ( orientation && _boatUp.set( 0, 1, 0 ).applyQuaternion( orientation ).y < MIN_FISHING_UP ) return false;
			if ( app.camera.position.y < ( app.cameraWaterHeight ?? 0 ) - 0.1 ) return false;

		}
		return true;

	}

	// ---- per frame (after the player / camera update)
	update( dt ) {

		const app = this.app, p = app.player, inp = app.input, rod = this.rod;
		this._cardDismissed = false;
		if ( inp.hit( 'KeyB' ) ) this.bigFishTest = ! this.bigFishTest;
		if ( ! this.hud && app.ui && app.ui.ui && typeof document !== 'undefined' && document.head ) {

			const ui = app.ui.ui;
			this.hud = new GameHUD( ui, this );
			// the minimap (lower right) and the first-play guide (intro, one-time tips; replay from F1)
			this.minimap = new Minimap( ui.hud || ui.root, this );
			this.guide = new Guide( ui, this, this.minimap );
			ui.onReplayGuide = () => this.guide.replay();
			if ( this.state.capacityReview ) this.hud.toggleInventory( true );

		}

		const can = this.canFish;
		if ( inp.hit( 'KeyR' ) && can && ! this.fight && ! this.landing && ! this.state.capacityReview ) {

			rod.equip( ! rod.equipped );
			if ( ! rod.equipped ) this.cancelLine();
			this.toast( rod.equipped ? '已拿出鱼竿 · 按住左键蓄力抛竿' : '已收起鱼竿', 1600 );

		}

		if ( ! can && rod.equipped ) {

			if ( p.mode === 'deck' && ! app.freeCam && ! app.ui?.ui?._photo ) this.toast( '船体严重倾斜或已入水，已停止钓鱼', 3500 );
			// Losing a safe fishing position cancels the fight before it can award a catch.
			this.cancelLine( true );
			rod.equip( false );

		}

		if ( this.hud && ( ! this.landing || this.state.capacityReview ) && ( inp.hit( 'KeyI' ) || inp.hit( 'Tab' ) ) ) this.hud.toggleInventory();
		if ( this.hud && inp.hit( 'Escape' ) ) {

			if ( this.hud.journalOpen ) this.hud.closeJournal( true );
			else {

				this.hud.toggleInventory( false );
				this.hud.closeStand();

			}

		}

		// mouse edges (the left button also looks around while the pointer isn't captured)
		const lmb = inp.mouseDown && inp.enabled, rmb = inp.rightDown && inp.enabled;
		const lDown = lmb && ! this._lmb, lUp = ! lmb && this._lmb, rDown = rmb && ! this._rmb;
		this._lmb = lmb;
		this._rmb = rmb;
		const panelOpen = this.hud && ( this.hud.invOpen || this.hud.standOpen || this.hud.journalOpen );

		if ( rod.equipped && ! panelOpen && ! this.state.capacityReview && ! this._cardDismissed ) {

			if ( rod.state === 'idle' && lDown ) rod.startWindup();
			else if ( rod.state === 'windup' && lUp ) rod.release();
			else if ( rod.state === 'floating' ) {

				if ( lDown ) this.strike();
				else if ( rDown ) {

					rod.retrieve();
					this.bite = null;

				}

			} else if ( rod.state === 'flying' && rDown ) rod.retrieve();

		}

		// bites and the fight
		if ( rod.state === 'floating' ) this.updateBite( dt );
		else if ( ! this.fight ) rod.dip = Math.max( 0, rod.dip - dt * 4 );
		if ( this.fight ) this.updateFight( dt, lmb && ! panelOpen );

		rod.update( dt, { visible: can, fight: this.fight } );
		// 鱼获信息只覆盖文字，鱼始终挂在场景中的鱼线上；收线时按住的鼠标不能立即收起鱼获。
		const L = this.landing;
		if ( L && rod.state === 'landing' && can ) {

			const c = app.camera.position, m = rod.bobber;
			let yaw = Math.atan2( c.x - m.x, c.z - m.z );
			if ( L.card && ! this.state.capacityReview ) {

				if ( ! L.shown && rod.t >= 0.6 ) {

					L.shown = true;
					this.hud.showCatch( L.card );

				} else if ( L.shown ) {

					// a slow turn so both flanks show
					L.cardT += dt;
					yaw += Math.sin( L.cardT * 0.7 ) * 0.55;
					if ( lDown || inp.hit( 'KeyE' ) || inp.hit( 'Escape' ) ) {

						this._cardDismissed = true; // this frame's E / click belong to the card
						this.endLanding();

					}

				}

			}

			if ( this.landing ) {

				this.display.show( L.species, L.kg, m, yaw, dt );
				if ( ! L.card && rod.t > 2.8 ) this.endLanding();

			}

		} else if ( this.landing || this.display.shown ) this.endLanding();

		p.busy = rod.lineInWater || rod.state === 'windup';

		this.updateBoat( dt );

		// the traders
		for ( const v of this.vendors ) v.update( dt, p.mode === 'walk' ? p.position : null );
		this.updateVendors( inp, p );

		// prompts when the player has nothing to say
		if ( ! p.prompt && can ) p.prompt = this.prompt();

		const aboard = p.mode === 'boat' || p.mode === 'deck';
		// 图鉴缩略图在独立的摄影棚中生成，不覆盖场景中的鱼获。
		if ( this.hud && this.hud.portrait ) this.hud.portrait.update( dt );
		if ( this.hud ) this.hud.update( {
			fuel: aboard ? { litres: this.state.fuelL, tank: this.state.stats.fuelL } : null,
			sonar: aboard && this.state.stats.finder ? this._sonar : null,
			fight: this.fight,
			casting: rod.state === 'windup',
			power: rod.power,
			bite: this.bite && this.bite.phase === 'take',
		} );
		if ( this.minimap ) this.minimap.update( dt );
		if ( this.guide ) this.guide.update( dt );

	}

	prompt() {

		const rod = this.rod, p = this.app.player;
		if ( ! rod.equipped ) {

			// by the water (boat deck, pier, the wet beach, wading): suggest the rod
			const byWater = p.mode === 'deck' || ( p.mode === 'walk' && [ 'wood', 'wetsand', 'water' ].includes( p.surface ) );
			return byWater ? { key: 'R', text: '拿出鱼竿' } : null;

		}

		const b = this.bite;
		switch ( rod.state ) {

			case 'idle': return { key: '左键', text: '按住蓄力，松开抛竿   ·   R 收起鱼竿' };
			case 'windup': return { key: '左键', text: '松开抛竿（蓄力越久，抛得越远）' };
			case 'flying': return null;
			case 'floating':
				if ( b && b.phase === 'take' ) return { key: '左键', text: '现在扬竿！' };
				if ( b && b.phase === 'nibble' ) return { key: '…', text: '鱼在试探 · 等浮漂被拉入水下' };
				return { key: '右键', text: '等待咬钩 · 右键收回鱼线' };
			case 'retrieving': return { key: '右键', text: '正在收线' };
			case 'fighting': return this.fight && this.fight.tension > this.fight.band[ 1 ]
				? { key: '左键', text: '张力过高 · 快松手！' }
				: { key: '左键', text: '按住收线 · 张力变红时松手' };
			case 'landing': return null;
			default: return null;

		}

	}

	// fuel burn at the helm (the engine stops when the tank is dry) and the fish finder
	updateBoat( dt ) {

		const app = this.app, b = app.boatCtl, p = app.player, s = this.state;
		if ( b.driven ) {

			const left = s.burn( fuelBurn( b.rpm ) * dt );
			this._fuelSaveT = ( this._fuelSaveT || 0 ) + dt;
			if ( this._fuelSaveT >= 10 ) { s.save(); this._fuelSaveT = 0; }
			if ( left <= 0 ) {

				b.throttle = 0;
				if ( ! this._fuelOut ) this.toast( '燃油耗尽 · 到船屋旁的船具店购买柴油', 4000 );
				this._fuelOut = true;

			}

		} else if ( this._wasDriven ) s.save();
		this._wasDriven = b.driven;

		if ( ( p.mode === 'boat' || p.mode === 'deck' ) && s.stats.finder ) {

			this._sonarT -= dt;
			if ( this._sonarT <= 0 ) {

				this._sonarT = 0.5;
				const x = b.position.x, z = b.position.z;
				const depth = Math.max( 0, - app.terrainData.heightAt( x, z ) );
				const h = this.habitatAtPoint( x, z, depth );
				let rich = 0;
				for ( const k in h ) rich += h[ k ];
				this._sonar = { depth, fish: Math.min( 1, rich / 1.4 ) };

			}

		}

	}

	updateVendors( inp, p ) {

		const hud = this.hud;
		let near = null;
		if ( p.mode === 'walk' ) for ( const v of this.vendors ) if ( v.inRange( p.position ) ) near = v;
		for ( const v of this.vendors ) v.talking = !! ( hud && hud.standOpen && hud.vendor === v );
		if ( hud && hud.standOpen && ( ! near || near !== hud.vendor ) ) hud.closeStand();
		if ( ! near || this.fight || this.state.capacityReview || this._cardDismissed || ( hud && ( hud.catchOpen || hud.journalOpen ) ) ) return;
		if ( ! p.prompt ) p.prompt = { key: 'E', text: hud && hud.standOpen ? '离开' : `与商贩交谈：${ near.name.split( ' ·' )[ 0 ] }` };
		if ( inp.hit( 'KeyE' ) ) {

			if ( ! hud ) {

				if ( near.kind === 'buyer' ) this.sellAll(); // headless: straight sale

			} else if ( hud.standOpen ) hud.closeStand();
			else hud.openStand( near );

		}

	}

	sellAll() {

		const r = this.state.sell();
		if ( r.count ) this.toast( `卖出 ${ r.count } 条鱼，收入 $${ r.total }` );
		if ( this.app.audio && this.app.audio.coin ) this.app.audio.coin();
		return r;

	}

	sell( ids ) {

		const r = this.state.sell( ids );
		if ( r.count ) this.toast( `出售收入 $${ r.total }` );
		return r;

	}

	// ---- bites
	habitat() {

		return this.habitatAtPoint( this.rod.bobber.x, this.rod.bobber.z, this.rod.depth );

	}

	habitatAtPoint( x, z, depth ) {

		const b = { x, z };
		const reef = WORLD.reef;
		const reefDist = Math.hypot( b.x - reef.center.x, b.z - reef.center.z ) - reef.radius;
		const P = this._pier;
		const rect = ( x0, x1, z0, z1 ) => Math.hypot( Math.max( x0 - b.x, 0, b.x - x1 ), Math.max( z0 - b.z, 0, b.z - z1 ) );
		const walk = rect( P.x - P.width / 2, P.x + P.width / 2, P.zStart, P.zEnd );
		const head = rect( P.x - P.headWidth / 2, P.x + P.headWidth / 2, P.zEnd - P.headDepth, P.zEnd );
		return habitatAt( { depth, reefDist, pierDist: Math.min( walk, head ) } );

	}

	get hour() {

		return this.app.settings.timeOfDay;

	}

	onBobberLanded( where ) {

		if ( where !== 'water' ) {

			this.toast( '浮漂落在了沙滩上', 1400 );
			return;

		}

		this.bite = { phase: 'wait', t: biteDelay( this.habitat(), this.hour ) };

	}

	updateBite( dt ) {

		const rod = this.rod;
		const b = this.bite;
		if ( ! b ) return;
		b.t -= dt;
		// bobber motion for the cues
		if ( b.phase === 'nibble' ) rod.dip = Math.max( 0, Math.sin( Math.min( 1, ( b.pulse || 0 ) ) * Math.PI ) * 0.45 );
		else if ( b.phase === 'take' ) rod.dip += ( 1.4 - rod.dip ) * ( 1 - Math.exp( - dt * 14 ) );
		else rod.dip = Math.max( 0, rod.dip - dt * 3 );
		if ( b.phase === 'nibble' ) b.pulse = ( b.pulse || 0 ) + dt * 3.2;

		if ( b.t > 0 ) return;
		if ( b.phase === 'wait' ) {

			const h = this.habitat();
			const species = this.bigFishTest ? BIG_FISH_TEST_CATCH.species : pickSpecies( h, this.hour );
			if ( ! species ) {

				b.t = 8;
				return;

			}

			b.species = species;
			b.kg = this.bigFishTest ? BIG_FISH_TEST_CATCH.kg : rollWeight( species );
			b.phase = 'nibble';
			b.nibbles = 1 + Math.floor( Math.random() * 3 );
			b.t = 0.7 + Math.random() * 0.8;
			b.pulse = 0;

		} else if ( b.phase === 'nibble' ) {

			b.nibbles --;
			b.pulse = 0;
			if ( b.nibbles > 0 ) b.t = 0.6 + Math.random() * 1.0;
			else {

				b.phase = 'take';
				// big, strong fish give a (slightly) shorter window
				b.t = 2.4 - FISH[ b.species ].fight * 0.5;
				if ( this.app.audio && this.app.audio.fishSplash ) this.app.audio.fishSplash( rod.bobber, 0.35 );

			}

		} else if ( b.phase === 'take' ) {

			this.toast( '鱼叼走鱼饵，跑了', 1800 );
			this.bite = { phase: 'wait', t: biteDelay( this.habitat(), this.hour ) };

		}

	}

	strike() {

		const b = this.bite;
		if ( ! b || b.phase === 'wait' || b.phase === 'nibble' ) {

			// too early: a nibbling fish isn't hooked yet; it keeps nibbling (a hint, no penalty)
			if ( b && b.phase === 'nibble' ) this.toast( '还没到时候 · 等浮漂被拉入水下', 1500 );
			return;

		}

		const g = this.state.stats;
		this.fight = new CatchMinigame( { species: b.species, kg: b.kg, lineKg: g.lineKg, reelSpeed: g.reelSpeed, distance: Math.max( 3, this.rod.lineOut ) } );
		this.bite = null;
		this.rod.hook();
		this.toast( '鱼上钩了！', 1200 );

	}

	updateFight( dt, reeling ) {

		const f = this.fight;
		const st = f.update( dt, reeling );
		// the fish thrashes at the surface as each run starts
		const au = this.app.audio;
		if ( f.surge > 0.6 && ! f._splashed && au && au.fishSplash ) au.fishSplash( this.rod.bobber, 0.3 + 0.5 * Math.min( 1, f.kg / 8 ) );
		f._splashed = f.surge > 0.6 ? true : f.surge < 0.3 ? false : f._splashed;
		if ( st === 'fighting' ) return;
		this.fight = null;
		this.rod.dip = 0;
		const name = FISH[ f.species ].name;
		if ( st === 'caught' ) {

			const entry = this.state.addFish( f.species, f.kg, this.hour, !! this.hud );
			const info = this.state.lastCatch;
			if ( au && au.fishSplash ) au.fishSplash( this.rod.bobber, 0.8 );
			if ( au && au.fishFlop ) au.fishFlop();
			// the catch card (with a HUD) while the fish hangs on the line; a toast otherwise
			if ( this.hud ) this.landing = { species: f.species, kg: f.kg, card: info, cardT: 0 };
			else {

				if ( entry ) this.toast( `${ info.record ? '新纪录！' : '' }${ name } · ${ entry.kg.toFixed( 2 ) } kg · $${ entry.value }`, 3600 );
				else this.toast( `${ name } · ${ f.kg.toFixed( 1 ) } kg · ${ this.state.upgrades.hold > 0 ? '鱼舱' : '海钓箱' }空间不足，已放生`, 3600 );
				this.landing = { species: f.species, kg: f.kg };

			}

			this.rod.land( fishLength( f.species, f.kg ) );
			if ( this.state.pendingCatch && this.hud ) {

				this.hud.hideCatch();
				this.hud.toggleInventory( true );
				this.toast( `${ this.state.upgrades.hold > 0 ? '鱼舱' : '海钓箱' }超重了 · 请放生鱼获，将总重量降到 ${ this.state.stats.holdKg } kg 以下`, 5000 );

			}

		} else if ( st === 'snapped' ) {

			this.toast( '啪！鱼线断了', 2400 );
			if ( au && au.lineSnap ) au.lineSnap();
			this.rod.setState( 'idle' );

		} else {

			this.toast( '鱼脱钩了', 2000 );
			this.rod.endFight();

		}

	}

	// Each fish can be chosen explicitly, including the catch that caused the overflow.
	releaseFish( id ) {

		const current = this.state.pendingCatch?.id === id;
		this.state.release( id );
		if ( current ) this.endLanding();

	}

	finishCapacityReview() {

		const fish = this.state.pendingCatch;
		if ( ! this.state.finishCapacityReview() ) return false;
		this._cardDismissed = true;
		this.endLanding();
		if ( fish ) this.toast( `已收存 ${ FISH[ fish.species ].name } · ${ fish.kg.toFixed( 2 ) } kg` );
		return true;

	}

	// Clear the world presentation after the fish is stored or explicitly released.
	endLanding() {

		this.landing = null;
		this.display.hide();
		if ( this.hud && this.hud.catchOpen ) this.hud.hideCatch();
		if ( this.rod.state === 'landing' ) this.rod.setState( 'idle' );

	}

	// line in at once (mode change)
	cancelLine( silent = false ) {

		if ( this.fight && ! silent ) this.toast( '鱼跑了', 1400 );
		this.fight = null;
		this.bite = null;
		if ( this.rod.state !== 'stowed' ) this.rod.setState( this.rod.equipped ? 'idle' : 'stowed' );

	}

}

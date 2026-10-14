import assert from 'node:assert/strict';
import { Euler, PerspectiveCamera, Quaternion, Scene, Vector3 } from '../src/engine/index.js';
import { Game } from '../src/game/Game.js';
import { GameState } from '../src/game/GameState.js';
import { CatchDisplay, fishLength } from '../src/game/CatchDisplay.js';
import { FishingRod } from '../src/game/FishingRod.js';
import { FISH, FISH_IDS } from '../src/game/FishTable.js';
import { FishProps, bendPoint } from '../src/world/fish/FishProps.js';

// Exercise the production landing flow without rendering a world.
function setup( { species = 'barracuda', kg = 7.02, hud = true } = {} ) {

	const game = Object.create( Game.prototype );
	const keys = new Set();
	const input = { enabled: true, mouseDown: true, rightDown: false, hit: ( code ) => keys.has( code ) };
	const panel = {
		catchOpen: false, invOpen: false, standOpen: false, journalOpen: false, shown: 0, shops: 0,
		showCatch( info ) { this.catchOpen = true; this.shown ++; this.info = info; },
		hideCatch() { this.catchOpen = false; },
		toggleInventory( open ) {

			const next = open ?? ! this.invOpen;
			if ( ! next && game.state.capacityReview && ! game.finishCapacityReview() ) return;
			this.invOpen = next;

		},
		closeStand() { this.standOpen = false; },
		openStand() { this.shops ++; this.standOpen = true; },
		update() {},
	};
	const display = {
		shown: null, frames: 0,
		show( id ) { this.shown = id; this.frames ++; },
		hide() { this.shown = null; },
	};
	const rod = {
		equipped: true, state: 'fighting', t: 0, dip: 0, bobber: new Vector3(),
		get lineInWater() { return this.state === 'landing' || this.state === 'fighting'; },
		land( length ) { this.length = length; this.setState( 'landing' ); },
		setState( state ) { this.state = state; this.t = 0; },
		equip( on ) { this.equipped = on; if ( ! on ) this.setState( 'stowed' ); else if ( this.state === 'stowed' ) this.setState( 'idle' ); },
		startWindup() { this.setState( 'windup' ); },
		update( dt ) { this.t += dt; },
	};
	game.app = {
		input, camera: { position: new Vector3( 0, 2, 2 ) },
		player: { mode: 'walk', position: new Vector3(), busy: true },
		settings: { timeOfDay: 12 },
	};
	game.state = new GameState( null );
	game.hud = hud ? panel : null;
	game.display = display;
	game.rod = rod;
	game.fight = { species, kg, surge: 0, update: () => 'caught' };
	game.landing = null;
	game.vendors = [ { kind: 'buyer', name: 'Joe', inRange: () => true, update() {} } ];
	game.updateBoat = () => {};
	game.toast = () => {};
	const frame = ( dt = 1 / 60 ) => { game.update( dt ); keys.clear(); };
	return { game, keys, input, panel, display, rod, frame };

}

// The hidden shortcut changes new bite selection, leaving an already hooked fish and gear intact.
{

	const random = Math.random;
	Math.random = () => 0;
	try {

		const t = setup();
		t.game.fight = null;
		t.rod.state = 'idle';
		t.input.mouseDown = false;
		const messages = [];
		t.game.toast = ( text ) => messages.push( text );
		t.game.habitat = () => ( { pier: 1, shallows: 0, reef: 0, bay: 0, deep: 0 } );
		t.keys.add( 'KeyB' );
		t.frame();
		assert.equal( t.game.bigFishTest, true );
		assert.deepEqual( messages, [], 'the shortcut has no on-screen hint or mode toast' );
		t.rod.state = 'floating';
		t.rod.lineOut = 18;
		t.rod.hook = () => t.rod.setState( 'fighting' );
		t.game.bite = { phase: 'wait', t: 0 };
		t.game.updateBite( 1 / 60 );
		assert.equal( t.game.bite.species, 'tarpon' );
		assert.equal( t.game.bite.kg, 35 );
		assert.equal( t.game.bite.phase, 'nibble', 'testing still requires the normal bite and strike sequence' );
		t.game.bite.phase = 'take';
		t.game.strike();
		const hooked = t.game.fight;
		assert.equal( hooked.species, 'tarpon' );
		assert.equal( hooked.kg, 35 );
		assert.equal( hooked.reelSpeed, t.game.state.stats.reelSpeed );
		t.keys.add( 'KeyB' );
		t.frame();
		assert.equal( t.game.bigFishTest, false );
		assert.equal( t.game.fight, hooked, 'turning the mode off cannot swap an in-progress fight' );
		for ( let i = 0; i < 600 && t.game.fight; i ++ ) t.game.updateFight( 1 / 60, true );
		assert.equal( hooked.state, 'snapped', 'holding the mouse on the large test fish still breaks the starter line' );
		assert.equal( t.game.state.inventory.length, 0, 'testing does not award a fish without landing it' );
		assert.equal( t.game.state.stats.lineKg, 7, 'the shortcut does not upgrade equipment' );
		t.rod.state = 'floating';
		t.game.bite = { phase: 'wait', t: 0 };
		t.game.updateBite( 1 / 60 );
		assert.equal( t.game.bite.species, 'silverside', 'turning testing off restores habitat-based selection' );
		assert.equal( t.game.bite.kg, FISH.silverside.kg[ 0 ] );

	} finally { Math.random = random; }

}

{

	const t = setup();
	t.frame();
	assert.equal( t.rod.state, 'landing' );
	assert.equal( t.display.shown, 'barracuda', 'the world fish appears even with the HUD present' );
	assert.equal( t.panel.catchOpen, false, 'let the fish swing in before showing its numbers' );
	assert.equal( t.game.state.inventory.length, 1 );
	assert.equal( t.game.state.log.barracuda.count, 1 );
	assert.ok( t.rod.length > 0.9 && t.rod.length < 1.1 );
	for ( let i = 0; i < 45; i ++ ) t.frame();
	assert.equal( t.panel.catchOpen, true );
	assert.equal( t.panel.shown, 1 );
	assert.equal( t.panel.info.cm, t.game.state.inventory[ 0 ].cm );
	assert.ok( t.game.landing, 'holding the reel button does not dismiss the catch' );
	t.keys.add( 'KeyR' );
	t.keys.add( 'KeyI' );
	t.frame();
	assert.equal( t.rod.equipped, true );
	assert.equal( t.panel.invOpen, false, 'the catch owns input until it is collected' );
	for ( let i = 0; i < 720; i ++ ) t.frame();
	assert.ok( t.game.landing, 'no automatic dismissal after nine seconds' );
	assert.equal( t.display.shown, 'barracuda' );
	assert.equal( t.panel.shown, 1 );
	assert.equal( t.game.state.log.barracuda.count, 1, 'displaying a fish never logs it twice' );
	t.input.mouseDown = false;
	t.frame();
	t.keys.add( 'KeyE' );
	t.frame();
	assert.equal( t.game.landing, null );
	assert.equal( t.display.shown, null );
	assert.equal( t.panel.catchOpen, false );
	assert.equal( t.rod.state, 'idle' );
	assert.equal( t.panel.shops, 0, 'collecting with E does not also open a nearby vendor' );
	assert.equal( t.game.state.inventory.length, 1 );

}

// Being in deck mode alone cannot permit fishing from a capsized or submerged boat.
for ( const [ name, rotation, eyeY ] of [
	[ 'rolled onto its side', new Euler( 0, 0, Math.PI / 2 ), 2 ],
	[ 'upside down', new Euler( 0, 0, Math.PI ), 2 ],
	[ 'bow tipped over', new Euler( Math.PI * 0.4, 1.2, 0 ), 2 ],
	[ 'submerged', new Euler(), - 0.4 ],
] ) {

	const t = setup();
	t.game.app.player.mode = 'deck';
	t.game.app.boatCtl = { quaternion: new Quaternion().setFromEuler( rotation ) };
	t.game.app.cameraWaterHeight = 0.5;
	t.game.app.camera.position.y = eyeY;
	t.game.bite = { phase: 'take', t: 1 };
	assert.equal( t.game.canFish, false, name );
	t.frame();
	assert.equal( t.game.fight, null, `${ name }: an ongoing fight is cancelled before it can finish` );
	assert.equal( t.game.bite, null );
	assert.equal( t.rod.equipped, false );
	assert.equal( t.rod.state, 'stowed' );
	assert.equal( t.game.app.player.busy, false );
	assert.equal( t.game.state.inventory.length, 0 );
	assert.deepEqual( t.game.state.log, {} );
	t.keys.add( 'KeyR' );
	t.frame();
	assert.equal( t.rod.equipped, false, `${ name }: R cannot bring the rod back out` );
	// Normal rocking and any heading remain fishable; recovery does not replay a lost fight.
	t.game.app.boatCtl.quaternion.setFromEuler( new Euler( 0.1, 2.3, 0.3 ) );
	t.game.app.camera.position.y = 2;
	assert.equal( t.game.canFish, true );
	t.keys.add( 'KeyR' );
	t.frame();
	assert.equal( t.rod.equipped, true );
	assert.equal( t.rod.state, 'idle' );
	assert.equal( t.game.fight, null );
	assert.equal( t.game.state.inventory.length, 0 );
	// A flipped boat does not block fishing elsewhere on the shore.
	t.game.app.boatCtl.quaternion.setFromEuler( new Euler( 0, 0, Math.PI ) );
	t.game.app.player.mode = 'walk';
	assert.equal( t.game.canFish, true );

}

{

	const t = setup();
	for ( let i = 0; i < 45; i ++ ) t.frame();
	assert.equal( t.panel.catchOpen, true );
	t.game.app.player.mode = 'deck';
	t.game.app.boatCtl = { quaternion: new Quaternion().setFromEuler( new Euler( 0, 0, Math.PI ) ) };
	t.frame();
	assert.equal( t.game.landing, null );
	assert.equal( t.display.shown, null );
	assert.equal( t.panel.catchOpen, false, 'capsizing also clears the existing catch presentation' );
	assert.equal( t.game.state.inventory.length, 1, 'a catch completed before capsizing remains in the save' );

}

for ( const action of [ 'click', 'Escape', 'modeChange' ] ) {

	const t = setup();
	for ( let i = 0; i < 45; i ++ ) t.frame();
	t.input.mouseDown = false;
	t.frame();
	if ( action === 'click' ) t.input.mouseDown = true;
	else if ( action === 'Escape' ) t.keys.add( 'Escape' );
	else t.game.app.freeCam = true;
	t.frame();
	assert.equal( t.game.landing, null, `${ action } clears the landing` );
	assert.equal( t.display.shown, null );
	assert.equal( t.panel.catchOpen, false );
	assert.equal( t.game.state.log.barracuda.count, 1 );
	if ( action === 'click' ) {

		t.frame();
		assert.equal( t.rod.state, 'idle', 'the same held click does not start another cast' );

	}

}

{

	const t = setup();
	t.frame();
	t.keys.add( 'KeyE' );
	t.frame( 0.6 );
	assert.ok( t.game.landing, 'an input on the card entrance frame cannot skip the display' );
	assert.equal( t.panel.catchOpen, true );

}

{

	const t = setup( { species: 'tarpon', kg: 45 } );
	for ( let i = 0; i < 45; i ++ ) t.frame();
	assert.equal( t.display.shown, 'tarpon' );
	assert.equal( t.panel.invOpen, true, 'oversized catches automatically open the box' );
	assert.equal( t.panel.catchOpen, false, 'the catch card cannot cover the capacity decision' );
	assert.equal( t.game.state.pendingCatch.kg, 45 );
	assert.equal( t.game.state.inventory.length, 0 );
	t.keys.add( 'KeyE' );
	t.frame();
	assert.ok( t.game.landing, 'E cannot release a fish while the capacity decision is open' );
	t.keys.add( 'KeyI' );
	t.frame();
	assert.equal( t.panel.invOpen, true, 'I cannot silently release or close an oversized catch' );
	t.game.releaseFish( t.game.state.pendingCatch.id );
	assert.equal( t.panel.invOpen, true, 'releasing the current catch leaves the box open' );
	t.keys.add( 'KeyI' ); t.frame();
	assert.equal( t.game.landing, null );
	assert.equal( t.game.state.pendingCatch, null );
	assert.equal( t.game.state.log.tarpon.count, 1, 'a released oversized fish keeps its journal record' );

}

for ( const closeKey of [ 'KeyI', 'Tab', 'Escape' ] ) {

	const t = setup();
	t.game.state.addFish( 'grouper', 24 );
	t.frame();
	assert.equal( t.panel.invOpen, true );
	assert.ok( t.game.state.pendingCatch );
	t.keys.add( closeKey ); t.frame();
	assert.ok( t.game.state.pendingCatch, `${ closeKey } cannot close or release fish while overweight` );
	assert.equal( t.panel.invOpen, true );
	t.game.releaseFish( t.game.state.pendingCatch.id );
	t.keys.add( closeKey ); t.frame();
	assert.equal( t.game.state.pendingCatch, null );
	assert.equal( t.game.state.inventory.length, 1 );
	assert.equal( t.game.state.holdKg, 24 );
	assert.equal( t.game.landing, null );
	assert.equal( t.panel.invOpen, false );
	assert.equal( t.panel.shops, 0 );

}

{

	const t = setup();
	const old = t.game.state.addFish( 'grouper', 23 );
	const small = t.game.state.addFish( 'grunt', 1 );
	t.frame();
	const pending = t.game.state.pendingCatch;
	assert.equal( t.game.state.holdKg, 24 );
	t.game.releaseFish( small.id );
	assert.equal( t.game.state.pendingCatch, pending, 'not enough space: keep the decision open' );
	assert.equal( t.panel.invOpen, true );
	t.game.releaseFish( old.id );
	assert.equal( t.game.state.pendingCatch, pending );
	assert.equal( t.game.state.canCloseInventory, true );
	assert.equal( t.panel.invOpen, true, 'space is available, but the player still chooses when to close' );
	t.keys.add( 'KeyI' ); t.frame();
	assert.equal( t.game.state.pendingCatch, null );
	assert.deepEqual( t.game.state.inventory, [ pending ] );
	assert.equal( t.game.state.log.barracuda.count, 1 );
	assert.equal( t.game.state.lastCatch.kept, true );
	assert.equal( t.panel.invOpen, false );
	assert.equal( t.game.landing, null );
	assert.equal( t.rod.state, 'idle' );

}

{

	const t = setup( { hud: false } );
	for ( let i = 0; i < 180; i ++ ) t.frame();
	assert.equal( t.game.landing, null, 'the headless fallback still finishes automatically' );
	assert.equal( t.display.shown, null );

}

{

	const camera = new PerspectiveCamera( 62, 16 / 9, 0.1, 1000 );
	const rod = new FishingRod( {
		scene: new Scene(), camera,
		query: { allocate: () => 0, setPoint() {}, cpuValid: false },
		terrain: { heightAt: () => - 5 },
	} );
	rod.equip( true );
	for ( const length of [ 0.13, 0.47, fishLength( 'tarpon', 45 ) ] ) {

		for ( const pitch of [ - 0.4, 0, 0.3 ] ) {

			camera.position.set( 3, 2, 5 );
			camera.quaternion.setFromEuler( new Euler( pitch, 0.8, 0, 'YXZ' ) );
			rod.bobber.set( 5, 0, - 8 );
			rod.land( length );
			for ( let i = 0; i < 90; i ++ ) rod.update( 1 / 60, { visible: true } );
			for ( let i = 0; i < 12; i ++ ) {

				camera.position.x += 0.02;
				rod.update( 1 / 60, { visible: true } );
				const distance = Math.max( 0.55, length / ( 2 * Math.tan( camera.fov * Math.PI / 360 ) * 0.46 ) );
				const expected = camera.position.clone().addScaledVector( camera.getWorldDirection( new Vector3() ), distance );
				expected.y += length * 0.4;
				assert.ok( rod.bobber.distanceTo( expected ) < 1e-8, 'aligning the rod preserves the fish framing' );
				assert.ok( Math.hypot( rod.tip.x - rod.bobber.x, rod.tip.z - rod.bobber.z ) < 1e-8, 'the actual bent rod tip is vertically above the hook' );
				assert.ok( rod.tip.y - rod.bobber.y >= 0.28 - 1e-8 );
				const grip = new Vector3( 0, 0.405, 0 ).applyMatrix4( rod.rodMesh.matrix );
				assert.ok( grip.distanceTo( rod.pose.hand.clone().applyMatrix4( camera.matrixWorld ) ) < 1e-8, 'the reel seat stays in the player hand for every fish size' );
				assert.ok( Math.hypot( rod.lineMat.uniforms.lineCtl.value.x - rod.tip.x, rod.lineMat.uniforms.lineCtl.value.z - rod.tip.z ) < 1e-8, 'the entire line remains vertical' );

			}

		}

	}
	assert.ok( rod.rodMat.uniforms.rodShape.value.y > 1, 'the large fish presentation keeps the grip nearby' );
	rod.setState( 'idle' );
	rod.update( 1 / 60, { visible: true } );
	assert.equal( rod.rodMat.uniforms.rodShape.value.y, 1, 'collecting the fish restores the normal blank length' );

}

for ( const species of FISH_IDS ) {

	const display = Object.create( CatchDisplay.prototype );
	display.slot = { [ species ]: 0 };
	display.props = { batch: { data: new Float32Array( 16 ), upload() {} }, pos: new Float32Array( 4 ) };
	display.shown = species;
	display.t = 18;
	const mouth = new Vector3( 1, 2, 3 ), yaw = 0.7;
	const right = new Vector3( Math.cos( yaw ), 0, - Math.sin( yaw ) );
	const model = FISH[ species ].model, anchor = FishProps.gillAnchor( model ), tail = FishProps.tailAnchor( model );
	const kg = FISH[ species ].kg[ 0 ];
	let min = Infinity, max = - Infinity;
	for ( let i = 0; i < 120; i ++ ) {

		display.show( species, kg, mouth, yaw, 1 / 60 );
		const D = display.props.batch.data, q = new Quaternion().fromArray( D, 4 );
		const worldPoint = ( p ) => bendPoint( ...p, D[ 9 ], D[ 10 ], new Vector3() ).multiplyScalar( D[ 3 ] ).applyQuaternion( q ).add( new Vector3().fromArray( D ) );
		assert.ok( worldPoint( anchor ).distanceTo( mouth ) < 1e-5, `${ species }: struggling cannot detach the fish from the line` );
		const x = worldPoint( tail ).sub( mouth ).dot( right );
		min = Math.min( min, x ); max = Math.max( max, x );

	}
	assert.ok( max - min > fishLength( species, kg ) * 0.15, `${ species }: visible tail movement persists long after landing` );
	display.hide();
	assert.equal( display.shown, null );
	assert.equal( display.t, 0 );

}

console.log( 'Landing flow passed: capsized/submerged fishing blocked, recovery, catch cleanup, rod/line alignment and attached fish.' );

import { Matrix4, Quaternion, Vector3 } from '../engine/index.js';
import { FishProps, bendPoint } from '../world/fish/FishProps.js';
import { SPECIES } from '../world/fish/FishSpecies.js';
import { FISH, FISH_IDS, fishLengthCm } from './FishTable.js';

// Real fish (the world's fish models and wet skin, world/fish/FishProps) for the game:
//  - the fish you just landed, hanging from the line by the gills and flapping, for a moment
//  - fish on ice at the buyer's stall (static)
// One props batch built at startup (one pipeline compile): a hanging slot per catchable species,
// parked far below the world until it is shown, plus the stall's fish.
const PARK = new Vector3( 0, - 2000, 0 );
// model frame (nose +z, back +y, left flank +x) -> hanging from a hook through the gills: nose up,
// left flank toward +z, back toward +x (FishProps' 'gill' pose)
const GILL = new Matrix4().makeBasis( new Vector3( 0, 0, 1 ), new Vector3( 1, 0, 0 ), new Vector3( 0, 1, 0 ) );
// lying on its side, nose toward +x ('side')
const SIDE = new Matrix4().makeBasis( new Vector3( 0, 1, 0 ), new Vector3( 0, 0, 1 ), new Vector3( 1, 0, 0 ) );
const _m = new Matrix4(), _f = new Matrix4(), _q = new Quaternion(), _tilt = new Quaternion(), _p = new Vector3(), _s = new Vector3(), _a = new Vector3();

// body length (m) for a weight: the species' length-weight relation (FishTable.fishLengthCm), so the
// fish on the line is the size the catch card reports
export function fishLength( species, kg ) {

	return fishLengthCm( species, kg ) / 100;

}

export class CatchDisplay {

	constructor( { scene, stall = [] } ) {

		const fp = this.props = new FishProps( { motion: true, reactiveInstances: FISH_IDS.length } );
		this.slot = {};
		let i = 0;
		_f.makeTranslation( PARK.x, PARK.y, PARK.z );
		for ( const id of FISH_IDS ) {

			const model = FISH[ id ].model;
			fp.add( 'whole', model, _f, 'gill', 0.3, { anchor: FishProps.gillAnchor( model ), cloudy: 0.1, wet: 1 } );
			this.slot[ id ] = i ++;

		}

		// stall fish: { species, frame (Matrix4, world), L, pose ('side' | 'sideFlip') }
		for ( const s of stall ) fp.add( 'whole', FISH[ s.species ].model, s.frame, s.pose || 'side', s.L, { cloudy: 0.5, wet: 0.7 } );
		for ( const s of stall.filter( ( x ) => x.ice ) ) fp.add( 'ice', null, s.ice, 'flat', 0.5, { seed: 0.3, flags: 0 } );
		this.mesh = fp.build();
		this.mesh.name = 'GameFish';
		scene.add( this.mesh );
		this.shown = null;
		this.t = 0;

	}

	// hang `species` from `mouth` (world point: the end of the line), facing the camera
	show( species, kg, mouth, faceYaw, dt ) {

		const i = this.slot[ species ];
		if ( i === undefined ) return;
		const fresh = this.shown !== species;
		if ( fresh ) this.hide();
		this.shown = species;
		this.t += dt;
		const model = FISH[ species ].model;
		const L = fishLength( species, kg );
		// 侧向摆尾在正对鱼侧面的视角里主要沿景深运动；加入绕挂线点的倾摆和鱼身弯曲，让挣扎可见。
		// 交替的发力与缓和持续到玩家收起，避免几秒后只剩嘴部动画。
		const effort = 0.6 + 0.4 * Math.pow( Math.sin( this.t * 2.3 ), 4 );
		const arrival = Math.exp( - this.t * 0.7 );
		const flap = Math.sin( this.t * 11 ) * ( 1.1 + 0.3 * arrival ) * effort;
		const flex = Math.sin( this.t * 9.1 + 0.7 ) * ( 0.65 + 0.2 * arrival ) * effort;
		const lean = Math.sin( this.t * 7.3 ) * ( 0.2 + 0.06 * arrival ) * effort;
		const swing = Math.sin( this.t * 2.6 ) * 0.18;
		_q.setFromAxisAngle( _a.set( 0, 1, 0 ), faceYaw + swing );
		_q.multiply( _tilt.setFromAxisAngle( _a.set( 0, 0, 1 ), lean ) );
		_f.makeRotationFromQuaternion( _q ).setPosition( mouth );
		this.place( i, _f, GILL, L, FishProps.gillAnchor( model ), flap, flex, 0.4 + 0.4 * Math.max( 0, Math.sin( this.t * 7 ) ), fresh );

	}

	hide() {

		if ( this.shown === null ) return;
		_f.makeTranslation( PARK.x, PARK.y, PARK.z );
		this.place( this.slot[ this.shown ], _f, GILL, 0.3, [ 0, 0, 0 ], 0, 0, 0 );
		this.shown = null;
		this.t = 0;

	}

	// 鱼身弯曲后，挂线点仍必须落在鱼线末端；使用与顶点着色器一致的弯曲计算。
	place( i, frame, pose, L, anchor, curl, sag, jaw, resetMotion = false ) {

		const fp = this.props;
		_m.multiplyMatrices( frame, pose );
		_m.decompose( _p, _q, _s );
		_p.sub( bendPoint( anchor[ 0 ], anchor[ 1 ], anchor[ 2 ], curl, sag, _a ).multiplyScalar( L ).applyQuaternion( _q ) );
		const D = fp.batch.data, o = i * 16;
		D[ o ] = _p.x; D[ o + 1 ] = _p.y; D[ o + 2 ] = _p.z; D[ o + 3 ] = L;
		D[ o + 4 ] = _q.x; D[ o + 5 ] = _q.y; D[ o + 6 ] = _q.z; D[ o + 7 ] = _q.w;
		D[ o + 9 ] = curl; D[ o + 10 ] = sag; D[ o + 11 ] = jaw;
		fp.pos[ i * 4 ] = _p.x; fp.pos[ i * 4 + 1 ] = _p.y; fp.pos[ i * 4 + 2 ] = _p.z; fp.pos[ i * 4 + 3 ] = L;
		if ( resetMotion ) fp.batch.resetMotion( i );
		fp.batch.upload();

	}

}

export { SPECIES, SIDE };

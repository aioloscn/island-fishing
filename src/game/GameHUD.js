import { FISH, fishLengthCm } from './FishTable.js';
import { UPGRADES, nextLevel, FUEL_PRICE } from './Gear.js';
import { FishPortrait } from './FishPortrait.js';

// DOM for the fishing game, in the look of the rest of the HUD (ui/ui.css tokens, .tw-glass):
//   top right     purse and cooler / hold load
//   bottom centre the fight: line tension with its safe band, the fish's stamina, line out
//   centre        "!" when a fish takes the bait
//   panels        inventory (I / Tab) and the fish stand's offer
//   catch card    transparent information above / below the fish hanging on the line in the world
const CSS = /* css */`
.gm-purse { position: absolute; top: var(--tw-edge); right: var(--tw-edge); display: flex; flex-wrap: wrap; max-width: calc(100vw - 2 * var(--tw-edge)); gap: var(--tw-3); align-items: center;
	padding: var(--tw-2) var(--tw-4); border-radius: 999px; font: 500 var(--tw-fs-lg) var(--tw-font); color: var(--tw-ink); pointer-events: none;
	transition: transform var(--tw-med) var(--tw-ease), right var(--tw-slow) var(--tw-ease); }
.tw-root[data-panel='open'] .gm-purse { right: calc(var(--tw-panel-w) + 2 * var(--tw-3)); }
.tw-root.is-photo .gm-panel { display: none; }
.gm-purse.is-bump { animation: gm-bump 420ms var(--tw-ease); }
@keyframes gm-bump { 30% { transform: scale(1.08); } }
.gm-money { font-family: var(--tw-mono); color: var(--tw-sun); font-weight: 600; }
.gm-cooler { display: flex; flex: none; white-space: nowrap; align-items: center; gap: var(--tw-2); color: var(--tw-ink-2); font-size: var(--tw-fs-md); }
.gm-cooler-bar { width: calc(64 * var(--tw-u)); height: calc(5 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-cooler-bar > span { display: block; height: 100%; width: 0; background: var(--tw-aqua); border-radius: inherit; transition: width var(--tw-med) var(--tw-ease); }
.gm-cooler.is-full .gm-cooler-bar > span { background: var(--tw-coral); }
.gm-fight { position: absolute; left: 50%; bottom: calc(max(calc(72 * var(--tw-u)), 13vh) + calc(58 * var(--tw-u))); transform: translateX(-50%);
	width: calc(360 * var(--tw-u)); padding: var(--tw-3) var(--tw-4); border-radius: var(--tw-r-lg); font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink);
	opacity: 0; transition: opacity var(--tw-med) var(--tw-ease); pointer-events: none; }
.gm-fight.is-on { opacity: 1; }
.gm-fight-head { display: flex; justify-content: space-between; margin-bottom: var(--tw-2); }
.gm-fight-call { font-weight: 600; letter-spacing: 0.02em; }
.gm-fight-call.is-warn { color: var(--tw-coral); }
.gm-fight-call.is-good { color: var(--tw-aqua); }
.gm-fight-dist { font-family: var(--tw-mono); color: var(--tw-ink-2); }
.gm-tension { position: relative; height: calc(12 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-band { position: absolute; top: 0; bottom: 0; background: rgba(var(--tw-aqua-rgb), 0.28); border-left: 1px solid rgba(var(--tw-aqua-rgb), 0.6); border-right: 1px solid rgba(var(--tw-aqua-rgb), 0.6); }
.gm-danger { position: absolute; top: 0; bottom: 0; right: 0; width: 8%; background: rgba(255, 122, 133, 0.35); }
.gm-needle { position: absolute; top: -2px; bottom: -2px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--tw-ink); box-shadow: 0 0 8px rgba(255,255,255,0.6); }
.gm-needle.is-hot { background: var(--tw-coral); box-shadow: 0 0 10px var(--tw-coral); }
.gm-stamina { margin-top: var(--tw-2); display: flex; align-items: center; gap: var(--tw-2); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-stamina-bar { flex: 1; height: calc(4 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-stamina-bar > span { display: block; height: 100%; background: var(--tw-sun); }
.gm-bite { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%) scale(0.6); font: 800 calc(56 * var(--tw-u)) var(--tw-font);
	color: var(--tw-sun); text-shadow: 0 0 18px rgba(var(--tw-sun-rgb), 0.8), 0 2px 4px rgba(0,0,0,0.5); opacity: 0; pointer-events: none;
	transition: opacity 120ms, transform 200ms var(--tw-ease); }
.gm-bite.is-on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.gm-cast { position: absolute; left: 50%; top: 58%; transform: translateX(-50%); width: calc(140 * var(--tw-u)); height: calc(5 * var(--tw-u));
	border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; opacity: 0; transition: opacity var(--tw-fast); pointer-events: none; }
.gm-cast.is-on { opacity: 1; }
.gm-cast > span { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--tw-aqua), var(--tw-sun)); }
.gm-panel { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -48%); width: min(calc(460 * var(--tw-u)), calc(100vw - 2 * var(--tw-edge))); max-height: 70vh; display: flex; flex-direction: column;
	padding: var(--tw-4) var(--tw-5); border-radius: var(--tw-r-lg); font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink);
	opacity: 0; pointer-events: none; transition: opacity var(--tw-med) var(--tw-ease), transform var(--tw-slow) var(--tw-ease); }
.gm-panel.is-open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.gm-panel h2 { margin: 0 0 var(--tw-1); font-size: calc(17 * var(--tw-u)); font-weight: 600; }
.gm-panel p.gm-sub { margin: 0 0 var(--tw-3); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-list { overflow: auto; margin: 0 calc(-1 * var(--tw-2)); padding: 0 var(--tw-2); }
.gm-row { display: grid; grid-template-columns: 1fr auto auto auto; gap: var(--tw-3); align-items: center; padding: var(--tw-2) 0; border-bottom: 1px solid var(--tw-line); }
.gm-row .gm-kg, .gm-row .gm-val { font-family: var(--tw-mono); color: var(--tw-ink-2); }
.gm-row .gm-val { color: var(--tw-sun); }
.gm-row small { color: var(--tw-aqua); margin-left: var(--tw-1); white-space: nowrap; }
.gm-empty { color: var(--tw-ink-3); padding: var(--tw-4) 0; text-align: center; }
.gm-foot { display: flex; justify-content: space-between; align-items: center; margin-top: var(--tw-3); gap: var(--tw-3); }
.gm-btn { font: 600 var(--tw-fs-md) var(--tw-font); white-space: nowrap; flex-shrink: 0; color: #0b1418; background: var(--tw-aqua); border: 0; border-radius: 999px; padding: var(--tw-2) var(--tw-4); cursor: pointer; }
.gm-btn[disabled] { opacity: 0.4; cursor: default; }
.gm-btn.is-ghost { background: var(--tw-fill-2); color: var(--tw-ink); }
.gm-mini { font: 500 var(--tw-fs-sm) var(--tw-font); color: var(--tw-ink-2); background: var(--tw-fill); border: 1px solid var(--tw-line); border-radius: 999px; padding: 2px var(--tw-2); cursor: pointer; white-space: nowrap; }
.gm-gauge { display: none; flex: none; white-space: nowrap; align-items: center; gap: var(--tw-2); color: var(--tw-ink-2); font-size: var(--tw-fs-md); }
.gm-gauge.is-on { display: flex; }
.gm-gauge b { font-family: var(--tw-mono); font-weight: 500; color: var(--tw-ink); }
.gm-fuel-bar > span { background: var(--tw-sun); }
.gm-fuel.is-low .gm-fuel-bar > span { background: var(--tw-coral); }
.gm-sonar-dots { letter-spacing: 1px; color: var(--tw-aqua); }
.gm-shop-row { display: grid; grid-template-columns: 1fr auto; gap: var(--tw-3); align-items: center; padding: var(--tw-2) 0; border-bottom: 1px solid var(--tw-line); }
.gm-shop-row small { display: block; color: var(--tw-ink-3); font-size: var(--tw-fs-sm); margin-top: 2px; }
.gm-shop-row .gm-have { color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-inv-hint { margin: var(--tw-3) 0 0; color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-overflow { margin-bottom: var(--tw-3); padding: var(--tw-3); border: 1px solid rgba(255, 122, 133, 0.45); border-radius: var(--tw-r-md); background: rgba(255, 122, 133, 0.08); }
.gm-overflow b { color: var(--tw-sun); }
.gm-box-weight { font-weight: 600; }
.gm-box-weight.is-overflow { color: var(--tw-coral); }
.gm-overflow p { margin: var(--tw-2) 0 0; line-height: 1.5; color: var(--tw-ink-2); font-size: var(--tw-fs-sm); }
.gm-row .gm-cm { font-family: var(--tw-mono); color: var(--tw-ink-3); }
.gm-row.has-cm { grid-template-columns: minmax(0, 1fr) auto auto auto auto; }
.gm-row.has-cm > span:first-child { overflow-wrap: anywhere; }
@media (max-width: 640px) { .gm-purse { border-radius: var(--tw-r-lg); } .gm-row.has-cm { gap: var(--tw-1); } .gm-foot { flex-wrap: wrap; } }

/* Fish journal: cached portraits of the game's models, with lifetime catch records. */
.gm-journal-scrim { position: absolute; inset: 0; z-index: 20; background: rgba(3, 12, 20, 0.55); pointer-events: auto;
	-webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); }
.gm-journal { z-index: 21; width: min(calc(920 * var(--tw-u)), calc(100vw - 2 * var(--tw-edge)));
	height: min(calc(640 * var(--tw-u)), 84vh); max-height: calc(100dvh - 2 * var(--tw-edge)); padding: var(--tw-5); visibility: hidden; }
.gm-journal.is-open { visibility: visible; }
.gm-journal h2 { font-size: calc(22 * var(--tw-u)); }
.gm-journal-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(240 * var(--tw-u))), 1fr));
	grid-auto-rows: max-content; align-content: start; gap: var(--tw-3); overflow: auto; padding: 1px var(--tw-2) 1px 1px; overscroll-behavior: contain; }
.gm-journal-card { min-width: 0; overflow: hidden; border: 1px solid var(--tw-line-2); border-radius: var(--tw-r-md); background: var(--tw-fill); }
.gm-journal-art { position: relative; display: grid; place-items: center; aspect-ratio: 360 / 170;
	background: radial-gradient(ellipse at 50% 65%, rgba(var(--tw-aqua-rgb), 0.13), transparent 75%); }
.gm-journal-art img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; }
.gm-journal-card.is-unknown .gm-journal-art img { filter: brightness(0) invert(0.55); opacity: 0.65; }
.gm-journal-card.is-unknown h3, .gm-journal-card.is-unknown dd { color: var(--tw-ink-3); }
.gm-journal-loading { color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-journal-detail { padding: var(--tw-3) var(--tw-4) var(--tw-4); }
.gm-journal-detail h3 { margin: 0; font-size: var(--tw-fs-lg); color: var(--tw-ink); }
.gm-journal-sci { margin: var(--tw-1) 0 var(--tw-3); font-size: var(--tw-fs-xs); font-style: italic; color: var(--tw-ink-3); }
.gm-journal-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tw-2); margin: 0; }
.gm-journal-stats dt { color: var(--tw-ink-3); font-size: var(--tw-fs-xs); }
.gm-journal-stats dd { margin: var(--tw-1) 0 0; font: 600 var(--tw-fs-lg) var(--tw-mono); color: var(--tw-aqua); white-space: nowrap; }
.gm-journal-stats small { margin-left: 3px; font: 500 var(--tw-fs-xs) var(--tw-font); color: var(--tw-ink-2); }
.tw-root.is-photo .gm-journal-scrim { display: none; }
@media (max-width: 640px) { .gm-journal { padding: var(--tw-4); } .gm-journal-grid { grid-template-columns: minmax(0, 1fr); } }

/* 透明鱼获信息层，中间留给场景中挂在线上的鱼。 */
.gm-catch { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: var(--tw-4);
	padding: clamp(12px, 5vh, 60px) var(--tw-edge); color: #f4ead6; font: 500 var(--tw-fs-md) var(--tw-font); text-align: center;
	background: transparent; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
	pointer-events: none; opacity: 0; visibility: hidden; transition: opacity 300ms var(--tw-ease), visibility 0s linear 300ms; }
.gm-catch.is-on { opacity: 1; visibility: visible; transition: opacity 300ms var(--tw-ease), visibility 0s; }
.gm-catch-top, .gm-catch-bottom { display: flex; flex-direction: column; align-items: center; opacity: 0; }
.gm-catch.is-on .gm-catch-top { animation: gm-rise 700ms var(--tw-ease) 120ms forwards; }
.gm-catch.is-on .gm-catch-bottom { animation: gm-rise 700ms var(--tw-ease) 520ms forwards; }
@keyframes gm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.gm-catch-eyebrow { display: flex; align-items: center; justify-content: center; min-height: calc(26 * var(--tw-u)); margin-bottom: var(--tw-2);
	font-size: var(--tw-fs-sm); font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(244, 234, 214, 0.62); }
.gm-badge { display: inline-flex; align-items: center; gap: 0.5em; padding: calc(4 * var(--tw-u)) calc(12 * var(--tw-u)); border-radius: 4px;
	letter-spacing: 0.22em; font-weight: 800; transform: scale(2.4) rotate(-8deg); opacity: 0; }
.gm-catch.is-on .gm-badge { animation: gm-stamp 520ms cubic-bezier(0.3, 1.5, 0.5, 1) 900ms forwards; }
.gm-badge.is-record { color: #2a1604; background: linear-gradient(100deg, #f3cf8a 0%, #d9a441 40%, #fff0cf 50%, #d9a441 60%, #f3cf8a 100%); background-size: 250% 100%;
	box-shadow: 0 0 0 2px rgba(42, 22, 4, 0.35) inset, 0 0 26px rgba(217, 164, 65, 0.55); }
.gm-catch.is-on .gm-badge.is-record { animation: gm-stamp 520ms cubic-bezier(0.3, 1.5, 0.5, 1) 900ms forwards, gm-shine 2.6s var(--tw-ease-io) 1.6s infinite; }
.gm-badge.is-new { color: #062420; background: #6fd6c6; box-shadow: 0 0 0 2px rgba(6, 36, 32, 0.3) inset, 0 0 22px rgba(111, 214, 198, 0.45); }
.gm-badge.is-plain { color: rgba(244, 234, 214, 0.8); background: none; box-shadow: inset 0 0 0 1px rgba(244, 234, 214, 0.35); }
@keyframes gm-stamp { 0% { transform: scale(2.4) rotate(-8deg); opacity: 0; } 70% { transform: scale(0.94) rotate(-3deg); opacity: 1; } 100% { transform: scale(1) rotate(-3deg); opacity: 1; } }
@keyframes gm-shine { 0% { background-position: 100% 0; } 100% { background-position: -150% 0; } }
.gm-catch h2 { margin: 0; font-family: 'Caveat Brush', 'Kalam', var(--tw-font); font-weight: 400; font-size: clamp(38px, 6.2vw, 92px); line-height: 1; letter-spacing: 0.01em;
	color: #fbf1dc; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35), 0 8px 30px rgba(0, 0, 0, 0.45); }
.gm-catch-sci { margin-top: calc(4 * var(--tw-u)); font-family: 'Kalam', var(--tw-font); font-style: italic; color: rgba(244, 234, 214, 0.66); font-size: clamp(13px, 1.3vw, 19px); }
.tw-root:has(.gm-catch.is-on) :is(.gm-map, .tw-rail, .tw-panel, .tw-tl, .tw-toasts, .tw-boat, .tw-depth, .gm-purse, .tw-prompt) { opacity: 0; pointer-events: none; transition: opacity 300ms; }
.gm-catch-stats { display: flex; justify-content: center; gap: clamp(8px, 1.6vw, 22px); margin-top: var(--tw-2); }
.gm-stat { min-width: clamp(96px, 11vw, 150px); padding: calc(10 * var(--tw-u)) calc(16 * var(--tw-u)) calc(9 * var(--tw-u)); border-radius: 6px;
	background: linear-gradient(180deg, rgba(232, 220, 192, 0.12), rgba(232, 220, 192, 0.05)); box-shadow: inset 0 0 0 1px rgba(214, 180, 110, 0.38), 0 10px 30px rgba(0, 0, 0, 0.25); }
.gm-stat span { display: block; font-size: var(--tw-fs-xs); font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(222, 190, 125, 0.9); }
.gm-stat b { display: block; margin-top: calc(4 * var(--tw-u)); font: 600 clamp(20px, 2.2vw, 32px) var(--tw-mono); color: #fbf1dc; white-space: nowrap; }
.gm-stat b small { font-size: 0.55em; font-weight: 500; color: rgba(244, 234, 214, 0.7); margin-left: 0.2em; }
.gm-stat i { display: block; white-space: nowrap; font-style: normal; font-family: var(--tw-mono); font-size: var(--tw-fs-sm); color: rgba(244, 234, 214, 0.5); margin-top: 2px; }
.gm-stat.is-value b { color: #f0c46a; }
.gm-catch-note { margin-top: var(--tw-3); min-height: 1.4em; color: rgba(244, 234, 214, 0.78); font-family: 'Kalam', var(--tw-font); font-size: clamp(14px, 1.25vw, 19px); line-height: 1.4; }
.gm-catch-note b { color: #f0c46a; font-weight: 700; }
.gm-catch-note.is-warn { color: #ff9a8a; }
.gm-catch-foot { display: flex; align-items: center; justify-content: center; gap: var(--tw-2); margin-top: var(--tw-3); color: rgba(244, 234, 214, 0.85); font-size: var(--tw-fs-sm); }
.gm-catch-foot kbd { font: 600 var(--tw-fs-xs) var(--tw-mono); color: #f4ead6; padding: 2px calc(6 * var(--tw-u)); border-radius: 4px; border: 1px solid rgba(244, 234, 214, 0.3); background: rgba(244, 234, 214, 0.08); }
@media (prefers-reduced-motion: reduce) {
	.gm-catch.is-on .gm-catch-top, .gm-catch.is-on .gm-catch-bottom { animation: none; opacity: 1; }
	.gm-catch.is-on .gm-badge, .gm-catch.is-on .gm-badge.is-record { animation: none; transform: rotate(-3deg); opacity: 1; }
}
@media (max-width: 640px) {
	.gm-catch-stats { gap: 6px; }
	.gm-stat { min-width: 0; padding: 8px 10px; }
}
`;

const kgText = ( kg ) => String( Number( kg.toFixed( 2 ) ) );

const h = ( tag, cls, html ) => {

	const e = document.createElement( tag );
	if ( cls ) e.className = cls;
	if ( html !== undefined ) e.innerHTML = html;
	return e;

};

export class GameHUD {

	constructor( ui, game ) {

		this.ui = ui;
		this.game = game;
		const style = h( 'style' );
		style.textContent = CSS;
		document.head.append( style );

		this.purse = h( 'div', 'gm-purse tw-glass', `<span class="gm-money">$0</span><span class="gm-cooler"><span class="gm-cooler-label">海钓箱</span><span class="gm-cooler-bar"><span></span></span><span class="gm-cooler-kg">0 / 30 kg</span></span><span class="gm-gauge gm-fuel"><span>燃油</span><span class="gm-cooler-bar gm-fuel-bar"><span></span></span><b class="gm-fuel-l">40 L</b></span><span class="gm-gauge gm-sonar"><span>探鱼器</span><b class="gm-sonar-d">0 m</b><span class="gm-sonar-dots"></span></span>` );
		this.fuelEl = this.purse.querySelector( '.gm-fuel' );
		this.fuelBar = this.purse.querySelector( '.gm-fuel-bar > span' );
		this.fuelL = this.purse.querySelector( '.gm-fuel-l' );
		this.sonarEl = this.purse.querySelector( '.gm-sonar' );
		this.sonarD = this.purse.querySelector( '.gm-sonar-d' );
		this.sonarDots = this.purse.querySelector( '.gm-sonar-dots' );
		this.moneyEl = this.purse.querySelector( '.gm-money' );
		this.coolerEl = this.purse.querySelector( '.gm-cooler' );
		this.coolerBar = this.purse.querySelector( '.gm-cooler-bar > span' );
		this.coolerKg = this.purse.querySelector( '.gm-cooler-kg' );
		this.coolerLabel = this.purse.querySelector( '.gm-cooler-label' );

		this.fight = h( 'div', 'gm-fight tw-glass', `
			<div class="gm-fight-head"><span class="gm-fight-call">鱼上钩了！</span><span class="gm-fight-dist">0 m</span></div>
			<div class="gm-tension"><span class="gm-band"></span><span class="gm-danger"></span><span class="gm-needle"></span></div>
			<div class="gm-stamina"><span>鱼的体力</span><span class="gm-stamina-bar"><span></span></span></div>` );
		this.fCall = this.fight.querySelector( '.gm-fight-call' );
		this.fDist = this.fight.querySelector( '.gm-fight-dist' );
		this.fBand = this.fight.querySelector( '.gm-band' );
		this.fNeedle = this.fight.querySelector( '.gm-needle' );
		this.fStam = this.fight.querySelector( '.gm-stamina-bar > span' );

		this.bite = h( 'div', 'gm-bite', '!' );
		this.cast = h( 'div', 'gm-cast', '<span></span>' );
		this.castBar = this.cast.firstChild;
		this.catchCard = h( 'div', 'gm-catch' );
		this.catchOpen = false;
		const hud = ui.hud || ui.root;
		hud.append( this.purse, this.fight, this.bite, this.cast, this.catchCard );

		// panels (interactive)
		this.inv = h( 'div', 'gm-panel tw-glass tw-interactive' );
		this.stand = h( 'div', 'gm-panel tw-glass tw-interactive' );
		this.inv.inert = true;
		this.stand.inert = true;
		this.journalScrim = h( 'div', 'gm-journal-scrim tw-interactive' );
		this.journalScrim.hidden = true;
		this.journalScrim.onclick = () => this.closeJournal( true );
		this.journal = h( 'div', 'gm-panel gm-journal tw-glass tw-interactive' );
		this.journal.setAttribute( 'role', 'dialog' );
		this.journal.setAttribute( 'aria-modal', 'true' );
		this.journal.setAttribute( 'aria-label', '鱼类图鉴' );
		this.journal.inert = true;
		// 图鉴拥有键盘焦点，按钮操作不能同时触发游戏的移动、抛竿或交互。
		this.journal.addEventListener( 'keydown', ( e ) => {

			e.stopPropagation();
			if ( e.code === 'Escape' || e.code === 'KeyI' ) {

				e.preventDefault();
				if ( ! e.repeat ) {

					if ( e.code === 'Escape' ) this.closeJournal( true );
					else this.toggleInventory( false );

				}

			} else if ( e.code === 'Tab' ) {

				e.preventDefault();
				const buttons = [ ...this.journal.querySelectorAll( 'button:not([disabled])' ) ];
				const i = buttons.indexOf( document.activeElement );
				buttons[ ( i + ( e.shiftKey ? - 1 : 1 ) + buttons.length ) % buttons.length ]?.focus();

			}

		} );
		ui.root.append( this.inv, this.stand, this.journalScrim, this.journal );
		this.invOpen = false;
		this.standOpen = false;
		this.journalOpen = false;
		this._last = {};
		game.state.onChange( () => this.refresh() );
		this.refresh();

	}

	toast( text, ms ) {

		this.ui.toast( text, ms );

	}

	refresh() {

		const s = this.game.state;
		const st = s.stats;
		this.moneyEl.textContent = `$${ s.money.toLocaleString() }`;
		const kg = s.boxKg;
		this.coolerLabel.textContent = s.upgrades.hold > 0 ? '鱼舱' : '海钓箱';
		this.coolerKg.innerHTML = `<span class="gm-box-weight${ s.capacityReview && ! s.canCloseInventory ? ' is-overflow' : '' }">${ kgText( kg ) }</span> / ${ st.holdKg } kg`;
		this.coolerBar.style.width = `${ Math.min( 100, kg / st.holdKg * 100 ) }%`;
		this.coolerEl.classList.toggle( 'is-full', kg > st.holdKg * 0.9 );
		if ( this._last.money !== undefined && this._last.money !== s.money ) {

			this.purse.classList.remove( 'is-bump' );
			void this.purse.offsetWidth;
			this.purse.classList.add( 'is-bump' );

		}

		this._last.money = s.money;
		if ( this.invOpen ) this.renderInventory();
		if ( this.journalOpen ) this.renderJournal();
		if ( this.standOpen ) this.vendor && this.vendor.kind === 'shop' ? this.renderShop() : this.renderStand();

	}

	// per frame
	update( { fight, casting, power, bite, fuel = null, sonar = null } ) {

		// boat instruments in the purse: fuel while aboard, the fish finder when fitted
		this.fuelEl.classList.toggle( 'is-on', !! fuel );
		if ( fuel ) {

			this.fuelBar.style.width = `${ fuel.litres / fuel.tank * 100 }%`;
			this.fuelL.textContent = `${ fuel.litres.toFixed( 0 ) } L`;
			this.fuelEl.classList.toggle( 'is-low', fuel.litres < fuel.tank * 0.15 );

		}

		this.sonarEl.classList.toggle( 'is-on', !! sonar );
		if ( sonar ) {

			this.sonarD.textContent = `${ sonar.depth.toFixed( 1 ) } m`;
			const n = Math.round( sonar.fish * 4 );
			this.sonarDots.textContent = '●'.repeat( n ) + '○'.repeat( 4 - n );

		}


		this.fight.classList.toggle( 'is-on', !! fight );
		if ( fight ) {

			const T = Math.min( fight.tension, 1.05 );
			this.fNeedle.style.left = `${ T / 1.05 * 100 }%`;
			this.fNeedle.classList.toggle( 'is-hot', fight.tension > fight.band[ 1 ] );
			this.fBand.style.left = `${ fight.band[ 0 ] / 1.05 * 100 }%`;
			this.fBand.style.width = `${ ( fight.band[ 1 ] - fight.band[ 0 ] ) / 1.05 * 100 }%`;
			this.fStam.style.width = `${ fight.stamina * 100 }%`;
			this.fDist.textContent = `${ fight.distance.toFixed( 1 ) } m`;
			let call = '收线', cls = '';
			if ( fight.tension > 0.88 ) { call = '快松手！'; cls = 'is-warn'; }
			else if ( fight.surge > 0.55 ) { call = '鱼在猛冲！'; cls = 'is-warn'; }
			else if ( fight.tension < 0.15 ) { call = '鱼线太松！'; cls = 'is-warn'; }
			else if ( fight.tension >= fight.band[ 0 ] && fight.tension <= fight.band[ 1 ] ) { call = '张力正好'; cls = 'is-good'; }
			this.fCall.textContent = call;
			this.fCall.className = 'gm-fight-call ' + cls;

		}

		this.bite.classList.toggle( 'is-on', !! bite );
		this.cast.classList.toggle( 'is-on', !! casting );
		if ( casting ) this.castBar.style.width = `${ power * 100 }%`;

	}

	// ---- catch card
	// info: GameState.lastCatch ({ species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept })
	showCatch( info ) {

		const f = FISH[ info.species ];
		const inch = info.cm / 2.54, lb = info.kg * 2.20462;
		const badge = info.record ? '<span class="gm-badge is-record">★ 新纪录</span>'
			: info.newSpecies ? '<span class="gm-badge is-new">新鱼种</span>' : '<span class="gm-badge is-plain">鱼获</span>';
		let note;
		if ( ! info.kept ) note = `<div class="gm-catch-note is-warn">空间不足：${ this.game.state.upgrades.hold > 0 ? '鱼舱' : '海钓箱' }已满 · 已放生</div>`;
		else if ( info.record ) note = `<div class="gm-catch-note">此前纪录 <b>${ info.prevBestKg.toFixed( 2 ) } kg</b> · ${ info.prevBestCm } cm，超出 ${ ( info.kg - info.prevBestKg ).toFixed( 2 ) } kg。</div>`;
		else if ( info.newSpecies ) note = '<div class="gm-catch-note">首次收录进鱼类图鉴。</div>';
		else note = `<div class="gm-catch-note">你的纪录：${ info.prevBestKg.toFixed( 2 ) } kg · ${ info.prevBestCm } cm</div>`;
		this.toggleInventory( false );
		this.closeStand();
		const c = this.catchCard;
		c.innerHTML = `
			<div class="gm-catch-top">
				<div class="gm-catch-eyebrow">${ badge }</div>
				<h2>${ f.name }</h2>
				<div class="gm-catch-sci">${ f.sci || '' }</div>
			</div>
			<div class="gm-catch-bottom">
				<div class="gm-catch-stats">
					<div class="gm-stat"><span>长度</span><b>${ info.cm }<small>cm</small></b><i>${ inch.toFixed( 1 ) } 英寸</i></div>
					<div class="gm-stat"><span>重量</span><b>${ info.kg < 1 ? info.kg.toFixed( 2 ) : info.kg.toFixed( 1 ) }<small>kg</small></b><i>${ lb.toFixed( 1 ) } 磅</i></div>
					<div class="gm-stat is-value"><span>价值</span><b>$${ info.value }</b><i>${ info.kept ? '已收存' : '已放生' }</i></div>
				</div>
				${ note }
				<div class="gm-catch-foot"><kbd>点击</kbd>或按 <kbd>E</kbd> 收起鱼获</div>
			</div>`;
		// restart the entrance even when a card is already up
		c.classList.remove( 'is-on' );
		void c.offsetWidth;
		c.classList.add( 'is-on' );
		this.catchOpen = true;

	}

	hideCatch() {

		this.catchCard.classList.remove( 'is-on' );
		this.catchOpen = false;

	}

	// ---- inventory
	toggleInventory( force ) {

		const open = force ?? ! ( this.invOpen || this.journalOpen );
		if ( ! open && this.game.state.capacityReview ) {

			if ( ! this.game.state.canCloseInventory || ! this.game.finishCapacityReview() ) return;

		}
		this.closeJournal();
		this.invOpen = open;
		if ( this.invOpen ) {

			this.closeStand();
			this.renderInventory();
			releaseMouse();

		}

		this.inv.classList.toggle( 'is-open', this.invOpen );
		this.inv.inert = ! this.invOpen;

	}

	renderInventory() {

		const s = this.game.state;
		const pending = s.pendingCatch;
		const canClose = s.canCloseInventory;
		const fish = pending ? [ ...s.inventory, pending ] : s.inventory;
		const overflow = s.capacityReview ? `<div class="gm-overflow" role="status">
			<b>${ canClose ? '重量已低于容量上限' : '鱼获超重 · 请放生鱼获' }</b>
			<p>${ canClose ? '可以关闭海钓箱，保留列表中的鱼获。' : `请放生任意鱼获，让总重量低于 ${ s.stats.holdKg } kg。可选择本次鱼获或箱内其他鱼。` }</p>
		</div>` : '';
		const rows = fish.map( ( f ) => `<div class="gm-row has-cm"><span>${ FISH[ f.species ].name }${ f.id === pending?.id ? '<small>本次鱼获</small>' : f.record ? '<small>纪录</small>' : '' }</span><span class="gm-cm">${ f.cm ?? Math.round( fishLengthCm( f.species, f.kg ) ) } cm</span><span class="gm-kg">${ f.kg.toFixed( 2 ) } kg</span><span class="gm-val">$${ f.value }</span><button class="gm-mini" data-release="${ f.id }">放生</button></div>` ).join( '' );
		this.inv.innerHTML = `
			<h2>${ s.upgrades.hold > 0 ? '鱼舱' : '海钓箱' }</h2>
			<p class="gm-sub">${ fish.length } 条鱼 · <span class="gm-box-weight${ ! canClose ? ' is-overflow' : '' }">${ kgText( s.boxKg ) }</span> / ${ s.stats.holdKg } kg · 总价值 $${ s.holdValue + ( pending?.value || 0 ) }</p>
			${ overflow }
			<div class="gm-list">${ rows || '<div class="gm-empty">还没有鱼获。到码头、沙滩或船上抛竿吧。</div>' }</div>
			<p class="gm-inv-hint">到码头旁的鱼摊出售</p>
			<div class="gm-foot"><button class="gm-btn" data-journal ${ s.capacityReview ? 'disabled' : '' }>图鉴</button>${ canClose ? '<button class="gm-btn is-ghost" data-close>关闭（I）</button>' : '' }</div>`;
		const close = this.inv.querySelector( '[data-close]' );
		if ( close ) close.onclick = () => this.toggleInventory( false );
		this.inv.querySelector( '[data-journal]' ).onclick = () => this.openJournal();
		for ( const b of this.inv.querySelectorAll( '[data-release]' ) ) b.onclick = () => this.game.releaseFish( Number( b.dataset.release ) );

	}

	// ---- fish journal (the lifetime log, independent of the fish still in the box)
	openJournal() {

		if ( this.game.state.capacityReview ) return;
		this.toggleInventory( false );
		this.closeStand();
		this.journalOpen = true;
		this.renderJournal();
		this.journalScrim.hidden = false;
		this.journal.inert = false;
		this.journal.classList.add( 'is-open' );
		releaseMouse();
		this.journal.querySelector( '[data-back]' ).focus( { preventScroll: true } );

	}

	closeJournal( returnToInventory = false ) {

		this.journalOpen = false;
		this.journal.classList.remove( 'is-open' );
		this.journal.inert = true;
		this.journalScrim.hidden = true;
		if ( returnToInventory ) {

			this.toggleInventory( true );
			this.inv.querySelector( '[data-journal]' ).focus( { preventScroll: true } );

		}

	}

	renderJournal() {

		const s = this.game.state;
		const entries = Object.keys( FISH ).filter( ( id ) => Number.isFinite( s.log[ id ]?.count ) && s.log[ id ].count > 0 );
		const count = entries.reduce( ( total, id ) => total + s.log[ id ].count, 0 );
		const cards = Object.keys( FISH ).map( ( id ) => {

			const known = entries.includes( id );
			const f = FISH[ id ], log = known ? s.log[ id ] : { count: 0, bestKg: 0 };
			const kg = Number.isFinite( log.bestKg ) ? Math.max( 0, log.bestKg ) : 0;
			const cm = Math.round( Number.isFinite( log.bestCm ) ? Math.max( 0, log.bestCm ) : fishLengthCm( id, kg ) );
			return `<article class="gm-journal-card${ known ? '' : ' is-unknown' }" data-species="${ id }">
				<div class="gm-journal-art"><img width="360" height="170" alt="${ known ? f.name : '未捕获鱼类的轮廓' }" hidden><span class="gm-journal-loading">正在加载…</span></div>
				<div class="gm-journal-detail"><h3>${ known ? f.name : '？？？' }</h3><p class="gm-journal-sci">${ known ? f.sci : '尚未捕获' }</p>
					<dl class="gm-journal-stats">
						<div><dt>钓到</dt><dd>${ Math.floor( log.count ) }<small>条</small></dd></div>
						<div><dt>最重</dt><dd>${ known ? kg.toFixed( 2 ) : '—' }<small>kg</small></dd></div>
						<div><dt>最长</dt><dd>${ known ? cm : '—' }<small>cm</small></dd></div>
					</dl>
				</div></article>`;

		} ).join( '' );
		const scroll = this.journal.querySelector( '.gm-journal-grid' )?.scrollTop || 0;
		const focused = this.journal.contains( document.activeElement )
			? ( document.activeElement.hasAttribute( 'data-back' ) ? '[data-back]' : '[data-close]' ) : null;
		this.journal.innerHTML = `
			<h2>鱼类图鉴</h2>
			<p class="gm-sub">已收录 ${ entries.length } / ${ Object.keys( FISH ).length } 种 · 累计钓到 ${ Math.floor( count ) } 条</p>
			${ entries.length ? '' : '<p class="gm-sub">还没有收录的鱼。钓到后会解锁图片、名称和纪录。</p>' }
			<div class="gm-journal-grid">${ cards }</div>
			<div class="gm-foot"><button class="gm-btn is-ghost" data-back>返回${ s.upgrades.hold > 0 ? '鱼舱' : '海钓箱' }</button><button class="gm-btn" data-close>关闭（I）</button></div>`;
		this.journal.querySelector( '.gm-journal-grid' ).scrollTop = scroll;
		this.journal.querySelector( '[data-back]' ).onclick = () => this.closeJournal( true );
		this.journal.querySelector( '[data-close]' ).onclick = () => this.toggleInventory( false );
		if ( focused ) this.journal.querySelector( focused ).focus( { preventScroll: true } );
		try {

			if ( ! this.portrait ) this.portrait = new FishPortrait();
			for ( const card of this.journal.querySelectorAll( '[data-species]' ) ) {

				const img = card.querySelector( 'img' );
				const show = ( url ) => {

					// 刷新后的旧卡片不能再被异步缩略图更新。
					if ( ! img.isConnected ) return;
					if ( url ) {

						img.src = url;
						img.hidden = false;
						card.querySelector( '.gm-journal-loading' ).hidden = true;

					} else card.querySelector( '.gm-journal-loading' ).textContent = '图片暂不可用';

				};
				const cached = this.portrait.thumbUrl( card.dataset.species );
				if ( cached ) show( cached );
				else this.portrait.thumbnail( card.dataset.species ).then( show );

			}

		} catch ( e ) {

			for ( const label of this.journal.querySelectorAll( '.gm-journal-loading' ) ) label.textContent = '图片暂不可用';
			console.warn( 'fish journal portraits unavailable', e );

		}

	}

	// ---- fish stand
	openStand( vendor ) {

		this.standOpen = true;
		this.vendor = vendor;
		this.toggleInventory( false );
		if ( vendor.kind === 'shop' ) this.renderShop();
		else this.renderStand();
		this.stand.classList.add( 'is-open' );
		this.stand.inert = false;
		releaseMouse();

	}

	closeStand() {

		this.standOpen = false;
		this.stand.classList.remove( 'is-open' );
		this.stand.inert = true;

	}

	renderStand() {

		const s = this.game.state;
		const v = this.vendor || { name: '鱼获收购' };
		const rows = s.inventory.map( ( f ) => `<div class="gm-row has-cm"><span>${ FISH[ f.species ].name }</span><span class="gm-cm">${ f.cm ?? Math.round( fishLengthCm( f.species, f.kg ) ) } cm</span><span class="gm-kg">${ f.kg.toFixed( 2 ) } kg</span><span class="gm-val">$${ f.value }</span><button class="gm-mini" data-sell="${ f.id }">出售</button></div>` ).join( '' );
		this.stand.innerHTML = `
			<h2>${ v.name }</h2>
			<p class="gm-sub">${ s.inventory.length ? v.greeting || '让我看看你的鱼获。' : v.idle || '钓到鱼再来吧。' }</p>
			<div class="gm-list">${ rows || '<div class="gm-empty">你的海钓箱是空的。</div>' }</div>
			<div class="gm-foot"><button class="gm-btn is-ghost" data-close>离开（E）</button><button class="gm-btn" data-all ${ s.inventory.length ? '' : 'disabled' }>全部出售 · $${ s.holdValue }</button></div>`;
		this.stand.querySelector( '[data-close]' ).onclick = () => this.closeStand();
		this.stand.querySelector( '[data-all]' ).onclick = () => this.game.sellAll();
		for ( const b of this.stand.querySelectorAll( '[data-sell]' ) ) b.onclick = () => this.game.sell( [ Number( b.dataset.sell ) ] );

	}

}

GameHUD.prototype.renderShop = function () {

	const s = this.game.state;
	const v = this.vendor;
	const rows = Object.entries( UPGRADES ).map( ( [ key, track ] ) => {

		const cur = track.levels[ s.upgrades[ key ] | 0 ];
		const next = nextLevel( s.upgrades, key );
		const btn = next
			? `<button class="gm-btn" data-buy="${ key }" ${ next.cost > s.money ? 'disabled' : '' }>$${ next.cost }</button>`
			: '<span class="gm-have">已升至顶级</span>';
		return `<div class="gm-shop-row"><span>${ track.name }: ${ next ? next.label : cur.label }<small>当前：${ cur.label }</small></span>${ btn }</div>`;

	} ).join( '' );
	const missing = s.stats.fuelL - s.fuelL;
	const fuelRow = `<div class="gm-shop-row"><span>柴油 · $${ FUEL_PRICE.toFixed( 2 ) } / L<small>油箱：${ s.fuelL.toFixed( 0 ) } / ${ s.stats.fuelL } 升</small></span>${ missing > 0.5 ? `<button class="gm-btn" data-fuel ${ s.money < FUEL_PRICE ? 'disabled' : '' }>加油 · $${ s.refuelCost() }</button>` : '<span class="gm-have">已满</span>' }</div>`;
	this.stand.innerHTML = `
		<h2>${ v.name }</h2>
		<p class="gm-sub">${ v.greeting } · 余额 $${ s.money.toLocaleString() }</p>
		<div class="gm-list">${ fuelRow }${ rows }</div>
		<div class="gm-foot"><span class="gm-sub">升级立即生效</span><button class="gm-btn is-ghost" data-close>离开（E）</button></div>`;
	this.stand.querySelector( '[data-close]' ).onclick = () => this.closeStand();
	for ( const b of this.stand.querySelectorAll( '[data-buy]' ) ) b.onclick = () => this.game.buy( b.dataset.buy );
	const f = this.stand.querySelector( '[data-fuel]' );
	if ( f ) f.onclick = () => this.game.refuel();

};

function releaseMouse() {

	try {

		if ( document.pointerLockElement && document.exitPointerLock ) document.exitPointerLock();

	} catch ( e ) { /* ignore */ }

}

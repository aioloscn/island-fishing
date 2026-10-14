import './core/BenchSeed.js';
import { App } from './App.js';
import { UI } from './ui/UI.js';
import { AppUI } from './ui/AppUI.js';
import { ProjectStorage } from './game/ProjectStorage.js';

// ?bench runs in background tabs too (automation): rAF does not fire in a hidden page
if ( /[?&]bench\b/.test( location.search ) ) {

	const raf = window.requestAnimationFrame.bind( window ), caf = window.cancelAnimationFrame.bind( window );
	window.requestAnimationFrame = ( cb ) => document.visibilityState === 'hidden' ? setTimeout( () => cb( performance.now() ), 16 ) : raf( cb );
	window.cancelAnimationFrame = ( id ) => ( clearTimeout( id ), caf( id ) );

}

const ui = new UI();
const app = new App();
window.__ui = ui;

const saveNotice = document.createElement( 'div' );
saveNotice.className = 'tw-save-notice';
saveNotice.hidden = true;
saveNotice.setAttribute( 'role', 'alert' );
const saveMessage = document.createElement( 'span' ), saveRetry = document.createElement( 'button' );
saveNotice.append( saveMessage, saveRetry );
document.body.append( saveNotice );
const storage = new ProjectStorage( { onStatus( status ) {

	saveNotice.hidden = ! status;
	saveMessage.textContent = status === 'conflict' ? '存档已被其他窗口更新，本窗口的进度未保存。请刷新后继续。' : '进度尚未保存到项目，请检查服务并重试。';
	saveRetry.textContent = status === 'conflict' ? '刷新' : '重试保存';
	saveRetry.onclick = () => status === 'conflict' ? location.reload() : storage.flush();

} } );

ui.setLoading( 0, '正在读取项目存档…' );
storage.load().then( () => {

	app.gameStorage = storage;
	return app.init( ( p, text, until ) => ui.setLoading( p, text, until ) );

} ).then( async () => {

	app.ui = new AppUI( app, ui );
	ui.setLoading( 1, '准备就绪' );
	await ui.hideLoader();
	// frame-time benchmark and reference shots (see core/Bench.js): it drives the frames itself
	if ( app.qs.has( 'bench' ) ) {

		window.__bench = new ( await import( './core/Bench.js' ) ).Bench( app );
		if ( app.qs.has( 'auto' ) ) window.__job = window.__bench.auto( app.qs.get( 'auto' ), { runs: Number( app.qs.get( 'runs' ) ) || 1 } );
		// ?bench&shots=view1,view2[&tag=name][&dt=seconds][&seq=n&every=frames]: reference shots of the named views only (core/DebugViews.js; dt > 0: the clock runs, e.g. for the eased lens flare)
		// &wdbg=N: the water shader's debug view (WaterMaterial debugMode) in the shots
		if ( app.qs.has( 'wdbg' ) && app.waterMaterial ) app.waterMaterial.debugMode.value = Number( app.qs.get( 'wdbg' ) );
		if ( app.qs.has( 'shots' ) ) window.__job = window.__bench.shots( app.qs.get( 'shots' ).split( ',' ), { tag: app.qs.get( 'tag' ) || 'shot', dt: Number( app.qs.get( 'dt' ) ) || 0, seq: Number( app.qs.get( 'seq' ) ) || 1, every: Number( app.qs.get( 'every' ) ) || 1 } );

	} else app.start();
	ui.showStartOverlay( () => {

		app.input.requestLock();
		if ( app.audio ) app.audio.resume();

	} );

} ).catch( ( e ) => {

	console.error( e );
	ui.setLoadingError( '加载失败：' + e.message );

} );

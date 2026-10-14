import { defineConfig } from 'vite';
import { projectSavePlugin } from './tools/project-save.mjs';

export default defineConfig( {
	plugins: [ projectSavePlugin() ],
	preview: { host: '127.0.0.1' },
	server: { port: 5188, strictPort: true, host: '127.0.0.1', fs: { deny: [ '**/.git/**', '**/data/**', '.env', '.env.*', '*.{crt,pem}' ] } },
	// relative asset paths: the build runs from any sub-path (GitHub Pages serves it under /tidewater/)
	base: './',
	build: { target: 'esnext', chunkSizeWarningLimit: 4000 },
} );

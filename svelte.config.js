import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// BASE_PATH erlaubt Deploy auf GitHub-Pages-Subpfaden (z.B. /balkon-dielen-planer).
// Muss leer sein oder mit '/' beginnen.
/** @type {'' | `/${string}`} */
const base = /** @type {any} */ (process.env.BASE_PATH ?? '');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html',
			precompress: false,
			strict: true
		}),
		paths: { base }
	}
};

export default config;

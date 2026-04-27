import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Eigenständige Vitest-Konfiguration (ohne SvelteKit-Plugin),
// damit Versionskonflikte zwischen Vite 6 (Root) und Vitests
// gebündelter Vite-Version vermieden werden.
export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: false
	}
});

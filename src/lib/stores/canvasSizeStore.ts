import { writable } from 'svelte/store';
import { CONSTANTS } from '$lib/types';

const STORAGE_KEY = 'balkon-canvas-size';
const DEFAULT_WIDTH = 4500;
const DEFAULT_HEIGHT = 3500;
const DEFAULT_PX_WIDTH = CONSTANTS.CANVAS_WIDTH;
const DEFAULT_PX_HEIGHT = CONSTANTS.CANVAS_HEIGHT;

interface StoredSize {
	width: number;
	height: number;
	pxWidth: number;
	pxHeight: number;
}

function loadFromStorage(): StoredSize {
	if (typeof window === 'undefined') {
		return {
			width: DEFAULT_WIDTH,
			height: DEFAULT_HEIGHT,
			pxWidth: DEFAULT_PX_WIDTH,
			pxHeight: DEFAULT_PX_HEIGHT
		};
	}
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const data = JSON.parse(saved);
			return {
				width: data.width || DEFAULT_WIDTH,
				height: data.height || DEFAULT_HEIGHT,
				pxWidth: data.pxWidth || DEFAULT_PX_WIDTH,
				pxHeight: data.pxHeight || DEFAULT_PX_HEIGHT
			};
		}
	} catch (e) {
		console.error('Failed to load canvas size:', e);
	}
	return {
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT,
		pxWidth: DEFAULT_PX_WIDTH,
		pxHeight: DEFAULT_PX_HEIGHT
	};
}

function persist(state: { widthMM: number; heightMM: number; pxWidth: number; pxHeight: number }) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				width: state.widthMM,
				height: state.heightMM,
				pxWidth: state.pxWidth,
				pxHeight: state.pxHeight
			})
		);
	} catch (e) {
		console.error('Failed to save canvas size:', e);
	}
}

function createCanvasSizeStore() {
	const initial = loadFromStorage();
	const { subscribe, update } = writable({
		widthMM: initial.width,
		heightMM: initial.height,
		pxWidth: initial.pxWidth,
		pxHeight: initial.pxHeight
	});

	return {
		subscribe,
		setSize: (widthMM: number, heightMM: number) => {
			update((s) => {
				const state = { ...s, widthMM, heightMM };
				persist(state);
				return state;
			});
		},
		setPixelSize: (pxWidth: number, pxHeight: number) => {
			update((s) => {
				const state = { ...s, pxWidth: Math.round(pxWidth), pxHeight: Math.round(pxHeight) };
				persist(state);
				return state;
			});
		}
	};
}

export const canvasSizeStore = createCanvasSizeStore();

import { writable, derived } from 'svelte/store';
import type { PlanState } from '$lib/types';
import { calculatePolygonArea } from '$lib/utils/geometry';

const STORAGE_KEY = 'balkon-planer-data';

function loadFromStorage(): Partial<PlanState> | null {
	if (typeof window === 'undefined') return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : null;
	} catch (e) {
		console.error('Failed to load from storage:', e);
		return null;
	}
}

function saveToStorage(data: PlanState) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('Failed to save to storage:', e);
	}
}

const saved = loadFromStorage();

function createPlanStore() {
	const { subscribe, update } = writable<PlanState>({
		polygonPoints: saved?.polygonPoints ?? [],
		isDrawingPolygon: false,
		plankWidth: saved?.plankWidth ?? 140, // 140 mm = 14 cm
		plankLengths: saved?.plankLengths ?? [2000, 3000, 4000], // mm statt cm
		placedPlanks: saved?.placedPlanks ?? [],
		totalWaste: saved?.totalWaste ?? 0,
		totalPlankArea: saved?.totalPlankArea ?? 0,
		mouseX: 0,
		mouseY: 0,
		selectedPointIndex: -1,
		startFrom: saved?.startFrom ?? 'left',
		generatedPlanks: saved?.generatedPlanks ?? [],
		selectedPlankIndex: -1,
		sawKerf: saved?.sawKerf ?? 3, // Standard-Sägeschnitt 3 mm
		cuttable: saved?.cuttable ?? true
	});

	/** update + automatisch persistieren */
	function persist(fn: (s: PlanState) => Partial<PlanState>) {
		update((s) => {
			const newState = { ...s, ...fn(s) };
			saveToStorage(newState);
			return newState;
		});
	}

	return {
		subscribe,

		// Polygon
		startDrawing: () =>
			persist(() => ({
				isDrawingPolygon: true,
				polygonPoints: [],
				placedPlanks: []
			})),
		finishDrawing: () => persist(() => ({ isDrawingPolygon: false })),
		addPolygonPoint: (x: number, y: number) =>
			persist((s) => {
				const newPoints = [...s.polygonPoints, x, y];
				return { polygonPoints: newPoints, selectedPointIndex: newPoints.length / 2 - 1 };
			}),
		setPolygonPoints: (points: number[]) => persist(() => ({ polygonPoints: points })),
		resetPolygon: () =>
			persist(() => ({
				polygonPoints: [],
				selectedPointIndex: -1,
				isDrawingPolygon: false,
				generatedPlanks: [],
				placedPlanks: [],
				totalWaste: 0,
				totalPlankArea: 0
			})),

		// Dielen-Einstellungen
		setPlankWidth: (width: number) => persist(() => ({ plankWidth: width })),
		addPlankLength: () =>
			persist((s) => ({
				plankLengths: [...s.plankLengths, 2000] // 2000 mm = 200 cm
			})),
		removePlankLength: (index: number) =>
			persist((s) => ({
				plankLengths: s.plankLengths.filter((_, i) => i !== index)
			})),
		updatePlankLength: (index: number, value: number) =>
			persist((s) => {
				const newLengths = [...s.plankLengths];
				newLengths[index] = value;
				return { plankLengths: newLengths };
			}),
		setStartFrom: (from: 'left' | 'right') => persist(() => ({ startFrom: from })),
		setSawKerf: (kerf: number) => persist(() => ({ sawKerf: kerf })),
		setPlankLengths: (lengths: number[]) => persist(() => ({ plankLengths: lengths })),
		setCuttable: (cuttable: boolean) => persist(() => ({ cuttable })),

		// Berechnungsergebnisse
		setPlanks: (planks: PlanState['placedPlanks'], waste: number, area: number) =>
			persist(() => ({ placedPlanks: planks, totalWaste: waste, totalPlankArea: area })),

		// Generierte Dielen (für Verlege-Modus) - speichert auch aktuelle Breite explizit
		generatePlanks: (planks: PlanState['generatedPlanks'], width?: number) =>
			persist((s) => ({
				generatedPlanks: planks,
				selectedPlankIndex: -1,
				plankWidth: width ?? s.plankWidth,
				placedPlanks: [], // Alte berechnete Dielen löschen (blaue Linien entfernen)
				totalWaste: 0,
				totalPlankArea: 0
			})),
		selectPlank: (index: number) => update((s) => ({ ...s, selectedPlankIndex: index })),

		// Maus-Tracking (nur temporär, nicht persistiert)
		setMousePosition: (x: number, y: number) => update((s) => ({ ...s, mouseX: x, mouseY: y })),

		// Punkt-Auswahl (nicht persistiert)
		selectPoint: (index: number) => update((s) => ({ ...s, selectedPointIndex: index })),

		// Punkt-Bearbeitung
		updatePoint: (index: number, x: number, y: number) =>
			persist((s) => {
				const newPoints = [...s.polygonPoints];
				newPoints[index * 2] = x;
				newPoints[index * 2 + 1] = y;
				return { polygonPoints: newPoints };
			}),
		removePoint: (index: number) =>
			persist((s) => {
				const newPoints = [...s.polygonPoints];
				newPoints.splice(index * 2, 2);
				let newSelected = s.selectedPointIndex;
				if (index === s.selectedPointIndex) {
					newSelected = -1; // Auswahl aufheben wenn gelöschter Punkt ausgewählt war
				} else if (index < s.selectedPointIndex) {
					newSelected = s.selectedPointIndex - 1; // Index korrigieren wenn vorher gelöscht
				}
				return { polygonPoints: newPoints, selectedPointIndex: newSelected };
			})
	};
}

export const planStore = createPlanStore();

// Derived stores

/** Polygon-Fläche in cm², immer aus aktuellen Punkten berechnet */
export const polygonArea = derived(planStore, ($plan) => calculatePolygonArea($plan.polygonPoints));

export const coveragePercent = derived([planStore, polygonArea], ([$plan, $area]) =>
	$area > 0 ? ($plan.totalPlankArea / $area) * 100 : 0
);

export const polygonComplete = derived(planStore, ($plan) => $plan.polygonPoints.length >= 6);

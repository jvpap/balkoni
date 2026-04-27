import { describe, it, expect } from 'vitest';
import { generatePlanksForPolygon, calculateJoints } from '$lib/utils/plankCalculator';
import type { Plank } from '$lib/types';

const square = [0, 0, 1000, 0, 1000, 800, 0, 800];

describe('generatePlanksForPolygon', () => {
	it('liefert leeres Array für entartete Polygone', () => {
		expect(generatePlanksForPolygon([], 145, 'left')).toEqual([]);
		expect(generatePlanksForPolygon([0, 0, 100, 100], 145, 'left')).toEqual([]);
	});

	it('verteilt Dielen vollständig über die Breite (links)', () => {
		// 1000 mm / 145 mm = 6 vollständige + Rest → 7 Dielen erwartet
		const planks = generatePlanksForPolygon(square, 145, 'left');
		expect(planks.length).toBeGreaterThan(0);
		// Jede Diele hat Plankenbreite
		expect(planks.every((p) => p.width === 145)).toBe(true);
		// Beginnen bei minX = 0
		expect(planks[0].x).toBe(0);
		// Lückenlos nebeneinander
		for (let i = 1; i < planks.length; i++) {
			expect(planks[i].x).toBeCloseTo(planks[i - 1].x + 145, 6);
		}
	});

	it('verteilt Dielen von rechts (Spiegelung)', () => {
		const planks = generatePlanksForPolygon(square, 145, 'right');
		expect(planks.length).toBeGreaterThan(0);
		// Letzte Diele endet bei maxX = 1000
		const last = planks.reduce((max, p) => (p.x > max.x ? p : max), planks[0]);
		expect(last.x + last.width).toBe(1000);
	});

	it('Plankenlänge entspricht der Polygonhöhe an dieser Stelle (Rechteck)', () => {
		const planks = generatePlanksForPolygon(square, 200, 'left');
		// Bei einem 1000×800 Rechteck haben alle Dielen Höhe 800
		expect(planks.every((p) => p.height === 800)).toBe(true);
		expect(planks.every((p) => p.length === 800)).toBe(true);
	});

	it('passt sich nicht-rechteckigen Polygonen an', () => {
		// Dreieck (0,0)-(1000,0)-(0,800): mit zunehmendem X sinkt die Höhe
		const triangle = [0, 0, 1000, 0, 0, 800];
		const planks = generatePlanksForPolygon(triangle, 100, 'left');
		expect(planks.length).toBeGreaterThan(0);
		// Erste Diele (links) muss länger sein als die letzte (rechts)
		const sorted = [...planks].sort((a, b) => a.x - b.x);
		expect(sorted[0].height).toBeGreaterThan(sorted[sorted.length - 1].height);
	});
});

describe('calculateJoints', () => {
	it('liefert leere Result für 0 oder 1 Diele', () => {
		expect(calculateJoints([], square).totalLength).toBe(0);
		const single: Plank[] = [
			{ x: 0, y: 0, width: 145, height: 800, length: 800, actualLength: 800, waste: 0 }
		];
		expect(calculateJoints(single, square).totalLength).toBe(0);
	});

	it('produziert N-1 Fugen für N benachbarte Dielen im Rechteck', () => {
		// 4 Dielen à 200 mm in 1000×800 Rechteck → 3 Fugen, je 800 mm
		const planks: Plank[] = [];
		for (let i = 0; i < 4; i++) {
			planks.push({
				x: i * 200,
				y: 0,
				width: 200,
				height: 800,
				length: 800,
				actualLength: 800,
				waste: 0
			});
		}
		const r = calculateJoints(planks, square);
		expect(r.segments).toHaveLength(3);
		expect(r.totalLength).toBe(3 * 800);
	});

	it('zählt nur den Anteil innerhalb des Polygons (Dreieck)', () => {
		// Dreieck (0,0)-(1000,0)-(0,800)
		const triangle = [0, 0, 1000, 0, 0, 800];
		const planks: Plank[] = [
			{ x: 0, y: 0, width: 200, height: 800, length: 800, actualLength: 800, waste: 0 },
			{ x: 200, y: 0, width: 200, height: 640, length: 640, actualLength: 640, waste: 0 }
		];
		const r = calculateJoints(planks, triangle);
		// Die Fuge bei x=200 schneidet die Dreieckshypotenuse y = 800 - 0.8*x → bei x=200: y=640
		// Polygon-Innensegment vertikal: [0, 640]
		expect(r.segments).toHaveLength(1);
		expect(r.segments[0].x).toBe(200);
		expect(r.totalLength).toBeCloseTo(640, 6);
	});

	it('ignoriert nicht-benachbarte Dielen (Lücken)', () => {
		const planks: Plank[] = [
			{ x: 0, y: 0, width: 200, height: 800, length: 800, actualLength: 800, waste: 0 },
			// Lücke 200 mm
			{ x: 400, y: 0, width: 200, height: 800, length: 800, actualLength: 800, waste: 0 }
		];
		const r = calculateJoints(planks, square);
		expect(r.segments).toHaveLength(0);
		expect(r.totalLength).toBe(0);
	});
});

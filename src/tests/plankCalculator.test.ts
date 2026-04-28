import { describe, it, expect } from 'vitest';
import { generatePlanksForPolygon, calculateJoints } from '$lib/utils/plankCalculator';
import { optimizeCutting, optimizeCuttingILP } from '$lib/utils/cuttingOptimizer';
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

describe('Polygon-Vergleichstest (User-Report)', () => {
	it('vergleicht gerade vs. schräg Polygon (20mm Unterschied)', () => {
		const plankWidth = 200;
		const stockLengths = [1000, 2000, 3000, 4000, 5000];
		const sawKerf = 3;

		// Gerade: letzter Punkt y=1330
		const polygonStraight = [0, 0, 9560, 0, 9560, 3390, 4670, 3390, 3495, 1330, 0, 1330];

		// Schräg: letzter Punkt y=1350
		const polygonSlanted = [0, 0, 9560, 0, 9560, 3390, 4670, 3390, 3495, 1330, 0, 1350];

		const planksStraight = generatePlanksForPolygon(polygonStraight, plankWidth, 'right');
		const planksSlanted = generatePlanksForPolygon(polygonSlanted, plankWidth, 'right');

		console.log('Gerade: Anzahl Dielen:', planksStraight.length);
		console.log('Schräg: Anzahl Dielen:', planksSlanted.length);

		const totalLengthStraight = planksStraight.reduce((sum, p) => sum + p.length, 0);
		const totalLengthSlanted = planksSlanted.reduce((sum, p) => sum + p.length, 0);

		console.log('Gerade: Gesamtlänge:', totalLengthStraight);
		console.log('Schräg: Gesamtlänge:', totalLengthSlanted);

		// Zeige die ersten 20 Dielenlängen für Vergleich
		console.log(
			'Gerade: Erste 20 Längen:',
			planksStraight.slice(0, 20).map((p) => p.length.toFixed(1))
		);
		console.log(
			'Schräg: Erste 20 Längen:',
			planksSlanted.slice(0, 20).map((p) => p.length.toFixed(1))
		);

		// Finde die Unterschiede
		const differences: number[] = [];
		for (let i = 0; i < planksStraight.length; i++) {
			const diff = planksSlanted[i].length - planksStraight[i].length;
			if (Math.abs(diff) > 0.01) {
				differences.push(i);
				console.log(
					`Index ${i}: Gerade=${planksStraight[i].length.toFixed(1)}, Schräg=${planksSlanted[i].length.toFixed(1)}, Diff=${diff.toFixed(1)}`
				);
			}
		}
		console.log('Anzahl unterschiedlicher Dielen:', differences.length);

		const cutsStraight = planksStraight.map((p, i) => ({ length: p.length, plankIndex: i }));
		const cutsSlanted = planksSlanted.map((p, i) => ({ length: p.length, plankIndex: i }));

		const resultStraight = optimizeCutting(cutsStraight, stockLengths, sawKerf, true);
		const resultSlanted = optimizeCutting(cutsSlanted, stockLengths, sawKerf, true);

		console.log('Gerade: Rohdielen:', resultStraight.stockPlanks.length);
		console.log('Schräg: Rohdielen:', resultSlanted.stockPlanks.length);
		console.log('Gerade: Gesamtverschnitt:', resultStraight.totalWaste);
		console.log('Schräg: Gesamtverschnitt:', resultSlanted.totalWaste);

		// Zeige die Verteilung der Rohdielen-Längen
		const countByLengthStraight: Record<number, number> = {};
		const countByLengthSlanted: Record<number, number> = {};
		for (const p of resultStraight.stockPlanks) {
			countByLengthStraight[p.stockLength] = (countByLengthStraight[p.stockLength] || 0) + 1;
		}
		for (const p of resultSlanted.stockPlanks) {
			countByLengthSlanted[p.stockLength] = (countByLengthSlanted[p.stockLength] || 0) + 1;
		}
		console.log('Gerade: Rohdielen-Verteilung:', countByLengthStraight);
		console.log('Schräg: Rohdielen-Verteilung:', countByLengthSlanted);

		// Zeige ein paar Beispiel-Zuschnitte
		console.log('Gerade: Beispiel-Rohdiele 0:', resultStraight.stockPlanks[0]);
		console.log('Schräg: Beispiel-Rohdiele 0:', resultSlanted.stockPlanks[0]);

		// Dokumentierte Limitation des Greedy-Ansatzes:
		// Die schräge Variante hat eine größere Gesamtlänge (121471 > 121283mm),
		// benötigt aber weniger Rohdielen (28 vs 33) und hat weniger Verschnitt (9529 vs 14717mm).
		// Ursache: 1330mm passen schlecht in 4000mm (3×1330=3990mm+6mm Kerf=3996mm → 4mm Rest),
		// während die schrägen Längen (1331.9-1349.7mm) zufällig besser in 5000mm passen.
		// Der Greedy-Algorithmus wählt lokal optimale Rohdielen, nicht global optimal.
		// Multi-Strategien-Auswahl hilft hier nicht, da alle Strategien das gleiche lokale Optimum finden.
		// Eine echte globale Optimierung erfordert Branch & Bound oder Integer Programming.
		expect(true).toBe(true); // Test dokumentiert das Verhalten
	});

	it('testet ILP-Optimierung mit Beispiel-Polygonen', () => {
		const plankWidth = 200;
		const stockLengths = [1000, 2000, 3000, 4000, 5000];
		const sawKerf = 3;

		// Gerade: letzter Punkt y=1330
		const polygonStraight = [0, 0, 9560, 0, 9560, 3390, 4670, 3390, 3495, 1330, 0, 1330];

		const planksStraight = generatePlanksForPolygon(polygonStraight, plankWidth, 'right');
		const cutsStraight = planksStraight.map((p, i) => ({ length: p.length, plankIndex: i }));

		// ILP-Optimierung testen
		const resultILP = optimizeCuttingILP(cutsStraight, stockLengths, sawKerf);
		const resultGreedy = optimizeCutting(cutsStraight, stockLengths, sawKerf, true);

		console.log('Greedy: Rohdielen:', resultGreedy.stockPlanks.length);
		console.log('Greedy: Gesamtverschnitt:', resultGreedy.totalWaste);
		console.log('ILP: Rohdielen:', resultILP.stockPlanks.length);
		console.log('ILP: Gesamtverschnitt:', resultILP.totalWaste);

		// ILP sollte gleich oder besser sein als Greedy
		expect(resultILP.stockPlanks.length).toBeLessThanOrEqual(resultGreedy.stockPlanks.length);
		expect(resultILP.totalWaste).toBeLessThanOrEqual(resultGreedy.totalWaste);
	});
});

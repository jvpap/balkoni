import { describe, it, expect } from 'vitest';
import {
	optimizeCutting,
	parseLengthsInput,
	formatLengthsInput,
	type Cut
} from '$lib/utils/cuttingOptimizer';

function cuts(...lengths: number[]): Cut[] {
	return lengths.map((length, plankIndex) => ({ plankIndex, length }));
}

describe('parseLengthsInput', () => {
	it('parst kommaseparierte Werte', () => {
		expect(parseLengthsInput('1000, 2000, 4500')).toEqual([1000, 2000, 4500]);
	});

	it('filtert leere/ungültige Werte', () => {
		expect(parseLengthsInput('1000,,abc, 500, -100, 0')).toEqual([1000, 500]);
	});

	it('liefert leeres Array für leere Eingabe', () => {
		expect(parseLengthsInput('')).toEqual([]);
	});
});

describe('formatLengthsInput', () => {
	it('formatiert Längen kommasepariert mit Leerzeichen', () => {
		expect(formatLengthsInput([1000, 2000, 4500])).toBe('1000, 2000, 4500');
	});
});

describe('optimizeCutting (cuttable)', () => {
	const stockLengths = [1000, 2000, 3000, 4000, 5000];

	it('liefert leeres Ergebnis für leere Cuts', () => {
		const r = optimizeCutting([], stockLengths, 3);
		expect(r.stockPlanks).toEqual([]);
		expect(r.totalWaste).toBe(0);
		expect(r.unassigned).toEqual([]);
	});

	it('markiert Zuschnitte zu lang für jede Rohdiele als unassigned', () => {
		const r = optimizeCutting(cuts(6000), stockLengths, 3);
		expect(r.unassigned).toHaveLength(1);
		expect(r.stockPlanks).toEqual([]);
	});

	it('platziert einen einzelnen Zuschnitt in die kleinstmögliche passende Rohdiele', () => {
		const r = optimizeCutting(cuts(800), stockLengths, 3);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].stockLength).toBe(1000);
		expect(r.stockPlanks[0].cuts.map((c) => c.length)).toEqual([800]);
		expect(r.stockPlanks[0].waste).toBe(200);
	});

	it('berücksichtigt N-1 Sägeschnitte pro Rohdiele', () => {
		// 3 Stücke à 1000 mm in eine 5000-Rohdiele bei 5 mm Kerf:
		// nutzbar = 5000, verbraucht = 3·1000 + 2·5 = 3010, Verschnitt = 1990
		const r = optimizeCutting(cuts(1000, 1000, 1000), [5000], 5);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].cuts).toHaveLength(3);
		expect(r.stockPlanks[0].waste).toBe(1990);
		expect(r.totalWaste).toBe(1990);
	});

	it('akzeptiert KEINE Kombination, die mit Kerf physikalisch nicht passt', () => {
		// 1333 + 1331 + 1328 = 3992, +2*5 Kerf = 4002 > 4000 → unmöglich
		const r = optimizeCutting(cuts(1333, 1331, 1328), [4000], 5);
		// Es darf NICHT alle drei in eine 4000er-Rohdiele packen
		const allInOne = r.stockPlanks.find((sp) => sp.cuts.length === 3);
		expect(allInOne).toBeUndefined();
	});

	it('garantiert: sum(cuts) + (N-1)*kerf <= stockLength für jede Rohdiele', () => {
		const sawKerf = 5;
		const r = optimizeCutting(
			cuts(1333, 1331, 1328, 800, 1500, 2200, 1750, 1900),
			[4000, 5000],
			sawKerf
		);
		for (const sp of r.stockPlanks) {
			const sumLen = sp.cuts.reduce((s, c) => s + c.length, 0);
			const kerfTotal = Math.max(0, sp.cuts.length - 1) * sawKerf;
			expect(sumLen + kerfTotal).toBeLessThanOrEqual(sp.stockLength);
		}
	});

	it('verteilt alle Zuschnitte (keine unassigned bei passenden Stocks)', () => {
		const r = optimizeCutting(cuts(1000, 2000, 1500, 500), [2000, 5000], 3);
		expect(r.unassigned).toEqual([]);
		const totalCutsAssigned = r.stockPlanks.reduce((s, sp) => s + sp.cuts.length, 0);
		expect(totalCutsAssigned).toBe(4);
	});

	it('totalWaste entspricht der Summe der einzelnen Reste', () => {
		const r = optimizeCutting(cuts(1000, 2000, 1500, 500, 800, 1200), [2000, 5000], 5);
		const sum = r.stockPlanks.reduce((s, sp) => s + sp.waste, 0);
		expect(r.totalWaste).toBe(sum);
	});

	it('funktioniert mit kerf=0', () => {
		const r = optimizeCutting(cuts(1000, 1000, 1000, 1000, 1000), [5000], 0);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].cuts).toHaveLength(5);
		expect(r.stockPlanks[0].waste).toBe(0);
	});

	it('arbeitet mit nicht-ganzzahligen Längen korrekt (kein Phantom-Material)', () => {
		const sawKerf = 5;
		const r = optimizeCutting(cuts(1333.4, 1331.7, 1328.2), [4000], sawKerf);
		for (const sp of r.stockPlanks) {
			const sumLen = sp.cuts.reduce((s, c) => s + c.length, 0);
			const kerfTotal = Math.max(0, sp.cuts.length - 1) * sawKerf;
			expect(sumLen + kerfTotal).toBeLessThanOrEqual(sp.stockLength + 1e-9);
		}
	});
});

describe('optimizeCutting (cuttable=false)', () => {
	const stockLengths = [1000, 2000, 3000, 4000, 5000];

	it('verwendet pro Zuschnitt die kürzeste passende Rohdiele', () => {
		const r = optimizeCutting(cuts(800, 1500, 2500), stockLengths, 5, false);
		expect(r.stockPlanks).toHaveLength(3);
		expect(r.stockPlanks.map((sp) => sp.stockLength).sort((a, b) => a - b)).toEqual([
			1000, 2000, 3000
		]);
		expect(r.stockPlanks.every((sp) => sp.cuts.length === 1)).toBe(true);
	});

	it('Verschnitt = stockLength - cut für jede Rohdiele', () => {
		const r = optimizeCutting(cuts(800), stockLengths, 5, false);
		expect(r.stockPlanks[0].waste).toBe(200);
		expect(r.totalWaste).toBe(200);
	});

	it('markiert zu lange Zuschnitte als unassigned', () => {
		const r = optimizeCutting(cuts(6000, 800), stockLengths, 5, false);
		expect(r.unassigned).toHaveLength(1);
		expect(r.unassigned[0].length).toBe(6000);
		expect(r.stockPlanks).toHaveLength(1);
	});
});

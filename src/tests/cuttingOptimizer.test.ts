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
		expect(r.totalSawKerfWaste).toBe(0);
		expect(r.totalRemainder).toBe(0);
		expect(r.totalWaste).toBe(0);
		expect(r.unassigned).toEqual([]);
	});

	it('markiert Zuschnitte zu lang für jede Rohdiele als unassigned', () => {
		const r = optimizeCutting(cuts(6000), stockLengths, 3);
		expect(r.unassigned).toHaveLength(1);
		expect(r.stockPlanks).toEqual([]);
	});

	it('platziert einen einzelnen Zuschnitt in die kleinstmögliche passende Rohdiele', () => {
		// 800 in 1000 mit kerf=3: rawRem=200 >= kerf=3 → Trim-Schnitt: kerf=3, remainder=197
		const r = optimizeCutting(cuts(800), stockLengths, 3);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].stockLength).toBe(1000);
		expect(r.stockPlanks[0].cuts.map((c) => c.length)).toEqual([800]);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(3);
		expect(r.stockPlanks[0].remainder).toBe(197);
		expect(r.stockPlanks[0].waste).toBe(200);
	});

	it('Beispiel: 500+450 in 1000 (kerf=4) → Verschnitt 8, Abschnitt 42', () => {
		const r = optimizeCutting(cuts(500, 450), [1000], 4);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(8);
		expect(r.stockPlanks[0].remainder).toBe(42);
		expect(r.stockPlanks[0].waste).toBe(50);
	});

	it('Beispiel: 500+495 in 1000 (kerf=4) → Verschnitt 5, kein Abschnitt (absorbiert)', () => {
		const r = optimizeCutting(cuts(500, 495), [1000], 4);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(5);
		expect(r.stockPlanks[0].remainder).toBe(0);
		expect(r.stockPlanks[0].waste).toBe(5);
	});

	it('Beispiel: 1000+500+490 in 2000 (kerf=4) → Verschnitt 10, kein Abschnitt', () => {
		const r = optimizeCutting(cuts(1000, 500, 490), [2000], 4);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(10);
		expect(r.stockPlanks[0].remainder).toBe(0);
		expect(r.stockPlanks[0].waste).toBe(10);
	});

	it('berücksichtigt N-1 Sägeschnitte + Trim-Schnitt pro Rohdiele', () => {
		// 3×1000 in 5000 (kerf=5): baseKerf=10, rawRem=1990 >= kerf=5 → Trim-Schnitt: kerf=15, rem=1985
		const r = optimizeCutting(cuts(1000, 1000, 1000), [5000], 5);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].cuts).toHaveLength(3);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(15);
		expect(r.stockPlanks[0].remainder).toBe(1985);
		expect(r.stockPlanks[0].waste).toBe(2000);
		expect(r.totalSawKerfWaste).toBe(15);
		expect(r.totalRemainder).toBe(1985);
		expect(r.totalWaste).toBe(2000);
	});

	it('akzeptiert KEINE Kombination, die mit Kerf physikalisch nicht passt', () => {
		// 1333 + 1331 + 1328 = 3992, +2*5 Kerf = 4002 > 4000 → unmöglich
		const r = optimizeCutting(cuts(1333, 1331, 1328), [4000], 5);
		// Es darf NICHT alle drei in eine 4000er-Rohdiele packen
		const allInOne = r.stockPlanks.find((sp) => sp.cuts.length === 3);
		expect(allInOne).toBeUndefined();
	});

	it('garantiert: sum(cuts) + sawKerfWaste + remainder = stockLength für jede Rohdiele', () => {
		const sawKerf = 5;
		const r = optimizeCutting(
			cuts(1333, 1331, 1328, 800, 1500, 2200, 1750, 1900),
			[4000, 5000],
			sawKerf
		);
		for (const sp of r.stockPlanks) {
			const sumLen = sp.cuts.reduce((s, c) => s + c.length, 0);
			expect(sumLen + sp.sawKerfWaste + sp.remainder).toBe(sp.stockLength);
			expect(sp.waste).toBe(sp.sawKerfWaste + sp.remainder);
		}
	});

	it('verteilt alle Zuschnitte (keine unassigned bei passenden Stocks)', () => {
		const r = optimizeCutting(cuts(1000, 2000, 1500, 500), [2000, 5000], 3);
		expect(r.unassigned).toEqual([]);
		const totalCutsAssigned = r.stockPlanks.reduce((s, sp) => s + sp.cuts.length, 0);
		expect(totalCutsAssigned).toBe(4);
	});

	it('totalWaste/totalSawKerfWaste/totalRemainder sind Summen der einzelnen Werte', () => {
		const r = optimizeCutting(cuts(1000, 2000, 1500, 500, 800, 1200), [2000, 5000], 5);
		const sumK = r.stockPlanks.reduce((s, sp) => s + sp.sawKerfWaste, 0);
		const sumR = r.stockPlanks.reduce((s, sp) => s + sp.remainder, 0);
		const sumW = r.stockPlanks.reduce((s, sp) => s + sp.waste, 0);
		expect(r.totalSawKerfWaste).toBe(sumK);
		expect(r.totalRemainder).toBe(sumR);
		expect(r.totalWaste).toBe(sumW);
	});

	it('funktioniert mit kerf=0', () => {
		const r = optimizeCutting(cuts(1000, 1000, 1000, 1000, 1000), [5000], 0);
		expect(r.stockPlanks).toHaveLength(1);
		expect(r.stockPlanks[0].cuts).toHaveLength(5);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(0);
		expect(r.stockPlanks[0].remainder).toBe(0);
		expect(r.stockPlanks[0].waste).toBe(0);
	});

	it('arbeitet mit nicht-ganzzahligen Längen korrekt (kein Phantom-Material)', () => {
		const sawKerf = 5;
		const r = optimizeCutting(cuts(1333.4, 1331.7, 1328.2), [4000], sawKerf);
		for (const sp of r.stockPlanks) {
			const sumLen = sp.cuts.reduce((s, c) => s + c.length, 0);
			expect(sumLen + sp.sawKerfWaste + sp.remainder).toBeLessThanOrEqual(sp.stockLength + 1e-9);
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

	it('Verschnitt = stockLength - cut für jede Rohdiele (nur Abschnitt, kein Sägeschnitt)', () => {
		const r = optimizeCutting(cuts(800), stockLengths, 5, false);
		expect(r.stockPlanks[0].sawKerfWaste).toBe(0);
		expect(r.stockPlanks[0].remainder).toBe(200);
		expect(r.stockPlanks[0].waste).toBe(200);
		expect(r.totalSawKerfWaste).toBe(0);
		expect(r.totalRemainder).toBe(200);
		expect(r.totalWaste).toBe(200);
	});

	it('markiert zu lange Zuschnitte als unassigned', () => {
		const r = optimizeCutting(cuts(6000, 800), stockLengths, 5, false);
		expect(r.unassigned).toHaveLength(1);
		expect(r.unassigned[0].length).toBe(6000);
		expect(r.stockPlanks).toHaveLength(1);
	});
});

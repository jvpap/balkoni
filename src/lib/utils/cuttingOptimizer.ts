/**
 * Zuschnitt-Optimierung (1D Cutting Stock Problem)
 *
 * Ermittelt mit einem First-Fit-Decreasing-Algorithmus, wie viele Rohdielen
 * (aus vordefinierten Standardlängen) benötigt werden, um alle Zuschnitte
 * mit minimalem Verschnitt herzustellen.
 */

export interface Cut {
	/** Index der Diele in generatedPlanks (für Referenz/Anzeige) */
	plankIndex: number;
	/** Länge des Zuschnitts in mm */
	length: number;
}

export interface StockPlank {
	/** Standardlänge der Rohdiele in mm */
	stockLength: number;
	/** Zuschnitte, die aus dieser Rohdiele entstehen */
	cuts: Cut[];
	/** Verschnitt durch Sägeschnitte in mm (inkl. ggf. absorbierter kleiner Reste) */
	sawKerfWaste: number;
	/** Abschnitt: nutzbares Reststück nach optionalem Trim-Schnitt */
	remainder: number;
	/** Gesamtverlust = sawKerfWaste + remainder (nicht in Zuschnitten enthaltenes Material) */
	waste: number;
}

export interface CuttingResult {
	/** Alle verwendeten Rohdielen mit ihren Zuschnitten */
	stockPlanks: StockPlank[];
	/** Gesamter Sägeschnitt-Verschnitt in mm */
	totalSawKerfWaste: number;
	/** Gesamter Abschnitt in mm */
	totalRemainder: number;
	/** Gesamtverlust in mm (= totalSawKerfWaste + totalRemainder) */
	totalWaste: number;
	/** Zuschnitte, die nicht eingeplant werden konnten (zu lang für alle Standardlängen) */
	unassigned: Cut[];
}

/**
 * Splittet den Gesamtverschnitt einer Rohdiele in Sägeschnitt-Verschnitt und Abschnitt.
 *
 * Logik (gemäß Beispielen):
 * - Zwischen N Stücken werden (N-1) Schnitte gemacht → baseKerf = (N-1)·sawKerf
 * - rawRem = stockLength - Σlengths - baseKerf
 * - rawRem == 0:                kerf = baseKerf,            remainder = 0
 * - 0 < rawRem < sawKerf:       kerf = baseKerf + rawRem,   remainder = 0    (zu klein für Trim-Schnitt → absorbiert)
 * - rawRem >= sawKerf:          kerf = baseKerf + sawKerf,  remainder = rawRem - sawKerf  (Trim-Schnitt vom Rest)
 *
 * Bei einem einzelnen Stück (N=1) gibt es keinen Zwischenschnitt; ein evtl. nötiger
 * Trim-Schnitt wird wie oben behandelt.
 */
function splitWaste(
	stockLength: number,
	cuts: Cut[],
	sawKerf: number
): { sawKerfWaste: number; remainder: number } {
	if (cuts.length === 0) return { sawKerfWaste: 0, remainder: stockLength };

	const sumLengths = cuts.reduce((s, c) => s + c.length, 0);
	const baseKerf = Math.max(0, cuts.length - 1) * sawKerf;
	const rawRem = Math.max(0, stockLength - sumLengths - baseKerf);

	if (rawRem === 0) return { sawKerfWaste: baseKerf, remainder: 0 };
	if (rawRem < sawKerf) return { sawKerfWaste: baseKerf + rawRem, remainder: 0 };
	return { sawKerfWaste: baseKerf + sawKerf, remainder: rawRem - sawKerf };
}

/**
 * Findet mittels Subset-Sum-DP die Teilmenge der verfügbaren Zuschnitte, die in
 * eine Rohdiele der Länge `stockLength` passt und den Rest minimiert.
 *
 * Bei N gewählten Stücken sind N-1 Sägeschnitte nötig (zwischen den Stücken);
 * der Reststummel am Ende benötigt keinen weiteren Schnitt.
 *
 * @returns Indizes der gewählten Cuts (bezogen auf `available`) und der Verschnitt.
 */
function fillStockOptimal(
	stockLength: number,
	available: Cut[],
	sawKerf: number
): { selectedIdx: number[]; waste: number } {
	// In der DP geben wir jedem Stück die "Kosten" length + sawKerf und erweitern
	// die Kapazität um einen sawKerf, damit das letzte Stück seinen mitgezählten
	// Kerf "zurückbekommt" - effektiv werden so nur N-1 Schnitte berücksichtigt.
	const n = available.length;
	const capacity = Math.floor(stockLength + sawKerf);

	// DP: reachable[c] = true, wenn Summe c (aus effektiven Kosten) erreichbar
	// parent[c] = letzter verwendeter Cut-Index, über den c erreicht wurde
	const reachable = new Uint8Array(capacity + 1);
	const parent = new Int32Array(capacity + 1).fill(-1);
	const prevSum = new Int32Array(capacity + 1).fill(-1);
	reachable[0] = 1;

	for (let i = 0; i < n; i++) {
		// Konservativ aufrunden: nicht-ganzzahlige Längen würden sonst pro Stück
		// bis zu 1 mm "verschwinden" lassen und die DP würde nicht passende
		// Kombinationen akzeptieren.
		const w = Math.ceil(available[i].length + sawKerf);
		if (w <= 0 || w > capacity) continue;
		// Rückwärts, damit jeder Cut nur einmal verwendet wird
		for (let c = capacity; c >= w; c--) {
			if (!reachable[c] && reachable[c - w]) {
				reachable[c] = 1;
				parent[c] = i;
				prevSum[c] = c - w;
			}
		}
	}

	// Finde die Kombination mit minimaler totalWaste (sawKerfWaste + remainder)
	let bestTotalWaste = Infinity;
	let bestSelectedIdx: number[] = [];

	for (let c = capacity; c >= 0; c--) {
		if (!reachable[c]) continue;

		// Rekonstruiere die gewählten Cuts für dieses c
		const selectedIdx: number[] = [];
		let tempC = c;
		while (tempC > 0 && parent[tempC] !== -1) {
			selectedIdx.push(parent[tempC]);
			tempC = prevSum[tempC];
		}

		if (selectedIdx.length === 0) continue;

		// Berechne den tatsächlichen totalWaste mit splitWaste
		const selectedCuts = selectedIdx.map((i) => available[i]);
		const { sawKerfWaste, remainder } = splitWaste(stockLength, selectedCuts, sawKerf);
		const totalWaste = sawKerfWaste + remainder;

		if (totalWaste < bestTotalWaste) {
			bestTotalWaste = totalWaste;
			bestSelectedIdx = selectedIdx;
		}
	}

	return { selectedIdx: bestSelectedIdx, waste: bestTotalWaste };
}

/** Optionen für eine einzelne Bin-Wahl (Subset-Sum-Ergebnis) */
type BinOption = {
	stockLength: number;
	selectedIdx: number[];
	waste: number;
};

/** Selector entscheidet, welche der Optionen als nächste Rohdiele gewählt wird */
type BinSelector = (options: BinOption[]) => BinOption;

/** Selector-Strategien (Heuristiken) */
const selectors: { name: string; fn: BinSelector }[] = [
	// 1) Minimaler absoluter Verschnitt (bisherige Standardstrategie)
	{
		name: 'min-absolute-waste',
		fn: (opts) => opts.reduce((best, o) => (o.waste < best.waste ? o : best))
	},
	// 2) Minimaler relativer Verschnitt (waste / stockLength)
	{
		name: 'min-relative-waste',
		fn: (opts) =>
			opts.reduce((best, o) => (o.waste / o.stockLength < best.waste / best.stockLength ? o : best))
	},
	// 3) Möglichst viele Zuschnitte pro Rohdiele unterbringen
	{
		name: 'max-cut-count',
		fn: (opts) =>
			opts.reduce((best, o) => {
				if (o.selectedIdx.length !== best.selectedIdx.length) {
					return o.selectedIdx.length > best.selectedIdx.length ? o : best;
				}
				return o.waste < best.waste ? o : best;
			})
	},
	// 4) Größte Rohdiele bevorzugen (bei gleichem Verschnitt)
	{
		name: 'prefer-largest-stock',
		fn: (opts) =>
			opts.reduce((best, o) => {
				if (o.waste !== best.waste) return o.waste < best.waste ? o : best;
				return o.stockLength > best.stockLength ? o : best;
			})
	},
	// 5) Kleinste Rohdiele bevorzugen (bei gleichem Verschnitt)
	{
		name: 'prefer-smallest-stock',
		fn: (opts) =>
			opts.reduce((best, o) => {
				if (o.waste !== best.waste) return o.waste < best.waste ? o : best;
				return o.stockLength < best.stockLength ? o : best;
			})
	}
];

/** Anzahl zusätzlicher Random-Restart-Durchläufe (mit gemischter Cut-Reihenfolge) */
const RANDOM_RESTARTS = 10;

/**
 * Führt einen Greedy-Durchlauf mit dem angegebenen Selector durch.
 */
function runGreedy(
	cutsRemaining: Cut[],
	stockLengths: number[],
	sawKerf: number,
	selector: BinSelector
): CuttingResult {
	const result: CuttingResult = {
		stockPlanks: [],
		totalSawKerfWaste: 0,
		totalRemainder: 0,
		totalWaste: 0,
		unassigned: []
	};
	let remaining = [...cutsRemaining];

	while (remaining.length > 0) {
		const options: BinOption[] = [];
		for (const stockLength of stockLengths) {
			const { selectedIdx, waste } = fillStockOptimal(stockLength, remaining, sawKerf);
			if (selectedIdx.length === 0) continue;
			options.push({ stockLength, selectedIdx, waste });
		}

		if (options.length === 0) {
			result.unassigned.push(...remaining);
			break;
		}

		const chosen = selector(options);
		const chosenSet = new Set(chosen.selectedIdx);
		const chosenCuts = chosen.selectedIdx
			.map((i) => remaining[i])
			.sort((a, b) => b.length - a.length);

		// Detaillierter Split: Sägeschnitt-Verschnitt vs. Abschnitt
		const { sawKerfWaste, remainder } = splitWaste(chosen.stockLength, chosenCuts, sawKerf);
		const totalForPlank = sawKerfWaste + remainder;

		result.stockPlanks.push({
			stockLength: chosen.stockLength,
			cuts: chosenCuts,
			sawKerfWaste,
			remainder,
			waste: totalForPlank
		});
		result.totalSawKerfWaste += sawKerfWaste;
		result.totalRemainder += remainder;
		result.totalWaste += totalForPlank;

		remaining = remaining.filter((_, i) => !chosenSet.has(i));
	}

	return result;
}

/** Vergleicht zwei Ergebnisse: weniger Verschnitt, dann weniger Rohdielen, dann weniger Unzugeordnete */
function isBetter(a: CuttingResult, b: CuttingResult): boolean {
	if (a.unassigned.length !== b.unassigned.length) {
		return a.unassigned.length < b.unassigned.length;
	}
	if (a.totalWaste !== b.totalWaste) return a.totalWaste < b.totalWaste;
	return a.stockPlanks.length < b.stockPlanks.length;
}

/** Mische Array (Fisher-Yates), nutzt deterministische PRNG für reproduzierbare Ergebnisse */
function shuffle<T>(arr: T[], seed: number): T[] {
	const a = [...arr];
	let s = seed;
	const rand = () => {
		// Mulberry32 PRNG
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/**
 * Multi-Strategy Cutting-Stock-Optimierung.
 *
 * Führt mehrere Heuristiken parallel aus und gibt die beste Lösung zurück:
 *  1. 5 deterministische Selector-Strategien (min absoluter/relativer Verschnitt,
 *     max Zuschnitte, größte/kleinste Rohdiele zuerst)
 *  2. N Random-Restarts mit gemischter Cut-Reihenfolge (Standardselector)
 *
 * @param cuts Benötigte Zuschnitte (Länge jeder Diele)
 * @param stockLengths Verfügbare Standardlängen (in mm)
 * @param sawKerf Sägeschnitt-Breite in mm (wird pro Schnitt abgezogen)
 * @param cuttable Wenn false, wird pro Zuschnitt eine eigene Rohdiele verwendet
 */
export function optimizeCutting(
	cuts: Cut[],
	stockLengths: number[],
	sawKerf: number,
	cuttable: boolean = true
): CuttingResult {
	const empty: CuttingResult = {
		stockPlanks: [],
		totalSawKerfWaste: 0,
		totalRemainder: 0,
		totalWaste: 0,
		unassigned: []
	};

	if (cuts.length === 0 || stockLengths.length === 0) return empty;

	const maxStock = Math.max(...stockLengths);

	// Zuschnitte, die in keine Standardlänge passen, vorab als unassigned markieren
	const baseUnassigned: Cut[] = [];
	const fittable: Cut[] = [];
	for (const cut of cuts) {
		if (cut.length > maxStock) baseUnassigned.push(cut);
		else fittable.push(cut);
	}

	// Nicht-zuschneidbar: pro Zuschnitt die kürzeste passende Rohdiele verwenden
	if (!cuttable) {
		const result: CuttingResult = {
			stockPlanks: [],
			totalSawKerfWaste: 0,
			totalRemainder: 0,
			totalWaste: 0,
			unassigned: [...baseUnassigned]
		};
		const sortedStock = [...stockLengths].sort((a, b) => a - b);
		for (const cut of fittable) {
			const stockToUse = sortedStock.find((s) => s >= cut.length);
			if (stockToUse === undefined) {
				result.unassigned.push(cut);
				continue;
			}
			// Bei nicht-zuschneidbar: kein Sägeschnitt, nur Abschnitt
			const remainder = Math.max(0, stockToUse - cut.length);
			result.stockPlanks.push({
				stockLength: stockToUse,
				cuts: [cut],
				sawKerfWaste: 0,
				remainder,
				waste: remainder
			});
			result.totalRemainder += remainder;
			result.totalWaste += remainder;
		}
		return result;
	}

	// Multi-Strategy: alle deterministischen Selector ausprobieren
	let best: CuttingResult | null = null;
	const strategyLog: {
		strategy: string;
		waste: number;
		stockPlanks: number;
		unassigned: number;
	}[] = [];
	for (const { name, fn } of selectors) {
		const r = runGreedy(fittable, stockLengths, sawKerf, fn);
		r.unassigned.unshift(...baseUnassigned);
		strategyLog.push({
			strategy: name,
			waste: Math.round(r.totalWaste),
			stockPlanks: r.stockPlanks.length,
			unassigned: r.unassigned.length
		});
		if (best === null || isBetter(r, best)) best = r;
	}
	if (typeof console !== 'undefined') {
		console.table(strategyLog);
	}

	// Zusätzlich: Random-Restarts mit gemischter Cut-Reihenfolge (deterministisch via Seed)
	const baseSelector = selectors[0].fn;
	for (let i = 0; i < RANDOM_RESTARTS; i++) {
		const shuffled = shuffle(fittable, i + 1);
		const r = runGreedy(shuffled, stockLengths, sawKerf, baseSelector);
		r.unassigned.unshift(...baseUnassigned);
		if (best === null || isBetter(r, best)) best = r;
	}

	return best ?? empty;
}

/**
 * Parst einen kommaseparierten String mit Längen (in mm) zu einem Number-Array.
 * Leere/ungültige Werte werden gefiltert.
 */
export function parseLengthsInput(input: string): number[] {
	return input
		.split(',')
		.map((s) => parseInt(s.trim(), 10))
		.filter((n) => !isNaN(n) && n > 0);
}

/**
 * Formatiert Längen-Array zu kommasepariertem String.
 */
export function formatLengthsInput(lengths: number[]): string {
	return lengths.join(', ');
}

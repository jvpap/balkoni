<script lang="ts">
	import { planStore } from '$lib/stores/planStore';
	import {
		optimizeCutting,
		parseLengthsInput,
		formatLengthsInput,
		type Cut
	} from '$lib/utils/cuttingOptimizer';

	// Editierbarer Text für Standardlängen (kommasepariert)
	let lengthsInput = formatLengthsInput($planStore.plankLengths);

	// Bei Änderungen im Store (z.B. anderer Tab) den Input aktualisieren
	$: if ($planStore.plankLengths && lengthsInput === '') {
		lengthsInput = formatLengthsInput($planStore.plankLengths);
	}

	function updateLengths() {
		const parsed = parseLengthsInput(lengthsInput);
		planStore.setPlankLengths(parsed);
		lengthsInput = formatLengthsInput(parsed);
	}

	function updateKerf(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		planStore.setSawKerf(isNaN(val) ? 0 : val);
	}

	// Automatisch neu berechnen bei Änderungen an Zuschnitten oder Parametern
	$: result = (() => {
		const cuts: Cut[] = $planStore.generatedPlanks.map((plank, i) => ({
			plankIndex: i,
			length: plank.length
		}));
		return optimizeCutting(cuts, $planStore.plankLengths, $planStore.sawKerf, $planStore.cuttable);
	})();

	// Gruppierung nach Rohdielen-Länge für Bestell-Zusammenfassung
	$: orderSummary = (() => {
		if (!result) return [] as { stockLength: number; count: number }[];
		const counts = new Map<number, number>();
		for (const plank of result.stockPlanks) {
			counts.set(plank.stockLength, (counts.get(plank.stockLength) ?? 0) + 1);
		}
		return [...counts.entries()]
			.map(([stockLength, count]) => ({ stockLength, count }))
			.sort((a, b) => b.stockLength - a.stockLength);
	})();

	// Gruppierung nach identischem Schnittmuster (gleiche Rohdielen-Länge + gleiche Zuschnitt-Längen)
	$: cutGroups = (() => {
		if (!result)
			return [] as {
				stockLength: number;
				cutLengths: number[]; // gerundet, absteigend sortiert
				sawKerfWaste: number;
				remainder: number;
				waste: number;
				count: number;
			}[];
		const groups = new Map<
			string,
			{
				stockLength: number;
				cutLengths: number[];
				sawKerfWaste: number;
				remainder: number;
				waste: number;
				count: number;
			}
		>();
		for (const plank of result.stockPlanks) {
			const lengths = plank.cuts.map((c) => Math.round(c.length)).sort((a, b) => b - a);
			const key = `${plank.stockLength}|${lengths.join(',')}`;
			const existing = groups.get(key);
			if (existing) {
				existing.count += 1;
			} else {
				groups.set(key, {
					stockLength: plank.stockLength,
					cutLengths: lengths,
					sawKerfWaste: Math.round(plank.sawKerfWaste),
					remainder: Math.round(plank.remainder),
					waste: Math.round(plank.waste),
					count: 1
				});
			}
		}
		return [...groups.values()].sort((a, b) => {
			// Absteigend nach Rohdielen-Länge, dann nach Anzahl
			if (b.stockLength !== a.stockLength) return b.stockLength - a.stockLength;
			return b.count - a.count;
		});
	})();
</script>

<div class="h-full p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
	<h2 class="mt-0 mb-3 text-base text-gray-700 font-medium">Zuschnitt-Optimierung</h2>

	<div class="my-3">
		<label for="stock-lengths" class="block text-xs text-gray-600 font-medium mb-1">
			Verfügbare Dielen-Längen (mm, kommasepariert):
		</label>
		<input
			id="stock-lengths"
			type="text"
			bind:value={lengthsInput}
			on:change={updateLengths}
			on:blur={updateLengths}
			placeholder="z.B. 2000, 3000, 4500"
			class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono"
		/>
	</div>

	<div class="my-3">
		<label class="flex items-center gap-2 text-sm cursor-pointer">
			<input
				type="checkbox"
				checked={$planStore.cuttable}
				on:change={(e) => planStore.setCuttable((e.target as HTMLInputElement).checked)}
				class="cursor-pointer"
			/>
			kann zugeschnitten werden
		</label>
	</div>

	{#if $planStore.cuttable}
		<div class="my-3">
			<label for="saw-kerf" class="flex items-center gap-2.5 text-sm">
				Sägeschnitt-Breite (mm):
				<input
					id="saw-kerf"
					type="number"
					value={$planStore.sawKerf}
					on:change={updateKerf}
					on:blur={updateKerf}
					min="0"
					max="20"
					class="w-20 px-1.5 py-1.5 border border-gray-300 rounded text-sm"
				/>
			</label>
		</div>
	{/if}

	{#if result && result.stockPlanks.length > 0}
		<div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 flex-1 min-h-0 flex flex-col">
			<p class="my-1.5 text-sm font-semibold text-gray-700">
				Bestellung ({result.stockPlanks.length} Rohdielen):
			</p>
			<ul class="my-1.5 ml-4 text-sm text-gray-700 list-disc">
				{#each orderSummary as item}
					<li><strong>{item.count}×</strong> {item.stockLength} mm</li>
				{/each}
			</ul>
			<p class="my-1.5 text-sm text-gray-700">
				Gesamtverschnitt: <strong>{Math.round(result.totalWaste)} mm</strong>
				(Säge: {Math.round(result.totalSawKerfWaste)} mm, Abschnitt: {Math.round(result.totalRemainder)} mm)
			</p>

			{#if result.unassigned.length > 0}
				<p class="my-1.5 text-sm text-red-600 font-semibold">
					⚠ {result.unassigned.length} Zuschnitt(e) zu lang für alle Standardlängen!
				</p>
			{/if}

			<div class="flex-1 min-h-0 overflow-y-auto my-2">
				<table class="w-full text-xs">
					<thead class="text-xs text-gray-500 border-b border-blue-200">
						<tr>
							<th class="text-left py-1">Anz.</th>
							<th class="text-left py-1">Rohdiele</th>
							<th class="text-left py-1">Zuschnitte</th>
							<th class="text-right py-1">Verschnitt</th>
							<th class="text-right py-1">Abschnitt</th>
						</tr>
					</thead>
					<tbody>
						{#each cutGroups as group}
							<tr class="border-b border-blue-100 last:border-b-0 align-top">
								<td class="py-1 pr-1 font-medium">{group.count}×</td>
								<td class="py-1 pr-1 font-medium">{group.stockLength} mm</td>
								<td class="py-1 pr-1">
									{#each group.cutLengths as len, j}
										<span class="inline-block whitespace-nowrap">
											{len} mm{#if j < group.cutLengths.length - 1}<span class="text-gray-400"
													>,
												</span>{/if}
										</span>
									{/each}
								</td>
								<td class="text-right py-1 text-gray-600">{group.sawKerfWaste} mm</td>
								<td class="text-right py-1 text-gray-600">{group.remainder} mm</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

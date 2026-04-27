<script lang="ts">
	import { planStore } from '$lib/stores/planStore';
	import { calculateJoints } from '$lib/utils/plankCalculator';

	// Gruppiere generierte Dielen nach exakter Länge in mm
	$: planksByLength = $planStore.generatedPlanks.reduce(
		(acc, plank) => {
			const lengthMm = Math.round(plank.length); // mm, gerundet
			acc[lengthMm] = (acc[lengthMm] || 0) + 1;
			return acc;
		},
		{} as Record<number, number>
	);

	$: sortedLengths = Object.entries(planksByLength)
		.map(([length, count]) => ({ length: parseInt(length), count }))
		.sort((a, b) => a.length - b.length);

	$: totalGeneratedPlanks = $planStore.generatedPlanks.length;

	// Gesamtlänge aller Dielen in mm
	$: totalLengthMm = $planStore.generatedPlanks.reduce((sum, plank) => sum + plank.length, 0);

	// Fugenband zwischen benachbarten Dielen (nur wo Polygon überdeckt wird)
	$: jointBandMm = calculateJoints(
		$planStore.generatedPlanks,
		$planStore.polygonPoints
	).totalLength;
</script>

<div class="h-full p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
	<h2 class="mt-0 mb-2 text-base text-gray-700 font-medium">Bestellung</h2>

	{#if totalGeneratedPlanks > 0}
		<div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 flex-1 min-h-0 flex flex-col">
			<p class="my-1.5 text-sm font-semibold text-gray-700">Benötigte Dielen:</p>
			<div class="flex-1 min-h-0 overflow-y-auto my-2">
				<table class="w-full text-sm">
					<thead class="text-xs text-gray-500 border-b border-blue-200">
						<tr>
							<th class="text-left py-1">Länge</th>
							<th class="text-right py-1">Anzahl</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedLengths as { length, count }}
							<tr class="border-b border-blue-100 last:border-b-0">
								<td class="py-1">{length} mm</td>
								<td class="text-right py-1 font-medium">{count}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="border-t border-blue-300 font-semibold">
						<tr>
							<td class="py-1">Anzahl:</td>
							<td class="text-right py-1">{totalGeneratedPlanks}</td>
						</tr>
						<tr>
							<td class="py-1">Gesamtlänge:</td>
							<td class="text-right py-1">{Math.round(totalLengthMm)} mm</td>
						</tr>
						<tr>
							<td class="py-1">Fugenband:</td>
							<td class="text-right py-1">{Math.round(jointBandMm)} mm</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	{/if}
</div>

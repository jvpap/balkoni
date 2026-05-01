<script lang="ts">
	import { planStore } from '$lib/stores/planStore';
	import { generatePlanksForPolygon } from '$lib/utils/plankCalculator';

	function verlegen() {
		// Aktuelle Breite explizit speichern und Dielen generieren
		const currentWidth = $planStore.plankWidth;
		const planks = generatePlanksForPolygon(
			$planStore.polygonPoints,
			currentWidth,
			$planStore.startFrom
		);
		planStore.generatePlanks(planks, currentWidth);
	}

	function leeren() {
		planStore.clearGeneratedPlanks();
	}

	function selectPlank(index: number) {
		planStore.selectPlank(index);
	}
</script>

<div class="h-full p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
	<h2 class="mt-0 mb-3 text-base text-gray-700 font-medium">Dielen-Einstellungen</h2>

	<div class="my-3">
		<label class="flex items-center gap-2.5 text-sm">
			Breite (mm):
			<input
				type="number"
				value={$planStore.plankWidth}
				min="10"
				max="500"
				title="Plankenbreite in Millimetern (10-500)"
				on:change={(e) => planStore.setPlankWidth(parseInt(e.currentTarget.value) || 140)}
				class="w-20 px-1.5 py-1.5 border border-gray-300 rounded text-sm"
			/>
		</label>
	</div>

	<div class="my-3">
		<div class="flex items-center gap-4">
			<span class="text-sm text-gray-700">Verlegen von:</span>
				<label class="flex items-center gap-1.5 text-sm cursor-pointer">
				<input
					type="radio"
					name="startFrom"
					value="left"
					checked={$planStore.startFrom === 'left'}
					on:change={() => planStore.setStartFrom('left')}
					class="w-auto m-0"
					title="Dielen von links nach rechts verlegen"
				/>
				Links ⇒
			</label>
			<label class="flex items-center gap-1.5 text-sm cursor-pointer">
				<input
					type="radio"
					name="startFrom"
					value="right"
					checked={$planStore.startFrom === 'right'}
					on:change={() => planStore.setStartFrom('right')}
					class="w-auto m-0"
					title="Dielen von rechts nach links verlegen"
				/>
				⇐ Rechts
			</label>
		</div>
		<div class="mt-2">
			<label class="flex items-center gap-2 text-sm cursor-pointer">
			<input
				type="checkbox"
				checked={$planStore.withJointBand}
				on:change={() => planStore.toggleJointBand()}
				class="w-auto m-0"
				title="Fugenband zwischen Dielen berechnen und anzeigen"
			/>
			mit Fugenband
		</label>
		</div>
		<div class="mt-2">
			<label class="flex items-center gap-2 text-sm cursor-pointer">
			<input
				type="checkbox"
				checked={$planStore.withFloorClaws}
				on:change={() => planStore.toggleFloorClaws()}
				class="w-auto m-0"
				title="Bodenkrallen an Querbalken-Positionen anzeigen"
			/>
			mit Bodenkrallen
		</label>
		</div>
	</div>

	<div class="flex gap-2 my-3">
		<button
			on:click={verlegen}
			title="Dielen basierend auf Polygon und Einstellungen generieren"
			class="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition-colors cursor-pointer"
		>
			Verlegen
		</button>
		<button
			on:click={leeren}
			title="Dielen wieder ausblenden"
			class="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors cursor-pointer"
		>
			Leeren
		</button>
	</div>

	{#if $planStore.generatedPlanks.length > 0}
		<h3 class="text-sm text-gray-600 my-3">
			Generierte Dielen ({$planStore.generatedPlanks.length})
		</h3>
		<div class="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded bg-white">
			{#each $planStore.generatedPlanks as plank, i}
				<div
					class="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
					class:bg-blue-50={$planStore.selectedPlankIndex === i}
					class:hover:bg-gray-50={$planStore.selectedPlankIndex !== i}
					on:click={() => selectPlank(i)}
					on:keydown={(e) => e.key === 'Enter' && selectPlank(i)}
					tabindex="0"
					role="button"
				>
					<span
						class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
						class:bg-blue-600={$planStore.selectedPlankIndex === i}
						class:text-white={$planStore.selectedPlankIndex === i}
						class:bg-gray-200={$planStore.selectedPlankIndex !== i}
						class:text-gray-700={$planStore.selectedPlankIndex !== i}
					>
						{i + 1}
					</span>
					<span class="flex-1">Länge: {Math.round(plank.length)} mm</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

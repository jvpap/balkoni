<script lang="ts">
	import { planStore } from '$lib/stores/planStore';

	let newBeamY = '';
	let newBeamWidth = '';

	// Querbalken sind bereits in mm gespeichert
	function toMM(val: number): number {
		return Math.round(val);
	}

	function updateY(index: number, value: string) {
		const mm = parseInt(value) || 0;
		const width = $planStore.crossBeams[index].width;
		planStore.updateCrossBeam(index, mm, width);
	}

	function updateWidth(index: number, value: string) {
		const mm = parseInt(value) || 0;
		const y = $planStore.crossBeams[index].y;
		planStore.updateCrossBeam(index, y, mm);
	}

	function selectBeam(index: number) {
		planStore.selectCrossBeam(index);
	}

	function removeBeam(index: number) {
		planStore.removeCrossBeam(index);
	}

	function addBeam() {
		const y = parseInt(newBeamY) || 0;
		const width = parseInt(newBeamWidth) || 0;
		planStore.addCrossBeam(y, width);
		newBeamY = '';
		newBeamWidth = '';
	}
</script>

<div class="flex flex-col gap-2">
	<div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
		<div class="flex items-center justify-between mb-3">
			<h3 class="m-0 text-sm text-slate-600 font-medium flex items-center gap-2">
				Querbalken <span class="font-normal text-slate-400 text-xs"
					>({$planStore.crossBeams.length})</span
				>
			</h3>
		</div>

		{#if $planStore.crossBeams.length === 0}
			<p class="text-slate-400 italic text-xs m-0">Noch keine Querbalken definiert</p>
		{:else}
			<div class="flex flex-col gap-2 max-h-[300px]">
				{#each $planStore.crossBeams as beam, i}
					<div
						role="button"
						tabindex="0"
						class="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200 transition-all hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
						on:click={() => selectBeam(i)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectBeam(i);
							}
						}}
						class:shadow-[0_0_0_2px_rgba(37,99,235,0.2)]={$planStore.selectedCrossBeamIndex === i}
					>
						<span
							class="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
							>{i + 1}</span
						>
						<div class="flex gap-2 flex-1 items-center">
							<div class="flex items-center gap-1 flex-1">
								<label
									for="beam-y-{i}"
									class="text-[10px] text-slate-500 uppercase tracking-wide w-4">Y</label
								>
								<input
									id="beam-y-{i}"
									type="number"
									value={toMM(beam.y)}
									on:change={(e) => updateY(i, e.currentTarget.value)}
									on:blur={(e) => updateY(i, e.currentTarget.value)}
									class="w-full min-w-0 px-1.5 py-1 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>
							<div class="flex items-center gap-1 flex-1">
								<label
									for="beam-width-{i}"
									class="text-[10px] text-slate-500 uppercase tracking-wide w-8">Breite</label
								>
								<input
									id="beam-width-{i}"
									type="number"
									value={toMM(beam.width)}
									on:change={(e) => updateWidth(i, e.currentTarget.value)}
									on:blur={(e) => updateWidth(i, e.currentTarget.value)}
									class="w-full min-w-0 px-1.5 py-1 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>
						</div>
						<button
							on:click={() => removeBeam(i)}
							title="Querbalken entfernen"
							class="w-7 h-7 bg-red-100 text-red-600 border border-red-200 rounded flex items-center justify-center text-lg leading-none p-0 flex-shrink-0 transition-all hover:bg-red-200 hover:border-red-300"
							>×</button
						>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Neuen Querbalken manuell hinzufügen -->
		<div class="flex gap-1 items-center mt-1 pt-1 border-t border-slate-200">
			<div class="flex items-center gap-0.5 flex-1">
				<label for="new-beam-y" class="text-[9px] text-slate-500 uppercase tracking-wide w-3"
					>Y</label
				>
				<input
					id="new-beam-y"
					type="number"
					bind:value={newBeamY}
					placeholder="0"
					class="w-full min-w-0 px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
				/>
			</div>
			<div class="flex items-center gap-0.5 flex-1">
				<label for="new-beam-width" class="text-[9px] text-slate-500 uppercase tracking-wide w-3"
					>Breite</label
				>
				<input
					id="new-beam-width"
					type="number"
					bind:value={newBeamWidth}
					placeholder="0"
					class="w-full min-w-0 mx-5 px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
				/>
			</div>
			<button
				on:click={addBeam}
				disabled={newBeamY === '' || newBeamWidth === ''}
				class="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[10px] rounded transition-colors cursor-pointer whitespace-nowrap"
			>
				+
			</button>
		</div>
	</div>
</div>

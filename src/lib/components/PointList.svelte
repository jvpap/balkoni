<script lang="ts">
	import { planStore, polygonArea } from '$lib/stores/planStore';

	let newPointX = '0';
	let newPointY = '0';
	let draggedIndex: number | null = null;

	// Punkte sind bereits in mm gespeichert
	function toMM(val: number): number {
		return Math.round(val);
	}

	function updateX(index: number, value: string) {
		const mm = parseInt(value) || 0;
		const y = $planStore.polygonPoints[index * 2 + 1];
		planStore.updatePoint(index, mm, y);
	}

	function updateY(index: number, value: string) {
		const mm = parseInt(value) || 0;
		const x = $planStore.polygonPoints[index * 2];
		planStore.updatePoint(index, x, mm);
	}

	function removePoint(index: number) {
		planStore.removePoint(index);
	}

	function selectPoint(index: number) {
		planStore.selectPoint(index);
	}

	function addPoint() {
		const x = parseInt(newPointX) || 0;
		const y = parseInt(newPointY) || 0;
		planStore.addPolygonPoint(x, y);
		newPointX = '0';
		newPointY = '0';
	}

	function handleDragStart(index: number, event: DragEvent) {
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(targetIndex: number, event: DragEvent) {
		event.preventDefault();
		if (draggedIndex === null || draggedIndex === targetIndex) return;

		const points = [...$planStore.polygonPoints];
		const fromIdx = draggedIndex * 2;
		const toIdx = targetIndex * 2;

		// Punkt aus alter Position entfernen
		const [x, y] = points.splice(fromIdx, 2);

		// Punkt an neuer Position einfügen
		points.splice(toIdx, 0, x, y);

		planStore.setPolygonPoints(points);
		draggedIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}
</script>

<div class="flex flex-col gap-2">
	<div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
		<div class="flex items-center justify-between mb-3">
			<h3 class="m-0 text-sm text-slate-600 font-medium flex items-center gap-2">
				Balkon-Ecken <span class="font-normal text-slate-400 text-xs"
					>({$planStore.polygonPoints.length / 2})</span
				>
			</h3>
			{#if $polygonArea > 0}
				<span class="text-emerald-600 text-xs font-medium"
					>{($polygonArea / 10000).toFixed(2)} m²</span
				>
			{/if}
		</div>

		{#if $planStore.polygonPoints.length === 0}
			<p class="text-slate-400 italic text-xs m-0">Noch keine Punkte gesetzt</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each Array.from({ length: $planStore.polygonPoints.length / 2 }) as _, i}
					{@const px = $planStore.polygonPoints[i * 2]}
					{@const py = $planStore.polygonPoints[i * 2 + 1]}
					{@const hasPrev = i > 0}
					{@const dx = hasPrev ? px - $planStore.polygonPoints[(i - 1) * 2] : 0}
					{@const dy = hasPrev ? py - $planStore.polygonPoints[(i - 1) * 2 + 1] : 0}
					{@const dist = hasPrev ? Math.sqrt(dx * dx + dy * dy) : 0}
					{@const angle = hasPrev ? (Math.atan2(dy, dx) * 180) / Math.PI : 0}
					<div
						class="flex flex-col gap-1 bg-white p-2 rounded-md border border-slate-200 cursor-pointer transition-all hover:border-slate-400 hover:bg-slate-50"
						class:border-blue-500={$planStore.selectedPointIndex === i}
						class:bg-blue-50={$planStore.selectedPointIndex === i}
						class:shadow-[0_0_0_2px_rgba(37,99,235,0.2)]={$planStore.selectedPointIndex === i}
						class:opacity-50={draggedIndex === i}
						class:border-dashed={draggedIndex !== null && draggedIndex !== i}
						on:click={() => selectPoint(i)}
						on:keydown={(e) => e.key === 'Enter' && selectPoint(i)}
						on:dragstart={(e) => handleDragStart(i, e)}
						on:dragover={handleDragOver}
						on:drop={(e) => handleDrop(i, e)}
						on:dragend={handleDragEnd}
						draggable={true}
						tabindex="0"
						role="button"
					>
						{#if hasPrev}
							<div
								class="flex justify-between gap-2 pl-8 pr-9 text-[10px] text-slate-500 font-mono leading-tight"
							>
								<span title="Differenz X zum vorherigen Punkt"
									>Δx&nbsp;{dx >= 0 ? '+' : ''}{Math.round(dx)}</span
								>
								<span title="Differenz Y zum vorherigen Punkt"
									>Δy&nbsp;{dy >= 0 ? '+' : ''}{Math.round(dy)}</span
								>
								<span title="Abstand zum vorherigen Punkt">d&nbsp;{Math.round(dist)}</span>
								<span title="Winkel zum vorherigen Punkt">α&nbsp;{angle.toFixed(1)}°</span>
							</div>
						{/if}
						<div class="flex items-center gap-2">
							<span
								class="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
								class:bg-blue-600={$planStore.selectedPointIndex === i}
								class:scale-110={$planStore.selectedPointIndex === i}>{i + 1}</span
							>
							<div class="flex gap-2 flex-1 items-center">
								<div class="flex items-center gap-1 flex-1">
									<label
										for="point-x-{i}"
										class="text-[10px] text-slate-500 uppercase tracking-wide">X</label
									>
									<input
										id="point-x-{i}"
										type="number"
										value={toMM(px)}
										min="0"
										title="X-Koordinate des Eckpunkts in mm"
										on:click|stopPropagation
										on:change={(e) => updateX(i, e.currentTarget.value)}
										on:blur={(e) => updateX(i, e.currentTarget.value)}
										class="w-full min-w-0 px-1.5 py-1 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
									/>
								</div>
								<div class="flex items-center gap-1 flex-1">
									<label
										for="point-y-{i}"
										class="text-[10px] text-slate-500 uppercase tracking-wide">Y</label
									>
									<input
										id="point-y-{i}"
										type="number"
										value={toMM(py)}
										min="0"
										title="Y-Koordinate des Eckpunkts in mm"
										on:click|stopPropagation
										on:change={(e) => updateY(i, e.currentTarget.value)}
										on:blur={(e) => updateY(i, e.currentTarget.value)}
										class="w-full min-w-0 px-1.5 py-1 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
									/>
								</div>
							</div>
							<button
								on:click|stopPropagation={() => removePoint(i)}
								title="Punkt entfernen"
								class="w-7 h-7 bg-red-100 text-red-600 border border-red-200 rounded flex items-center justify-center text-lg leading-none p-0 flex-shrink-0 transition-all hover:bg-red-200 hover:border-red-300"
								>×</button
							>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Neuen Punkt manuell hinzufügen -->
		<div class="flex gap-1 items-center mt-1 pt-1 border-t border-slate-200">
			<div class="flex items-center gap-0.5 flex-1">
				<label for="new-point-x" class="text-[9px] text-slate-500 uppercase tracking-wide w-3"
					>X</label
				>
				<input
					id="new-point-x"
					type="number"
					bind:value={newPointX}
					min="0"
					placeholder="0"
					title="X-Koordinate für neuen Eckpunkt in mm"
					class="w-full min-w-0 px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
				/>
			</div>
			<div class="flex items-center gap-0.5 flex-1">
				<label for="new-point-y" class="text-[9px] text-slate-500 uppercase tracking-wide w-3"
					>Y</label
				>
				<input
					id="new-point-y"
					type="number"
					bind:value={newPointY}
					min="0"
					placeholder="0"
					title="Y-Koordinate für neuen Eckpunkt in mm"
					class="w-full min-w-0 px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
				/>
			</div>
			<button
				on:click={addPoint}
				disabled={newPointX === '' ||
					newPointY === '' ||
					isNaN(parseInt(newPointX)) ||
					isNaN(parseInt(newPointY))}
				title="Neuen Eckpunkt hinzufügen"
				class="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[10px] rounded transition-colors cursor-pointer whitespace-nowrap"
			>
				+
			</button>
		</div>
	</div>
</div>

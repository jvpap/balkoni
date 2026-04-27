<script lang="ts">
	import { planStore, polygonArea } from '$lib/stores/planStore';

	let fileInput: HTMLInputElement | null = null;

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

	function exportPoints() {
		const points = $planStore.polygonPoints;
		const pairs: { x: number; y: number }[] = [];
		for (let i = 0; i < points.length; i += 2) {
			pairs.push({ x: Math.round(points[i]), y: Math.round(points[i + 1]) });
		}
		const data = {
			version: 1,
			type: 'balkoni-polygon',
			unit: 'mm',
			points: pairs
		};
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
		a.href = url;
		a.download = `balkon-ecken_${ts}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function triggerImport() {
		fileInput?.click();
	}

	async function handleImportFile(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			if (!data || !Array.isArray(data.points)) {
				throw new Error('Ungültiges Format: "points" Array fehlt');
			}
			const flat: number[] = [];
			for (const p of data.points) {
				const x = Number(p?.x);
				const y = Number(p?.y);
				if (!Number.isFinite(x) || !Number.isFinite(y)) {
					throw new Error('Ungültiger Punkt: x/y muss eine Zahl sein');
				}
				flat.push(x, y);
			}
			planStore.setPolygonPoints(flat);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			alert(`Import fehlgeschlagen: ${msg}`);
		} finally {
			// Input zurücksetzen, damit derselbe Datei-Name erneut importierbar ist
			target.value = '';
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-[460px] overflow-y-auto">
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
						on:click={() => selectPoint(i)}
						on:keydown={(e) => e.key === 'Enter' && selectPoint(i)}
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
	</div>

	<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-2">
		<button
			type="button"
			on:click={triggerImport}
			title="Balkon-Ecken aus JSON-Datei importieren (ersetzt vorhandene Punkte)"
			class="flex-1 px-2 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs rounded transition-colors cursor-pointer"
		>
			Import…
		</button>
		<button
			type="button"
			on:click={exportPoints}
			disabled={$planStore.polygonPoints.length === 0}
			title="Balkon-Ecken als JSON-Datei speichern"
			class="flex-1 px-2 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs rounded transition-colors cursor-pointer"
		>
			Export…
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="application/json,.json"
			class="hidden"
			on:change={handleImportFile}
		/>
	</div>
</div>

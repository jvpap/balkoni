<script lang="ts">
	import { planStore } from '$lib/stores/planStore';

	let fileInput: HTMLInputElement | null = null;

	function exportData() {
		const points = $planStore.polygonPoints;
		const pairs: { x: number; y: number }[] = [];
		for (let i = 0; i < points.length; i += 2) {
			pairs.push({ x: Math.round(points[i]), y: Math.round(points[i + 1]) });
		}
		const data = {
			version: 2,
			type: 'balkoni-polygon',
			unit: 'mm',
			points: pairs,
			crossBeams: $planStore.crossBeams.map((beam) => ({
				y: Math.round(beam.y),
				width: Math.round(beam.width)
			}))
		};
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
		a.href = url;
		a.download = `balkon-plan_${ts}.json`;
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

			// Querbalken importieren (abwärtskompatibel: nur wenn vorhanden)
			if (Array.isArray(data.crossBeams)) {
				const crossBeams: { y: number; width: number }[] = [];
				for (const beam of data.crossBeams) {
					const y = Number(beam?.y);
					const width = Number(beam?.width);
					if (Number.isFinite(y) && Number.isFinite(width)) {
						crossBeams.push({ y, width });
					}
				}
				planStore.setCrossBeams(crossBeams);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			alert(`Import fehlgeschlagen: ${msg}`);
		} finally {
			target.value = '';
		}
	}
</script>

<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-2">
	<button
		type="button"
		on:click={triggerImport}
		title="Balkon-Ecken und Querbalken aus JSON-Datei importieren"
		class="flex-1 px-2 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs rounded transition-colors cursor-pointer"
	>
		Import…
	</button>
	<button
		type="button"
		on:click={exportData}
		disabled={$planStore.polygonPoints.length === 0}
		title="Balkon-Ecken und Querbalken als JSON-Datei speichern"
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

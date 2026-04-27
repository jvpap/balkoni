<script lang="ts">
	import { canvasSizeStore } from '$lib/stores/canvasSizeStore';
	import { planStore } from '$lib/stores/planStore';

	let canvasWidthMM = $canvasSizeStore.widthMM;
	let canvasHeightMM = $canvasSizeStore.heightMM;

	function updateCanvasSize() {
		canvasSizeStore.setSize(canvasWidthMM, canvasHeightMM);
	}

	function clearPolygon() {
		planStore.resetPolygon();
	}
</script>

<div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
	<h3 class="m-0 mb-2.5 text-sm text-slate-600 font-medium">Editor-Gr&ouml;&szlig;e</h3>
	<div class="flex felx-row justify-between">
		<div class="flex gap-4 items-end">
			<div class="flex flex-col gap-1">
				<label for="canvas-width" class="text-[11px] text-slate-500 font-medium">Breite (mm):</label
				>
				<input
					id="canvas-width"
					type="number"
					bind:value={canvasWidthMM}
					min="1000"
					max="10000"
					on:change={updateCanvasSize}
					on:blur={updateCanvasSize}
					class="w-[90px] px-2 py-1.5 border border-slate-300 rounded text-[13px] font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label for="canvas-height" class="text-[11px] text-slate-500 font-medium"
					>H&ouml;he (mm):</label
				>
				<input
					id="canvas-height"
					type="number"
					bind:value={canvasHeightMM}
					min="1000"
					max="10000"
					on:change={updateCanvasSize}
					on:blur={updateCanvasSize}
					class="w-[90px] px-2 py-1.5 border border-slate-300 rounded text-[13px] font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
				/>
			</div>
		</div>
		<button
			on:click={clearPolygon}
			class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors cursor-pointer whitespace-nowrap"
		>
			Balkon<br />löschen
		</button>
	</div>
</div>

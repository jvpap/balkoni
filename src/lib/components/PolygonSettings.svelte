<script lang="ts">
	import { planStore } from '$lib/stores/planStore';

	function startDrawing() {
		planStore.startDrawing();
	}

	function finishDrawing() {
		planStore.finishDrawing();
	}
</script>

<div class="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50">
	<h2 class="mt-0 mb-2 text-base text-gray-700 font-medium">1. Balkon-Umriss zeichnen</h2>
	<button
		on:click={startDrawing}
		class="m-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors cursor-pointer"
	>
		Neu zeichnen
	</button>
	<button
		on:click={finishDrawing}
		disabled={!$planStore.isDrawingPolygon}
		class="m-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded transition-colors cursor-pointer"
	>
		Fertig
	</button>

	{#if $planStore.isDrawingPolygon}
		<p class="text-gray-500 text-xs italic my-2">Klicke auf das Canvas um Ecken zu setzen</p>
	{/if}
</div>

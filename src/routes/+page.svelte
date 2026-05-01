<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import CanvasSizeSettings from '$lib/components/CanvasSizeSettings.svelte';
	import CrossBeamList from '$lib/components/CrossBeamList.svelte';
	import ImportExport from '$lib/components/ImportExport.svelte';
	import MousePosition from '$lib/components/MousePosition.svelte';
	import PointList from '$lib/components/PointList.svelte';
	import { planStore } from '$lib/stores/planStore';
	import PlankSettings from '$lib/components/PlankSettings.svelte';
	import Statistics from '$lib/components/Statistics.svelte';
	import CuttingOptimizer from '$lib/components/CuttingOptimizer.svelte';

	let canvasStage: any = null;
	let sidebarCollapsed = false;

	function startDrawing() {
		planStore.startDrawing();
	}

	function finishDrawing() {
		planStore.finishDrawing();
	}
</script>

<svelte:head>
	<title>Balkon-Dielen-Planer</title>
</svelte:head>

<main
	class="flex flex-col lg:flex-row gap-3 p-3 lg:p-5 font-sans min-h-screen lg:h-screen overflow-auto lg:overflow-hidden"
>
	<!-- Mobile: Always open sidebar, Desktop: collapsible with fixed width -->
	<aside
		class="flex-shrink-0 flex flex-col gap-3 w-full h-auto lg:h-full transition-all duration-200 ease-in-out"
		class:lg:w-[340px]={!sidebarCollapsed}
		class:lg:w-10={sidebarCollapsed}
	>
		<div class="flex gap-2 items-center">
			{#if !sidebarCollapsed}
				<button
					type="button"
					on:click={startDrawing}
					class="flex-shrink-0 px-3 py-2 bg-red-300 hover:bg-red-700 text-white text-sm lg:text-xs rounded transition-colors cursor-pointer"
				>
					Löschen + Eckpunkte setzen
				</button>
				<button
					type="button"
					on:click={finishDrawing}
					disabled={!$planStore.isDrawingPolygon}
					class="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm lg:text-xs rounded transition-colors cursor-pointer"
				>
					Fertig
				</button>
			{/if}
			<!-- Collapse button only on desktop -->
			<button
				type="button"
				on:click={() => (sidebarCollapsed = !sidebarCollapsed)}
				title={sidebarCollapsed ? 'Eingabe einblenden' : 'Eingabe ausblenden'}
				aria-label={sidebarCollapsed ? 'Eingabe einblenden' : 'Eingabe ausblenden'}
				class="hidden lg:flex flex-shrink-0 w-10 h-10 items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer"
				class:ml-auto={!sidebarCollapsed}
			>
				{sidebarCollapsed ? '›' : '‹'}
			</button>
		</div>

		<div class="flex-1 min-h-0 flex flex-col gap-4 lg:hidden">
			<CanvasSizeSettings />
			<MousePosition />
			<div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
				<PointList />
				<CrossBeamList />
			</div>
			<ImportExport />
		</div>

		{#if !sidebarCollapsed}
			<div class="flex-1 min-h-0 flex flex-col gap-4 hidden lg:flex">
				<CanvasSizeSettings />
				<MousePosition />
				<div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
					<PointList />
					<CrossBeamList />
				</div>
				<ImportExport />
			</div>
		{/if}
	</aside>

	<!-- Canvas: Full width on mobile, fixed on desktop -->
	<div class="flex-shrink-0 lg:h-full overflow-auto flex justify-center items-start">
		<Canvas bind:stage={canvasStage} />
	</div>

	<!-- Right panels: Stacked on mobile, horizontal on desktop -->
	<div class="flex-1 min-w-0 lg:h-full overflow-x-auto">
		<div class="flex flex-col lg:flex-row gap-3 h-full min-w-max">
			<div class="w-full lg:w-[340px] flex-shrink-0 lg:h-full overflow-y-auto">
				<PlankSettings />
			</div>
			<div class="w-full lg:w-[340px] flex-shrink-0 lg:h-full overflow-y-auto">
				<Statistics />
			</div>
			<div class="w-full lg:w-[400px] flex-shrink-0 lg:h-full overflow-y-auto">
				<CuttingOptimizer />
			</div>
		</div>
	</div>
</main>

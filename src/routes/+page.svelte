<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import CanvasSizeSettings from '$lib/components/CanvasSizeSettings.svelte';
	import MousePosition from '$lib/components/MousePosition.svelte';
	import PointList from '$lib/components/PointList.svelte';
	import PlankSettings from '$lib/components/PlankSettings.svelte';
	import Statistics from '$lib/components/Statistics.svelte';
	import CuttingOptimizer from '$lib/components/CuttingOptimizer.svelte';

	let canvasStage: any = null;
	let sidebarCollapsed = false;
</script>

<svelte:head>
	<title>Balkon-Dielen-Planer</title>
</svelte:head>

<main class="flex gap-3 p-5 font-sans h-screen overflow-hidden">
	<aside
		class="flex-shrink-0 flex flex-col gap-3 h-full transition-[width] duration-200 ease-in-out"
		class:w-[340px]={!sidebarCollapsed}
		class:w-10={sidebarCollapsed}
	>
		<button
			type="button"
			on:click={() => (sidebarCollapsed = !sidebarCollapsed)}
			title={sidebarCollapsed ? 'Eingabe einblenden' : 'Eingabe ausblenden'}
			aria-label={sidebarCollapsed ? 'Eingabe einblenden' : 'Eingabe ausblenden'}
			class="self-end flex-shrink-0 w-10 h-10 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer"
		>
			{sidebarCollapsed ? '›' : '‹'}
		</button>

		{#if !sidebarCollapsed}
			<div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
				<CanvasSizeSettings />
				<MousePosition />
				<PointList />
			</div>
		{/if}
	</aside>

	<div class="flex-shrink-0 h-full overflow-auto flex justify-center items-start">
		<Canvas bind:stage={canvasStage} />
	</div>

	<div class="flex-1 min-w-0 h-full overflow-x-auto">
		<div class="flex gap-3 h-full min-w-max">
			<div class="w-[340px] flex-shrink-0 h-full overflow-y-auto">
				<PlankSettings />
			</div>
			<div class="w-[340px] flex-shrink-0 h-full overflow-y-auto">
				<Statistics />
			</div>
			<div class="w-[400px] flex-shrink-0 h-full overflow-y-auto">
				<CuttingOptimizer />
			</div>
		</div>
	</div>
</main>

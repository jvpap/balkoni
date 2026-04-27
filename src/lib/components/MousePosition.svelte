<script lang="ts">
	import { planStore } from '$lib/stores/planStore';

	$: selectedIndex = $planStore.selectedPointIndex;
	$: referencePoint =
		selectedIndex >= 0 && $planStore.polygonPoints.length >= (selectedIndex + 1) * 2
			? {
					x: $planStore.polygonPoints[selectedIndex * 2],
					y: $planStore.polygonPoints[selectedIndex * 2 + 1]
				}
			: null;

	$: deltaX = referencePoint ? Math.round($planStore.mouseX - referencePoint.x) : 0;
	$: deltaY = referencePoint ? Math.round($planStore.mouseY - referencePoint.y) : 0;
	$: distanceMM = referencePoint
		? Math.round(
				Math.hypot($planStore.mouseX - referencePoint.x, $planStore.mouseY - referencePoint.y)
			)
		: 0;
	$: angle = referencePoint
		? Math.atan2($planStore.mouseY - referencePoint.y, $planStore.mouseX - referencePoint.x) *
			(180 / Math.PI)
		: 0;
</script>

<div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
	<h3 class="m-0 mb-2.5 text-sm text-slate-600 font-medium">Mausposition</h3>
	<div class="flex gap-5">
		<div class="flex items-center gap-1.5">
			<span class="font-semibold text-slate-500 text-xs">X:</span>
			<span
				class="font-mono text-sm text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 min-w-[80px] text-right"
				>{Math.round($planStore.mouseX)} mm</span
			>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="font-semibold text-slate-500 text-xs">Y:</span>
			<span
				class="font-mono text-sm text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 min-w-[80px] text-right"
				>{Math.round($planStore.mouseY)} mm</span
			>
		</div>
	</div>

	{#if referencePoint}
		<div class="mt-3">
			<div class="h-px bg-slate-200 mb-2.5"></div>
			<p class="m-0 mb-2.5 text-sm text-slate-600">
				<strong>Distanz zur markierten Ecke ({selectedIndex + 1})</strong>
			</p>

			<div class="flex gap-5">
				<div class="flex items-center gap-1.5">
					<span class="font-semibold text-slate-500 text-xs">ΔX:</span>
					<span
						class="font-mono text-sm bg-white px-2 py-0.5 rounded border min-w-[80px] text-right"
						class:text-emerald-600={deltaX > 0}
						class:border-emerald-300={deltaX > 0}
						class:bg-emerald-50={deltaX > 0}
						class:text-red-600={deltaX < 0}
						class:border-red-300={deltaX < 0}
						class:bg-red-50={deltaX < 0}
						class:text-slate-800={deltaX === 0}
						class:border-slate-300={deltaX === 0}
					>
						{deltaX > 0 ? '+' : ''}{deltaX} mm
					</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="font-semibold text-slate-500 text-xs">ΔY:</span>
					<span
						class="font-mono text-sm bg-white px-2 py-0.5 rounded border min-w-[80px] text-right"
						class:text-emerald-600={deltaY > 0}
						class:border-emerald-300={deltaY > 0}
						class:bg-emerald-50={deltaY > 0}
						class:text-red-600={deltaY < 0}
						class:border-red-300={deltaY < 0}
						class:bg-red-50={deltaY < 0}
						class:text-slate-800={deltaY === 0}
						class:border-slate-300={deltaY === 0}
					>
						{deltaY > 0 ? '+' : ''}{deltaY} mm
					</span>
				</div>
			</div>

			<div class="flex gap-5 mt-3 pt-2.5 border-t border-dashed border-slate-200">
				<span class="flex items-center gap-1.5">
					<span class="font-semibold text-slate-500 text-xs">Distanz:</span>
					<span
						class="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 min-w-[80px] text-right"
						>{distanceMM} mm</span
					>
				</span>
				<span class="flex items-center gap-1.5">
					<span class="font-semibold text-slate-500 text-xs">Winkel:</span>
					<span
						class="font-mono text-sm text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 min-w-[80px] text-right"
						>{angle.toFixed(1)}°</span
					>
				</span>
			</div>
		</div>
	{/if}
</div>

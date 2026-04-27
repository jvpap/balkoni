<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { planStore } from '$lib/stores/planStore';
	import { canvasSizeStore } from '$lib/stores/canvasSizeStore';
	import { CONSTANTS } from '$lib/types';
	import { createCoordinateConverter } from '$lib/utils/coordinateUtils';
	import * as renderer from '$lib/utils/canvasRenderer';
	import { calculateJoints } from '$lib/utils/plankCalculator';
	import type KonvaType from 'konva';

	export let stage: KonvaType.Stage | null = null;

	let container: HTMLDivElement;
	let resizeWrapper: HTMLDivElement;
	let gridLayer: KonvaType.Layer;
	let crosshairLayer: KonvaType.Layer;
	let polygonLayer: KonvaType.Layer;
	let plankLayer: KonvaType.Layer;
	let Konva: typeof import('konva').default;

	// Aktuelle Pixel-Größe des Canvas (vom User per Drag-Handle veränderbar)
	let canvasPxWidth = $canvasSizeStore.pxWidth;
	let canvasPxHeight = $canvasSizeStore.pxHeight;

	let crosshairPos = { x: canvasPxWidth / 2, y: canvasPxHeight / 2 };
	let useKeyboardMode = false;

	const { SCALE } = CONSTANTS;
	const MOVE_STEP = SCALE / 10;
	const MIN_PX_WIDTH = 600;
	const MIN_PX_HEIGHT = 500;

	let conv = createCoordinateConverter(
		$canvasSizeStore.widthMM / 1000,
		$canvasSizeStore.heightMM / 1000,
		canvasPxWidth,
		canvasPxHeight
	);

	function pxToMM(px: number, axis: 'x' | 'y') {
		return axis === 'x' ? conv.pxToMM_X(px) : conv.pxToMM_Y(px);
	}

	let generatedPlankLayer: KonvaType.Layer;
	let jointBandLayer: KonvaType.Layer;

	function redrawAll(state = $planStore) {
		const pixelPoints: number[] = [];
		for (let i = 0; i < state.polygonPoints.length; i += 2) {
			pixelPoints.push(conv.mmToPx_X(state.polygonPoints[i]));
			pixelPoints.push(conv.mmToPx_Y(state.polygonPoints[i + 1]));
		}
		renderer.drawPolygon(Konva, polygonLayer, pixelPoints, state.selectedPointIndex);
		renderer.drawPlanks(Konva, plankLayer, state.placedPlanks, conv);

		// Generierte Dielen zeichnen (semi-transparent über dem Polygon)
		if (generatedPlankLayer) {
			renderer.drawGeneratedPlanks(
				Konva,
				generatedPlankLayer,
				state.generatedPlanks,
				state.selectedPlankIndex,
				conv
			);
		}

		// Fugenband zwischen benachbarten Dielen zeichnen
		if (jointBandLayer) {
			const joints = calculateJoints(state.generatedPlanks, state.polygonPoints);
			renderer.drawJointBands(Konva, jointBandLayer, joints.segments, conv);
		}
	}

	let resizeObserver: ResizeObserver | null = null;
	let persistTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		let unsubscribePlan: () => void;
		let unsubscribeSize: () => void;
		let handleKeydown: (e: KeyboardEvent) => void;

		(async () => {
			Konva = (await import('konva')).default;

			// Initiale Pixel-Größe einmalig via DOM setzen (NICHT reaktiv binden,
			// damit `resize: both` ungestört vom User geändert werden kann).
			resizeWrapper.style.width = `${canvasPxWidth}px`;
			resizeWrapper.style.height = `${canvasPxHeight}px`;

			stage = new Konva.Stage({ container, width: canvasPxWidth, height: canvasPxHeight });

			gridLayer = new Konva.Layer();
			crosshairLayer = new Konva.Layer();
			polygonLayer = new Konva.Layer();
			plankLayer = new Konva.Layer();
			generatedPlankLayer = new Konva.Layer();
			jointBandLayer = new Konva.Layer();
			[
				gridLayer,
				crosshairLayer,
				polygonLayer,
				plankLayer,
				generatedPlankLayer,
				jointBandLayer
			].forEach((l) => stage!.add(l));

			renderer.drawGrid(
				Konva,
				gridLayer,
				$canvasSizeStore.widthMM / 1000,
				$canvasSizeStore.heightMM / 1000,
				canvasPxWidth,
				canvasPxHeight
			);
			renderer.drawCrosshair(
				Konva,
				crosshairLayer,
				crosshairPos.x,
				crosshairPos.y,
				canvasPxWidth,
				canvasPxHeight
			);

			// ResizeObserver: Canvas-Pixel-Größe an Wrapper-Größe anpassen
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const newW = Math.max(MIN_PX_WIDTH, Math.round(entry.contentRect.width));
					const newH = Math.max(MIN_PX_HEIGHT, Math.round(entry.contentRect.height));
					if (newW === canvasPxWidth && newH === canvasPxHeight) continue;
					canvasPxWidth = newW;
					canvasPxHeight = newH;
					stage?.size({ width: canvasPxWidth, height: canvasPxHeight });
					conv = createCoordinateConverter(
						$canvasSizeStore.widthMM / 1000,
						$canvasSizeStore.heightMM / 1000,
						canvasPxWidth,
						canvasPxHeight
					);
					renderer.drawGrid(
						Konva,
						gridLayer,
						$canvasSizeStore.widthMM / 1000,
						$canvasSizeStore.heightMM / 1000,
						canvasPxWidth,
						canvasPxHeight
					);
					redrawAll(get(planStore));
					renderer.drawCrosshair(
						Konva,
						crosshairLayer,
						crosshairPos.x,
						crosshairPos.y,
						canvasPxWidth,
						canvasPxHeight
					);
					stage?.batchDraw();

					// Debounced persist
					if (persistTimer) clearTimeout(persistTimer);
					persistTimer = setTimeout(() => {
						canvasSizeStore.setPixelSize(canvasPxWidth, canvasPxHeight);
					}, 250);
				}
			});
			resizeObserver.observe(resizeWrapper);

			// Maus-Tracking
			stage.on('mousemove', () => {
				const pos = stage!.getPointerPosition();
				if (!pos) return;
				useKeyboardMode = false;
				crosshairPos = pos;
				planStore.setMousePosition(pxToMM(pos.x, 'x'), pxToMM(pos.y, 'y'));
				renderer.drawCrosshair(Konva, crosshairLayer, pos.x, pos.y, canvasPxWidth, canvasPxHeight);
			});

			stage.on('mouseleave', () => {
				if (!useKeyboardMode) {
					crosshairLayer.destroyChildren();
					crosshairLayer.draw();
				}
			});

			// Klick für Polygon-Punkte
			stage.on('click tap', () => {
				if (!$planStore.isDrawingPolygon) return;
				if (!useKeyboardMode) {
					const pos = stage!.getPointerPosition();
					if (!pos) return;
					crosshairPos = pos;
				}
				planStore.addPolygonPoint(pxToMM(crosshairPos.x, 'x'), pxToMM(crosshairPos.y, 'y'));
			});

			unsubscribePlan = planStore.subscribe((state) => {
				redrawAll(state);
				stage?.batchDraw();
			});

			unsubscribeSize = canvasSizeStore.subscribe((size) => {
				conv = createCoordinateConverter(
					size.widthMM / 1000,
					size.heightMM / 1000,
					canvasPxWidth,
					canvasPxHeight
				);
				renderer.drawGrid(
					Konva,
					gridLayer,
					size.widthMM / 1000,
					size.heightMM / 1000,
					canvasPxWidth,
					canvasPxHeight
				);
				redrawAll(get(planStore));
				renderer.drawCrosshair(
					Konva,
					crosshairLayer,
					crosshairPos.x,
					crosshairPos.y,
					canvasPxWidth,
					canvasPxHeight
				);
				stage?.batchDraw();
			});

			// Tastatur-Steuerung
			handleKeydown = function (e: KeyboardEvent) {
				if (!$planStore.isDrawingPolygon) return;

				useKeyboardMode = true;
				let stepX = MOVE_STEP;
				let stepY = MOVE_STEP;

				if (e.ctrlKey) {
					// 5 mm Schritte
					stepX = conv.mmToPx_X(10);
					stepY = conv.mmToPx_Y(10);
				} else if (e.shiftKey) {
					// 1 Meter Schritte
					stepX = conv.mmToPx_X(1000);
					stepY = conv.mmToPx_Y(1000);
				}

				let moved = false;

				switch (e.key) {
					case 'ArrowUp':
						crosshairPos.y = Math.max(0, crosshairPos.y - stepY);
						moved = true;
						break;
					case 'ArrowDown':
						crosshairPos.y = Math.min(canvasPxHeight, crosshairPos.y + stepY);
						moved = true;
						break;
					case 'ArrowLeft':
						crosshairPos.x = Math.max(0, crosshairPos.x - stepX);
						moved = true;
						break;
					case 'ArrowRight':
						crosshairPos.x = Math.min(canvasPxWidth, crosshairPos.x + stepX);
						moved = true;
						break;
					case ' ':
					case 'Enter':
						e.preventDefault();
						planStore.addPolygonPoint(pxToMM(crosshairPos.x, 'x'), pxToMM(crosshairPos.y, 'y'));
						return;
				}

				if (moved) {
					e.preventDefault();
					planStore.setMousePosition(pxToMM(crosshairPos.x, 'x'), pxToMM(crosshairPos.y, 'y'));
					renderer.drawCrosshair(
						Konva,
						crosshairLayer,
						crosshairPos.x,
						crosshairPos.y,
						canvasPxWidth,
						canvasPxHeight
					);
				}
			};

			window.addEventListener('keydown', handleKeydown);
		})();

		return () => {
			unsubscribePlan?.();
			unsubscribeSize?.();
			resizeObserver?.disconnect();
			if (persistTimer) clearTimeout(persistTimer);
			window.removeEventListener('keydown', handleKeydown as EventListener);
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={resizeWrapper}
	class="resize overflow-hidden rounded shadow-md bg-white cursor-crosshair outline outline-1 outline-gray-400 focus-within:outline-2 focus-within:outline-blue-600"
	style:min-width="{MIN_PX_WIDTH}px"
	style:min-height="{MIN_PX_HEIGHT}px"
>
	<div
		bind:this={container}
		class="w-full h-full outline-none"
		tabindex="0"
		role="application"
		aria-label="Balkon-Editor"
	></div>
</div>

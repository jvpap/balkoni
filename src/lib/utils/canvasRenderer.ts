import type { Plank, CrossBeam } from '$lib/types';
import { calculateFloorClawPositions } from '$lib/utils/geometry';
import type { JointSegment } from './plankCalculator';
import type { CoordinateConverter } from './coordinateUtils';
import type KonvaType from 'konva';
import { calculateCrossBeamIntersection } from './geometry';

export function drawGrid(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	canvasWidthMeters: number,
	canvasHeightMeters: number,
	canvasPxWidth: number,
	canvasPxHeight: number
) {
	layer.destroyChildren();

	const pxPerMeterX = canvasPxWidth / canvasWidthMeters;
	const pxPerMeterY = canvasPxHeight / canvasHeightMeters;

	// Vertikale Linien (alle 1m)
	for (let m = 0; m <= canvasWidthMeters; m++) {
		const x = m * pxPerMeterX;
		const isMajor = m % 5 === 0;
		layer.add(
			new Konva.Line({
				points: [x, 0, x, canvasPxHeight],
				stroke: isMajor ? '#94a3b8' : '#e2e8f0',
				strokeWidth: isMajor ? 2 : 1
			})
		);
		layer.add(
			new Konva.Text({
				x: x + 4,
				y: 4,
				text: `${m}m`,
				fontSize: 11,
				fill: '#64748b'
			})
		);
	}

	// Horizontale Linien (alle 1m)
	for (let m = 0; m <= canvasHeightMeters; m++) {
		const y = m * pxPerMeterY;
		const isMajor = m % 5 === 0;
		layer.add(
			new Konva.Line({
				points: [0, y, canvasPxWidth, y],
				stroke: isMajor ? '#94a3b8' : '#e2e8f0',
				strokeWidth: isMajor ? 2 : 1
			})
		);
		if (m > 0) {
			layer.add(
				new Konva.Text({
					x: 4,
					y: y + 4,
					text: `${m}m`,
					fontSize: 11,
					fill: '#64748b'
				})
			);
		}
	}

	// Rasterpunkte (alle 10cm)
	const dotSpacing = 0.1;
	for (let xm = 0; xm <= canvasWidthMeters; xm += dotSpacing) {
		for (let ym = 0; ym <= canvasHeightMeters; ym += dotSpacing) {
			if (Math.abs(xm - Math.round(xm)) < 0.01 && Math.abs(ym - Math.round(ym)) < 0.01) continue;
			layer.add(
				new Konva.Circle({
					x: xm * pxPerMeterX,
					y: ym * pxPerMeterY,
					radius: 1,
					fill: '#cbd5e1'
				})
			);
		}
	}

	layer.draw();
}

export function drawCrosshair(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	x: number,
	y: number,
	canvasPxWidth: number,
	canvasPxHeight: number
) {
	layer.destroyChildren();

	layer.add(
		new Konva.Line({
			points: [x, 0, x, canvasPxHeight],
			stroke: '#ef4444',
			strokeWidth: 1,
			dash: [5, 5]
		})
	);
	layer.add(
		new Konva.Line({
			points: [0, y, canvasPxWidth, y],
			stroke: '#ef4444',
			strokeWidth: 1,
			dash: [5, 5]
		})
	);
	layer.add(
		new Konva.Circle({
			x,
			y,
			radius: 4,
			fill: '#ef4444',
			stroke: 'white',
			strokeWidth: 2
		})
	);

	layer.draw();
}

export function drawPolygon(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	points: number[],
	selectedPointIndex: number = -1
) {
	layer.destroyChildren();

	// Punkt-Kreise + Nummern
	for (let i = 0; i < points.length; i += 2) {
		const pointIndex = i / 2;
		const isSelected = pointIndex === selectedPointIndex;
		const color = isSelected ? '#2563eb' : '#dc2626';
		layer.add(
			new Konva.Circle({
				x: points[i],
				y: points[i + 1],
				radius: isSelected ? 8 : 6,
				fill: color,
				stroke: 'white',
				strokeWidth: 2
			})
		);
		layer.add(
			new Konva.Text({
				x: points[i] + 10,
				y: points[i + 1] - 8,
				text: String(pointIndex + 1),
				fontSize: 12,
				fill: color,
				fontStyle: 'bold'
			})
		);
	}

	// Offene Linie
	if (points.length >= 4) {
		layer.add(
			new Konva.Line({
				points,
				stroke: '#475569',
				strokeWidth: 2
			})
		);
	}

	// Geschlossenes Polygon
	if (points.length >= 6) {
		layer.add(
			new Konva.Line({
				points,
				stroke: '#00ff00',
				strokeWidth: 3,
				closed: true,
				fill: 'rgba(200, 220, 200, 0.4)'
			})
		);
	}

	layer.draw();
}

export function drawPlanks(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	planks: Plank[],
	conv: CoordinateConverter
) {
	layer.destroyChildren();

	for (const plank of planks) {
		layer.add(
			new Konva.Rect({
				x: conv.mmToPx_X(plank.x),
				y: conv.mmToPx_Y(plank.y),
				width: conv.mmToPx_X(plank.width),
				height: conv.mmToPx_Y(plank.height),
				stroke: '#2563eb',
				strokeWidth: 1,
				fill: plank.waste > 0.1 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(147, 197, 253, 0.5)'
			})
		);
	}

	layer.draw();
}

export function drawGeneratedPlanks(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	planks: Plank[],
	selectedIndex: number = -1,
	conv: CoordinateConverter
) {
	layer.destroyChildren();

	for (let i = 0; i < planks.length; i++) {
		const plank = planks[i];
		const isSelected = i === selectedIndex;
		const px = conv.mmToPx_X(plank.x);
		const py = conv.mmToPx_Y(plank.y);
		const pw = conv.mmToPx_X(plank.width);
		const ph = conv.mmToPx_Y(plank.height);

		// Holzbraune Diele mit Transparenz
		layer.add(
			new Konva.Rect({
				x: px,
				y: py,
				width: pw,
				height: ph,
				stroke: isSelected ? '#2563eb' : '#8B4513',
				strokeWidth: isSelected ? 2 : 1,
				fill: isSelected ? 'rgba(139, 69, 19, 0.5)' : 'rgba(160, 82, 45, 0.35)'
			})
		);

		// Nummer wirklich mittig in der Diele
		const text = new Konva.Text({
			text: String(i + 1),
			fontSize: isSelected ? 12 : 9,
			fill: isSelected ? '#1d4ed8' : '#5D4037',
			fontStyle: isSelected ? 'bold' : 'normal',
			align: 'center',
			verticalAlign: 'middle'
		});
		// Position berechnen nachdem Text-Größe bekannt ist
		text.x(px + pw / 2 - text.width() / 2);
		text.y(py + ph / 2 - text.height() / 2);
		layer.add(text);
	}

	layer.draw();
}

export function drawJointBands(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	segments: JointSegment[],
	conv: CoordinateConverter
) {
	layer.destroyChildren();

	for (const seg of segments) {
		const px = conv.mmToPx_X(seg.x);
		const py1 = conv.mmToPx_Y(seg.y1);
		const py2 = conv.mmToPx_Y(seg.y2);
		layer.add(
			new Konva.Line({
				points: [px, py1, px, py2],
				stroke: '#000',
				strokeWidth: 2
			})
		);
	}

	layer.draw();
}

export function drawCrossBeams(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	crossBeams: CrossBeam[],
	polygonPoints: number[],
	conv: CoordinateConverter,
	selectedIndex: number = -1
) {
	layer.destroyChildren();

	if (crossBeams.length === 0) return;

	for (let i = 0; i < crossBeams.length; i++) {
		const beam = crossBeams[i];
		const isSelected = i === selectedIndex;

		// Polygon-Intersection berechnen
		const intersectionPolygon = calculateCrossBeamIntersection(beam.y, beam.width, polygonPoints);

		// Wenn Intersection berechnet werden konnte, zeichne das Polygon
		if (intersectionPolygon.length >= 4) {
			const pixelPoints: number[] = [];
			for (let j = 0; j < intersectionPolygon.length; j += 2) {
				pixelPoints.push(conv.mmToPx_X(intersectionPolygon[j]));
				pixelPoints.push(conv.mmToPx_Y(intersectionPolygon[j + 1]));
			}

			// Transparenz basierend auf Auswahl
			const fillOpacity = isSelected ? 0.3 : 0.1;

			layer.add(
				new Konva.Line({
					points: pixelPoints,
					stroke: '#1e3a8a',
					strokeWidth: 2,
					closed: pixelPoints.length >= 6,
					fill: pixelPoints.length >= 6 ? `rgba(30, 58, 138, ${fillOpacity})` : undefined
				})
			);
		}
	}

	layer.draw();
}

export function drawFloorClaws(
	Konva: typeof KonvaType,
	layer: KonvaType.Layer,
	planks: Plank[],
	crossBeams: CrossBeam[],
	polygonPoints: number[],
	plankWidth: number,
	startFrom: 'left' | 'right',
	conv: CoordinateConverter
) {
	layer.destroyChildren();

	if (planks.length === 0 || crossBeams.length === 0) return;

	// Bodenkrallen-Positionen berechnen
	const positions = calculateFloorClawPositions(plankWidth, startFrom, polygonPoints, crossBeams);

	// Durchmesser der Bodenkrallen = halbe Dielenbreite
	const radiusMM = plankWidth / 4; // Radius = halber Durchmesser

	for (const pos of positions) {
		const xPx = conv.mmToPx_X(pos.x);
		const yPx = conv.mmToPx_Y(pos.y);
		const radiusPx = conv.mmToPx_X(radiusMM);

		// Farbe: grün für Rand, hellblau für innen
		const color = pos.isEdge ? '#04da39' : '#338eff';

		layer.add(
			new Konva.Circle({
				x: xPx,
				y: yPx,
				radius: radiusPx,
				fill: color,
				stroke: color,
				strokeWidth: 1
			})
		);
	}

	layer.draw();
}

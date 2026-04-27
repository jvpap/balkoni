import { CONSTANTS, type Plank } from '$lib/types';
import { getBoundingBox, linePolygonIntersections, pointInPolygon } from './geometry';

export interface JointSegment {
	/** X-Position der Fuge (gemeinsame Stoßkante zwischen zwei Dielen) */
	x: number;
	/** Anfang der Fuge in Y-Richtung */
	y1: number;
	/** Ende der Fuge in Y-Richtung */
	y2: number;
}

export interface JointResult {
	segments: JointSegment[];
	/** Gesamtlänge des benötigten Fugenbandes in mm */
	totalLength: number;
}

/**
 * Berechnet das benötigte Fugenband zwischen den Längsseiten benachbarter Dielen.
 * Es zählt nur der Teil, der wirklich die Balkonfläche (Polygon) überdeckt.
 * Am äußeren Rand der ersten/letzten Diele wird kein Band benötigt
 * (zwischen N Dielen gibt es nur N-1 Fugen).
 */
export function calculateJoints(planks: Plank[], polygonPoints: number[]): JointResult {
	const result: JointResult = { segments: [], totalLength: 0 };
	if (planks.length < 2 || polygonPoints.length < 6) return result;

	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return result;

	// Dielen nach X sortieren, damit die Reihenfolge (links → rechts) eindeutig ist
	const sorted = [...planks].sort((a, b) => a.x - b.x);

	for (let i = 0; i < sorted.length - 1; i++) {
		const a = sorted[i];
		const b = sorted[i + 1];
		const jointX = a.x + a.width;

		// Nur direkt benachbarte Dielen (Toleranz 1 mm)
		if (Math.abs(jointX - b.x) > 1) continue;

		// Polygon-Schnittpunkte entlang der vertikalen Stoßlinie
		const ints = linePolygonIntersections(
			jointX,
			bbox.minY - 1,
			jointX,
			bbox.maxY + 1,
			polygonPoints
		);

		// Paarweise (sortiert) sind das die Polygon-Innensegmente
		for (let k = 0; k + 1 < ints.length; k += 2) {
			const y1 = ints[k];
			const y2 = ints[k + 1];
			if (y2 > y1) {
				result.segments.push({ x: jointX, y1, y2 });
				result.totalLength += y2 - y1;
			}
		}
	}

	return result;
}

const { SCALE, PIXEL_TO_CM } = CONSTANTS;

export interface CalculationResult {
	placedPlanks: Plank[];
	totalWaste: number;
	totalPlankArea: number;
}

/**
 * Generiert Dielen, die von links oder rechts über den Balkonumriss verlegt werden.
 * Die Dielen stehen vertikal (Längsseite nach vorne/hinten) und werden nebeneinander verlegt.
 * Die Dielen werden so lang wie nötig generiert um die gesamte Balkonfläche abzudecken.
 * Alle Werte sind in mm (wie polygonPoints).
 */
export function generatePlanksForPolygon(
	polygonPoints: number[],
	plankWidthMM: number,
	startFrom: 'left' | 'right'
): Plank[] {
	const result: Plank[] = [];

	if (polygonPoints.length < 6) return result;

	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return result;

	const { minX, minY, maxX, maxY } = bbox;

	// Von links nach rechts (oder rechts nach links)
	let currentX = startFrom === 'left' ? minX : maxX - plankWidthMM;

	while (
		(startFrom === 'left' && currentX < maxX) ||
		(startFrom === 'right' && currentX + plankWidthMM > minX)
	) {
		// Für diese Diele-Spalte: finde den vordersten und hintersten Punkt im Polygon
		// Prüfe mehrere vertikale Linien innerhalb der Diele-Breite
		let colMinY = Infinity;
		let colMaxY = -Infinity;
		let hasPolygon = false;

		// Prüfe 3 Positionen: linke Kante, Mitte, rechte Kante der Diele
		const checkPositions = [currentX, currentX + plankWidthMM / 2, currentX + plankWidthMM];

		for (const checkX of checkPositions) {
			const intersections = linePolygonIntersections(checkX, minY, checkX, maxY, polygonPoints);
			for (let i = 0; i < intersections.length - 1; i += 2) {
				if (i + 1 >= intersections.length) break;
				const segStart = intersections[i];
				const segEnd = intersections[i + 1];

				// Prüfen ob Mittelpunkt im Polygon liegt
				const midY = (segStart + segEnd) / 2;
				if (pointInPolygon(checkX, midY, polygonPoints)) {
					colMinY = Math.min(colMinY, segStart);
					colMaxY = Math.max(colMaxY, segEnd);
					hasPolygon = true;
				}
			}
		}

		// Wenn Polygon gefunden, Diele über gesamten Y-Bereich erstellen
		if (hasPolygon && colMaxY > colMinY) {
			const fullHeight = colMaxY - colMinY;
			result.push({
				x: currentX,
				y: colMinY,
				width: plankWidthMM,
				height: fullHeight,
				length: fullHeight,
				actualLength: fullHeight,
				waste: 0
			});
		}

		// Nächste Diele-Spalte
		if (startFrom === 'left') {
			currentX += plankWidthMM;
		} else {
			currentX -= plankWidthMM;
		}
	}

	return result;
}

/**
 * Berechnet die optimale Platzierung der Dielen innerhalb eines Polygons
 */
export function calculatePlankPlacement(
	polygonPoints: number[],
	plankWidth: number,
	plankLengths: number[]
): CalculationResult {
	const result: CalculationResult = {
		placedPlanks: [],
		totalWaste: 0,
		totalPlankArea: 0
	};

	if (polygonPoints.length < 6) return result;

	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return result;

	const { minX, minY, maxX, maxY } = bbox;
	const plankPixelWidth = plankWidth * SCALE;
	const sortedLengths = [...plankLengths].sort((a, b) => b - a);

	let currentY = minY;

	while (currentY + plankPixelWidth <= maxY) {
		const rowCenterY = currentY + plankPixelWidth / 2;
		const intersections = linePolygonIntersections(
			minX,
			rowCenterY,
			maxX,
			rowCenterY,
			polygonPoints
		);

		for (let i = 0; i < intersections.length - 1; i += 2) {
			if (i + 1 >= intersections.length) break;

			let segStart = intersections[i];
			let segEnd = intersections[i + 1];

			const midX = (segStart + segEnd) / 2;
			if (!pointInPolygon(midX, rowCenterY, polygonPoints)) continue;

			let currentX = segStart;

			while (currentX < segEnd) {
				const remainingWidth = segEnd - currentX;

				let bestLength = sortedLengths.find((l) => l * SCALE <= remainingWidth);

				if (!bestLength) {
					bestLength = remainingWidth * PIXEL_TO_CM;
				}

				const bestLengthPx = Math.min(bestLength * SCALE, remainingWidth);
				const actualLengthCm = bestLengthPx * PIXEL_TO_CM;
				const waste = Math.max(0, bestLength - actualLengthCm);

				result.placedPlanks.push({
					x: currentX,
					y: currentY,
					width: bestLengthPx,
					height: plankPixelWidth,
					length: bestLength,
					actualLength: actualLengthCm,
					waste: waste
				});

				result.totalWaste += waste;
				result.totalPlankArea += actualLengthCm * plankWidth;

				currentX += bestLengthPx;
			}
		}

		currentY += plankPixelWidth;
	}

	return result;
}

import type { CrossBeam } from '$lib/types/index';

/**
 * Berechnet die Fläche eines Polygons mit der Shoelace-Formel.
 * Eingabe: polygonPoints in mm. Rückgabe: Fläche in cm².
 */
export function calculatePolygonArea(polygonPoints: number[]): number {
	if (polygonPoints.length < 6) return 0;

	let area = 0;
	for (let i = 0; i < polygonPoints.length; i += 2) {
		const j = (i + 2) % polygonPoints.length;
		const x1 = polygonPoints[i];
		const y1 = polygonPoints[i + 1];
		const x2 = polygonPoints[j];
		const y2 = polygonPoints[j + 1];
		area += x1 * y2 - x2 * y1;
	}
	// Shoelace liefert mm²; Umrechnung in cm² (1 cm² = 100 mm²)
	return Math.abs(area) / 2 / 100;
}

/**
 * Ray-Casting Algorithmus: Prüft ob ein Punkt innerhalb eines Polygons liegt
 */
export function pointInPolygon(x: number, y: number, polygonPoints: number[]): boolean {
	if (polygonPoints.length < 6) return false;

	let inside = false;
	for (let i = 0, j = polygonPoints.length - 2; i < polygonPoints.length; i += 2) {
		const xi = polygonPoints[i],
			yi = polygonPoints[i + 1];
		const xj = polygonPoints[j],
			yj = polygonPoints[j + 1];

		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
		j = i;
	}
	return inside;
}

/**
 * Findet alle Schnittpunkte einer Linie mit dem Polygon.
 * Für horizontale Linien (y = const) werden X-Werte zurückgegeben.
 * Für vertikale Linien (x = const) werden Y-Werte zurückgegeben.
 */
export function linePolygonIntersections(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	polygonPoints: number[]
): number[] {
	if (polygonPoints.length < 4) return [];

	const intersections: number[] = [];
	const isVerticalLine = Math.abs(x1 - x2) < 0.001; // x ist konstant

	for (let i = 0; i < polygonPoints.length; i += 2) {
		const j = (i + 2) % polygonPoints.length;
		const x3 = polygonPoints[i],
			y3 = polygonPoints[i + 1];
		const x4 = polygonPoints[j],
			y4 = polygonPoints[j + 1];

		const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (denom === 0) continue;

		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

		if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
			if (isVerticalLine) {
				// Für vertikale Linien: Y-Wert des Schnittpunkts zurückgeben
				const py = y1 + t * (y2 - y1);
				intersections.push(py);
			} else {
				// Für horizontale Linien: X-Wert des Schnittpunkts zurückgeben
				const px = x1 + t * (x2 - x1);
				intersections.push(px);
			}
		}
	}

	return intersections.sort((a, b) => a - b);
}

/**
 * Berechnet die Bounding Box eines Polygons
 */
export function getBoundingBox(
	polygonPoints: number[]
): { minX: number; minY: number; maxX: number; maxY: number } | null {
	if (polygonPoints.length < 4) return null;

	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
	for (let i = 0; i < polygonPoints.length; i += 2) {
		minX = Math.min(minX, polygonPoints[i]);
		minY = Math.min(minY, polygonPoints[i + 1]);
		maxX = Math.max(maxX, polygonPoints[i]);
		maxY = Math.max(maxY, polygonPoints[i + 1]);
	}
	return { minX, minY, maxX, maxY };
}

/**
 * Berechnet die Überschneidung eines horizontalen Streifens mit dem Polygon.
 * Gibt ein Polygon zurück, das die Überschneidung darstellt.
 * Verwendet direkte Linien-Polygon-Intersection mit Bounding Box.
 */
export function calculateCrossBeamIntersection(
	y: number,
	width: number,
	polygonPoints: number[]
): number[] {
	if (polygonPoints.length < 6) return [];

	const topY = y;
	const bottomY = y + width;

	// Bounding Box des Polygons holen
	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return [];

	// Schnittpunkte der oberen Linie mit dem Polygon (innerhalb der Bounding Box)
	const topIntersections = linePolygonIntersections(
		bbox.minX - 1000,
		topY,
		bbox.maxX + 1000,
		topY,
		polygonPoints
	);

	// Schnittpunkte der unteren Linie mit dem Polygon (innerhalb der Bounding Box)
	const bottomIntersections = linePolygonIntersections(
		bbox.minX - 1000,
		bottomY,
		bbox.maxX + 1000,
		bottomY,
		polygonPoints
	);

	// Wenn keine Schnittpunkte existieren, leeres Array zurückgeben
	if (topIntersections.length === 0 && bottomIntersections.length === 0) return [];

	// Schnittpunkte sortieren
	topIntersections.sort((a, b) => a - b);
	bottomIntersections.sort((a, b) => a - b);

	// Polygon bilden: von links nach rechts auf der oberen Kante, dann zurück auf der unteren
	const polygon: number[] = [];
	for (const x of topIntersections) {
		polygon.push(x, topY);
	}
	for (let i = bottomIntersections.length - 1; i >= 0; i--) {
		polygon.push(bottomIntersections[i], bottomY);
	}

	return polygon;
}

/**
 * Berechnet die Positionen der Bodenkrallen.
 * Randbodenkrallen (grün) werden am linken und rechten Rand der Balkonfläche platziert.
 * Innere Bodenkrallen (hellblau) werden an den vertikalen Dielenrändern platziert.
 * @param plankWidth Breite der Dielen in mm
 * @param startFrom Verlegerichtung ('left' oder 'right')
 * @param polygonPoints Punkte des Balkon-Polygons
 * @param crossBeams Liste der Querbalken
 * @returns Array von Bodenkrallen-Positionen mit x, y und isEdge (true für Rand, false für innen)
 */
export function calculateFloorClawPositions(
	plankWidth: number,
	startFrom: 'left' | 'right',
	polygonPoints: number[],
	crossBeams: CrossBeam[]
): { x: number; y: number; isEdge: boolean }[] {
	if (polygonPoints.length < 6) return [];
	if (crossBeams.length === 0) return [];

	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return [];

	const positions: { x: number; y: number; isEdge: boolean }[] = [];

	// Sammle alle X-Positionen für innere Bodenkrallen (N * Dielenbreite)
	const innerXPositions: number[] = [];

	let startX = startFrom === 'left' ? bbox.minX : bbox.maxX;
	const endX = startFrom === 'left' ? bbox.maxX : bbox.minX;
	const step = startFrom === 'left' ? plankWidth : -plankWidth;

	let currentX = startX + step; // Start nach dem ersten Rand
	while ((startFrom === 'left' && currentX < endX) || (startFrom === 'right' && currentX > endX)) {
		innerXPositions.push(currentX);
		currentX += step;
	}

	// Für jeden Querbalken Bodenkrallen hinzufügen
	for (const beam of crossBeams) {
		const beamY = beam.y + beam.width / 2; // Mittig auf dem Querbalken

		// Linke Randbodenkralle (grün) am linken Polygon-Rand
		// Finde den tatsächlichen linken Rand bei dieser Y-Position
		const leftEdge = findPolygonEdgeAtY(beamY, polygonPoints, 'left');
		if (leftEdge !== null) {
			positions.push({ x: leftEdge, y: beamY, isEdge: true });
		}

		// Rechte Randbodenkralle (grün) am rechten Polygon-Rand
		// Finde den tatsächlichen rechten Rand bei dieser Y-Position
		const rightEdge = findPolygonEdgeAtY(beamY, polygonPoints, 'right');
		if (rightEdge !== null) {
			positions.push({ x: rightEdge, y: beamY, isEdge: true });
		}

		// Innere Bodenkrallen (hellblau) an den Dielenrändern
		for (const x of innerXPositions) {
			if (pointInPolygon(x, beamY, polygonPoints)) {
				// Sonderfall: Prüfe ob Abstand zu Randbodenkralle < 1/2 Dielenbreite
				const minDistance = plankWidth / 2;
				let tooClose = false;

				if (leftEdge !== null && Math.abs(x - leftEdge) < minDistance) {
					tooClose = true;
				}
				if (rightEdge !== null && Math.abs(x - rightEdge) < minDistance) {
					tooClose = true;
				}

				if (!tooClose) {
					positions.push({ x, y: beamY, isEdge: false });
				}
			}
		}
	}

	return positions;
}

/**
 * Findet den linken oder rechten Rand des Polygons bei einer bestimmten Y-Position.
 * @param y Y-Position
 * @param polygonPoints Punkte des Polygons
 * @param side 'left' oder 'right'
 * @returns X-Position des Randes oder null
 */
function findPolygonEdgeAtY(
	y: number,
	polygonPoints: number[],
	side: 'left' | 'right'
): number | null {
	if (polygonPoints.length < 6) return null;

	const bbox = getBoundingBox(polygonPoints);
	if (!bbox) return null;

	const intersections = linePolygonIntersections(
		bbox.minX - 1000,
		y,
		bbox.maxX + 1000,
		y,
		polygonPoints
	);

	if (intersections.length === 0) return null;

	intersections.sort((a, b) => a - b);

	// Linke oder rechte Position zurückgeben
	return side === 'left' ? intersections[0] : intersections[intersections.length - 1];
}

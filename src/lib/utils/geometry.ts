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

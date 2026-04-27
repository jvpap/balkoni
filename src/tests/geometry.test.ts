import { describe, it, expect } from 'vitest';
import {
	calculatePolygonArea,
	pointInPolygon,
	linePolygonIntersections,
	getBoundingBox
} from '$lib/utils/geometry';

describe('calculatePolygonArea', () => {
	it('liefert 0 für weniger als 3 Punkte', () => {
		expect(calculatePolygonArea([])).toBe(0);
		expect(calculatePolygonArea([0, 0])).toBe(0);
		expect(calculatePolygonArea([0, 0, 100, 100])).toBe(0);
	});

	it('berechnet ein Quadrat 100×100 mm² → 100 cm²', () => {
		// 100 mm × 100 mm = 10000 mm² = 100 cm²
		const square = [0, 0, 100, 0, 100, 100, 0, 100];
		expect(calculatePolygonArea(square)).toBe(100);
	});

	it('berechnet ein Rechteck 1000×500 mm² → 5000 cm²', () => {
		const rect = [0, 0, 1000, 0, 1000, 500, 0, 500];
		expect(calculatePolygonArea(rect)).toBe(5000);
	});

	it('liefert die gleiche Fläche unabhängig von der Wickelrichtung', () => {
		const cw = [0, 0, 100, 0, 100, 100, 0, 100];
		const ccw = [0, 0, 0, 100, 100, 100, 100, 0];
		expect(calculatePolygonArea(cw)).toBe(calculatePolygonArea(ccw));
	});

	it('berechnet ein L-förmiges Polygon korrekt', () => {
		// L-Shape (in mm): außen 200×200, mit ausgeschnittenem 100×100 oben rechts
		// Fläche = 200·200 - 100·100 = 30000 mm² = 300 cm²
		const lShape = [0, 0, 200, 0, 200, 100, 100, 100, 100, 200, 0, 200];
		expect(calculatePolygonArea(lShape)).toBe(300);
	});
});

describe('pointInPolygon', () => {
	const square = [0, 0, 100, 0, 100, 100, 0, 100];

	it('erkennt Punkte innerhalb', () => {
		expect(pointInPolygon(50, 50, square)).toBe(true);
		expect(pointInPolygon(1, 1, square)).toBe(true);
	});

	it('erkennt Punkte außerhalb', () => {
		expect(pointInPolygon(150, 50, square)).toBe(false);
		expect(pointInPolygon(-10, 50, square)).toBe(false);
		expect(pointInPolygon(50, 200, square)).toBe(false);
	});

	it('liefert false für entartete Polygone', () => {
		expect(pointInPolygon(0, 0, [])).toBe(false);
		expect(pointInPolygon(0, 0, [0, 0, 1, 1])).toBe(false);
	});
});

describe('linePolygonIntersections', () => {
	const square = [0, 0, 100, 0, 100, 100, 0, 100];

	it('liefert die zwei X-Schnittpunkte für eine horizontale Linie durch ein Quadrat', () => {
		const ints = linePolygonIntersections(-10, 50, 110, 50, square);
		expect(ints).toEqual([0, 100]);
	});

	it('liefert die zwei Y-Schnittpunkte für eine vertikale Linie durch ein Quadrat', () => {
		const ints = linePolygonIntersections(50, -10, 50, 110, square);
		expect(ints).toEqual([0, 100]);
	});

	it('sortiert die Schnittpunkte aufsteigend', () => {
		// L-Shape, horizontale Linie y=150 schneidet links 0..100
		const lShape = [0, 0, 200, 0, 200, 100, 100, 100, 100, 200, 0, 200];
		const ints = linePolygonIntersections(-10, 150, 210, 150, lShape);
		expect(ints[0]).toBeLessThanOrEqual(ints[ints.length - 1]);
	});

	it('liefert leeres Array für entartete Polygone', () => {
		expect(linePolygonIntersections(0, 0, 100, 0, [])).toEqual([]);
	});
});

describe('getBoundingBox', () => {
	it('liefert null für entartete Polygone', () => {
		expect(getBoundingBox([])).toBeNull();
	});

	it('berechnet die korrekte Bounding-Box', () => {
		const poly = [10, 20, 100, 20, 100, 200, 10, 200];
		expect(getBoundingBox(poly)).toEqual({ minX: 10, minY: 20, maxX: 100, maxY: 200 });
	});

	it('arbeitet auch mit negativen Koordinaten', () => {
		const poly = [-50, -50, 50, -50, 50, 50, -50, 50];
		expect(getBoundingBox(poly)).toEqual({ minX: -50, minY: -50, maxX: 50, maxY: 50 });
	});
});

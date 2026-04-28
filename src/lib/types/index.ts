export interface Plank {
	x: number;
	y: number;
	width: number;
	height: number;
	length: number;
	actualLength: number;
	waste: number;
}

export interface PlanState {
	polygonPoints: number[];
	isDrawingPolygon: boolean;
	plankWidth: number;
	plankLengths: number[];
	placedPlanks: Plank[];
	totalWaste: number;
	totalPlankArea: number;
	mouseX: number;
	mouseY: number;
	selectedPointIndex: number;
	startFrom: 'left' | 'right';
	generatedPlanks: Plank[];
	selectedPlankIndex: number;
	sawKerf: number; // Sägeschnitt-Breite in mm
	cuttable: boolean; // Dielen dürfen zugeschnitten werden
	globalOptimization: boolean; // ILP-basierte globale Optimierung verwenden
}

export const CONSTANTS = {
	SCALE: 2, // 1 cm = 2 Pixel
	PIXEL_TO_CM: 0.5, // 1 Pixel = 0.5 cm
	CANVAS_WIDTH: 900,
	CANVAS_HEIGHT: 700
} as const;

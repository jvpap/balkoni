export function createCoordinateConverter(
	widthMeters: number,
	heightMeters: number,
	pixelWidth: number,
	pixelHeight: number
) {
	return {
		pxToMM_X: (px: number) => (px / pixelWidth) * widthMeters * 1000,
		pxToMM_Y: (px: number) => (px / pixelHeight) * heightMeters * 1000,
		mmToPx_X: (mm: number) => (mm / 1000 / widthMeters) * pixelWidth,
		mmToPx_Y: (mm: number) => (mm / 1000 / heightMeters) * pixelHeight
	};
}

export type CoordinateConverter = ReturnType<typeof createCoordinateConverter>;

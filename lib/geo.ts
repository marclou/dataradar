/**
 * Convert lat/lng to x/y position on the radar circle.
 * Maps world coordinates to a unit circle (0-1 range for x and y).
 * Uses Mercator-like projection centered on the radar.
 */
export function geoToRadar(lat: number, lng: number, size: number): { x: number; y: number } {
	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 - 8;

	// Normalize longitude (-180..180) to (-1..1)
	const nx = lng / 180;
	// Normalize latitude (-90..90) to (-1..1), flip y
	const ny = -lat / 90;

	const scale = 0.85;
	const px = cx + nx * radius * scale;
	const py = cy + ny * radius * scale * 0.6;

	return { x: px, y: py };
}

/**
 * Check if a point is within the radar sweep cone.
 * The sweep is a wedge of ~30 degrees.
 */
export function isInSweep(
	dotX: number,
	dotY: number,
	centerX: number,
	centerY: number,
	sweepAngleDeg: number,
	coneWidthDeg: number = 30,
): boolean {
	const dx = dotX - centerX;
	const dy = dotY - centerY;
	let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
	if (angle < 0) angle += 360;

	let sweep = sweepAngleDeg % 360;
	if (sweep < 0) sweep += 360;

	let diff = angle - sweep;
	if (diff < -180) diff += 360;
	if (diff > 180) diff -= 360;

	return diff >= -coneWidthDeg / 2 && diff <= coneWidthDeg / 2;
}

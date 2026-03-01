import { geoNaturalEarth1 } from "d3-geo";

/**
 * Convert lat/lng to x/y on the radar using the same
 * Natural Earth projection as the map canvas.
 */
export function geoToRadar(lat: number, lng: number, size: number): { x: number; y: number } {
	const cx = size / 2;
	const cy = size / 2;
	const mapR = size / 2 - 16 - 4; // matches RadarScope: r - 4

	const projection = geoNaturalEarth1()
		.translate([cx, cy])
		.scale(mapR / 1.9);

	const point = projection([lng, lat]);
	if (!point) return { x: cx, y: cy };
	return { x: point[0], y: point[1] };
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

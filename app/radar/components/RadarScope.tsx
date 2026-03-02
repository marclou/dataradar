"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Visitor } from "@/lib/types";
import { geoToRadar } from "@/lib/geo";
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

const DEFAULT_RADAR_SIZE = 440;
const SWEEP_SPEED = 90;
const DOT_BRIGHT_DURATION = 1200;
const DOT_FADE_DURATION = 2200;

interface DotState {
	x: number;
	y: number;
	hitTime: number;
	visitor: Visitor;
}

export default function RadarScope({
	visitors,
	onSelectVisitor,
	size = DEFAULT_RADAR_SIZE,
	paused = false,
}: {
	visitors: Visitor[];
	onSelectVisitor?: (v: Visitor) => void;
	size?: number;
	paused?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dotsRef = useRef<Map<string, DotState>>(new Map());
	const sweepAngleRef = useRef(0);
	const animFrameRef = useRef<number>(0);
	const lastTimeRef = useRef(0);
	const landRef = useRef<GeoPermissibleObjects | null>(null);
	const mapCacheRef = useRef<OffscreenCanvas | null>(null);
	const mapVersion = useRef(0);

	// Load world atlas once
	useEffect(() => {
		fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
			.then((r) => r.json())
			.then((topo: Topology<{ countries: GeometryCollection }>) => {
				const countries = feature(topo, topo.objects.countries);
				if ("features" in countries) {
					countries.features = countries.features.filter((f) => f.id !== "010");
				}
				landRef.current = countries;
				mapCacheRef.current = null;
				mapVersion.current++;
			})
			.catch(() => {});
	}, []);

	// Pre-render static map layers to offscreen canvas
	useEffect(() => {
		const land = landRef.current;
		if (!land) return;

		const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
		const w = size;
		const cx = w / 2;
		const cy = w / 2;
		const r = w / 2 - 16;

		const offscreen = new OffscreenCanvas(w * dpr, w * dpr);
		const ctx = offscreen.getContext("2d");
		if (!ctx) return;
		ctx.scale(dpr, dpr);

		// Outer bezel ring
		ctx.beginPath();
		ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
		ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
		ctx.lineWidth = 0.5;
		ctx.stroke();

		// Background circle
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fillStyle = "#0a0a0a";
		ctx.fill();
		ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// Compass ticks
		const bezelR = r + 12;
		for (let deg = 0; deg < 360; deg += 2) {
			const rad = (deg * Math.PI) / 180;
			const isMajor = deg % 30 === 0;
			const isMedium = deg % 10 === 0;
			const tickLen = isMajor ? 8 : isMedium ? 5 : 2.5;
			ctx.beginPath();
			ctx.moveTo(cx + Math.cos(rad) * (bezelR - tickLen), cy + Math.sin(rad) * (bezelR - tickLen));
			ctx.lineTo(cx + Math.cos(rad) * bezelR, cy + Math.sin(rad) * bezelR);
			ctx.strokeStyle = isMajor ? "rgba(34, 211, 238, 0.2)" : isMedium ? "rgba(34, 211, 238, 0.15)" : "rgba(34, 211, 238, 0.1)";
			ctx.lineWidth = isMajor ? 1 : 0.5;
			ctx.stroke();
		}

		// Concentric circles
		for (let i = 1; i <= 4; i++) {
			ctx.beginPath();
			ctx.arc(cx, cy, (r * i) / 5, 0, Math.PI * 2);
			ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
			ctx.lineWidth = 0.5;
			ctx.stroke();
		}

		// Crosshair + diagonals
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
		ctx.clip();
		ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
		ctx.lineWidth = 0.5;
		ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
		const diag = r * 0.707;
		ctx.beginPath(); ctx.moveTo(cx - diag, cy - diag); ctx.lineTo(cx + diag, cy + diag); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(cx + diag, cy - diag); ctx.lineTo(cx - diag, cy + diag); ctx.stroke();
		ctx.restore();

		// World map
		const mapR = r - 4;
		const projection = geoNaturalEarth1().translate([cx, cy]).scale(mapR / 1.9);
		const pathGen = geoPath(projection, ctx);

		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
		ctx.clip();
		ctx.beginPath();
		pathGen(land);
		ctx.fillStyle = "rgba(34, 211, 238, 0.03)";
		ctx.fill();
		ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
		ctx.lineWidth = 0.8;
		ctx.lineJoin = "round";
		ctx.stroke();
		ctx.restore();

		mapCacheRef.current = offscreen;
	}, [size, mapVersion.current]);

	useEffect(() => {
		const currentDots = dotsRef.current;
		const newMap = new Map<string, DotState>();
		for (const v of visitors) {
			const pos = geoToRadar(v.latitude, v.longitude, size);
			const existing = currentDots.get(v.id);
			newMap.set(v.id, {
				x: pos.x,
				y: pos.y,
				hitTime: existing?.hitTime || 0,
				visitor: v,
			});
		}
		dotsRef.current = newMap;
	}, [visitors, size]);

	const draw = useCallback(
		(timestamp: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
			lastTimeRef.current = timestamp;

			sweepAngleRef.current = (sweepAngleRef.current + SWEEP_SPEED * dt) % 360;
			const sweepRad = (sweepAngleRef.current * Math.PI) / 180;

			const dpr = window.devicePixelRatio || 1;
			const w = size;
			const h = size;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.scale(dpr, dpr);

			const cx = w / 2;
			const cy = h / 2;
			const r = w / 2 - 16;

			ctx.clearRect(0, 0, w, h);

			// Draw cached static layers (map, grid, compass, etc.)
			if (mapCacheRef.current) {
				ctx.drawImage(mapCacheRef.current, 0, 0, w, h);
			}

			// Sweep cone (dynamic — rotates each frame)
			const trailSpan = 0.4;
			const sweepGrad = ctx.createConicGradient(sweepRad, cx, cy);
			sweepGrad.addColorStop(0, "rgba(34, 211, 238, 0.24)");
			sweepGrad.addColorStop(0.001, "rgba(34, 211, 238, 0)");
			sweepGrad.addColorStop(1 - trailSpan, "rgba(34, 211, 238, 0)");
			sweepGrad.addColorStop(1 - trailSpan * 0.7, "rgba(34, 211, 238, 0.02)");
			sweepGrad.addColorStop(1 - trailSpan * 0.4, "rgba(34, 211, 238, 0.06)");
			sweepGrad.addColorStop(1 - trailSpan * 0.15, "rgba(34, 211, 238, 0.13)");
			sweepGrad.addColorStop(1, "rgba(34, 211, 238, 0.24)");
			ctx.beginPath();
			ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
			ctx.fillStyle = sweepGrad;
			ctx.fill();

			// Bright revealed map layer (dynamic — follows sweep)
			if (landRef.current) {
				const mapR = r - 4;
				const projection = geoNaturalEarth1().translate([cx, cy]).scale(mapR / 1.9);
				const pathGen = geoPath(projection, ctx);
				ctx.save();
				ctx.beginPath();
				ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
				ctx.clip();
				const mapTrailSpan = 0.45;
				const mapGrad = ctx.createConicGradient(sweepRad, cx, cy);
				mapGrad.addColorStop(0, "rgba(34, 211, 238, 0.35)");
				mapGrad.addColorStop(0.001, "rgba(34, 211, 238, 0)");
				mapGrad.addColorStop(1 - mapTrailSpan, "rgba(34, 211, 238, 0)");
				mapGrad.addColorStop(1 - mapTrailSpan * 0.5, "rgba(34, 211, 238, 0.08)");
				mapGrad.addColorStop(1 - mapTrailSpan * 0.2, "rgba(34, 211, 238, 0.2)");
				mapGrad.addColorStop(1, "rgba(34, 211, 238, 0.35)");
				ctx.beginPath();
				pathGen(landRef.current);
				ctx.strokeStyle = mapGrad;
				ctx.lineWidth = 1;
				ctx.lineJoin = "round";
				ctx.stroke();
				ctx.restore();
			}

			// Sweep line
			const lineX = cx + Math.cos(sweepRad) * r;
			const lineY = cy + Math.sin(sweepRad) * r;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(lineX, lineY);
			ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
			ctx.lineWidth = 1.5;
			ctx.stroke();

			// Dots
			const now = timestamp;
			dotsRef.current.forEach((dot) => {
				const dx = dot.x - cx;
				const dy = dot.y - cy;
				let dotAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
				if (dotAngle < 0) dotAngle += 360;

				const sweepDeg = sweepAngleRef.current;
				let diff = dotAngle - sweepDeg;
				if (diff < -180) diff += 360;
				if (diff > 180) diff -= 360;

				if (Math.abs(diff) < 8) {
					dot.hitTime = now;
				}

				const elapsed = now - dot.hitTime;
				let opacity: number;

				if (dot.hitTime === 0) {
					opacity = 0.15;
				} else if (elapsed < DOT_BRIGHT_DURATION) {
					opacity = 1;
				} else if (elapsed < DOT_BRIGHT_DURATION + DOT_FADE_DURATION) {
					const fadeProgress = (elapsed - DOT_BRIGHT_DURATION) / DOT_FADE_DURATION;
					opacity = 1 - fadeProgress * 0.85;
				} else {
					opacity = 0.15;
				}

				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist > r - 6) return;

				// Ping ring
				if (dot.hitTime > 0 && elapsed < 600) {
					const ringProgress = elapsed / 600;
					ctx.beginPath();
					ctx.arc(dot.x, dot.y, 3 + ringProgress * 12, 0, Math.PI * 2);
					ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 * (1 - ringProgress)})`;
					ctx.lineWidth = 1;
					ctx.stroke();
				}

				// Glow
				if (opacity > 0.3) {
					const glowGrad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 10);
					glowGrad.addColorStop(0, `rgba(34, 211, 238, ${opacity * 0.3})`);
					glowGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
					ctx.beginPath();
					ctx.arc(dot.x, dot.y, 10, 0, Math.PI * 2);
					ctx.fillStyle = glowGrad;
					ctx.fill();
				}

				// Dot
				ctx.beginPath();
				ctx.arc(dot.x, dot.y, dot.visitor.isCustomer ? 3.5 : 2.5, 0, Math.PI * 2);
				ctx.fillStyle = dot.visitor.isCustomer
					? `rgba(250, 204, 21, ${opacity})`
					: `rgba(34, 211, 238, ${opacity})`;
				ctx.fill();
			});

			// Center dot
			ctx.beginPath();
			ctx.arc(cx, cy, 2, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(34, 211, 238, 0.6)";
			ctx.fill();

			animFrameRef.current = requestAnimationFrame(draw);
		},
		[size],
	);

	useEffect(() => {
		if (paused) {
			cancelAnimationFrame(animFrameRef.current);
			return;
		}
		lastTimeRef.current = 0;
		animFrameRef.current = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(animFrameRef.current);
	}, [draw, paused]);

	function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
		if (!onSelectVisitor) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const scaleX = size / rect.width;
		const scaleY = size / rect.height;
		const mx = (e.clientX - rect.left) * scaleX;
		const my = (e.clientY - rect.top) * scaleY;

		let closest: DotState | null = null;
		let closestDist = 20;

		dotsRef.current.forEach((dot) => {
			const d = Math.sqrt((dot.x - mx) ** 2 + (dot.y - my) ** 2);
			if (d < closestDist) {
				closestDist = d;
				closest = dot;
			}
		});

		if (closest) onSelectVisitor((closest as DotState).visitor);
	}

	return (
		<div className="relative aspect-square" style={{ width: `min(${size}px, 85vw)` }}>
			<div
				className="absolute -inset-3 rounded-full"
				style={{
					background: "radial-gradient(circle, transparent 65%, rgba(34,211,238,0.03) 100%)",
				}}
			/>
			<canvas
				ref={canvasRef}
				width={size}
				height={size}
				onClick={onSelectVisitor ? handleClick : undefined}
				className={`relative rounded-full w-full h-full ${
					onSelectVisitor ? "cursor-crosshair" : "cursor-default"
				}`}
			/>
		</div>
	);
}

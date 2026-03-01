"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { Visitor } from "@/lib/types";
import { geoToRadar } from "@/lib/geo";
import { WORLD_OUTLINES } from "@/lib/world-map";

const RADAR_SIZE = 440;
const SWEEP_SPEED = 90; // degrees per second (full rotation = 4s)
const DOT_BRIGHT_DURATION = 1200; // ms a dot stays bright after sweep
const DOT_FADE_DURATION = 2200; // ms it takes to fade after bright phase

interface DotState {
  x: number;
  y: number;
  hitTime: number;
  visitor: Visitor;
}

export default function RadarScope({
  visitors,
  onSelectVisitor,
}: {
  visitors: Visitor[];
  onSelectVisitor: (v: Visitor) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Map<string, DotState>>(new Map());
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // Update dot positions when visitors change
  useEffect(() => {
    const currentDots = dotsRef.current;
    const newMap = new Map<string, DotState>();

    for (const v of visitors) {
      const pos = geoToRadar(v.latitude, v.longitude, RADAR_SIZE);
      const existing = currentDots.get(v.id);
      newMap.set(v.id, {
        x: pos.x,
        y: pos.y,
        hitTime: existing?.hitTime || 0,
        visitor: v,
      });
    }

    dotsRef.current = newMap;
  }, [visitors]);

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
      const w = RADAR_SIZE;
      const h = RADAR_SIZE;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const cx = w / 2;
      const cy = h / 2;
      const r = w / 2 - 16;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Compass tick marks (outside the circle)
      for (let deg = 0; deg < 360; deg += 2) {
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 30 === 0;
        const isMedium = deg % 10 === 0;
        const tickLen = isMajor ? 8 : isMedium ? 5 : 2.5;
        const innerR = r + 2;
        const outerR = r + 2 + tickLen;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rad) * innerR, cy + Math.sin(rad) * innerR);
        ctx.lineTo(cx + Math.cos(rad) * outerR, cy + Math.sin(rad) * outerR);
        ctx.strokeStyle = isMajor
          ? "rgba(34, 211, 238, 0.25)"
          : isMedium
          ? "rgba(34, 211, 238, 0.12)"
          : "rgba(34, 211, 238, 0.05)";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.stroke();
      }

      // Grid circles
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.05)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Cross lines
      ctx.strokeStyle = "rgba(34, 211, 238, 0.04)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Helper: draw all world map polylines
      function drawMapLines() {
        for (const polyline of WORLD_OUTLINES) {
          if (polyline.length < 2) continue;
          ctx.beginPath();
          for (let i = 0; i < polyline.length; i++) {
            const [lat, lng] = polyline[i];
            const pos = geoToRadar(lat, lng, RADAR_SIZE);
            if (i === 0) ctx.moveTo(pos.x, pos.y);
            else ctx.lineTo(pos.x, pos.y);
          }
          ctx.stroke();
        }
      }

      // World map — dim base layer (always visible)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      drawMapLines();
      ctx.restore();

      // Sweep cone (gradient trail — bright at sweep line, fading behind)
      const trailSpan = 0.15;
      const sweepGrad = ctx.createConicGradient(sweepRad, cx, cy);
      sweepGrad.addColorStop(0, "rgba(34, 211, 238, 0.12)");
      sweepGrad.addColorStop(0.001, "rgba(34, 211, 238, 0)");
      sweepGrad.addColorStop(1 - trailSpan, "rgba(34, 211, 238, 0)");
      sweepGrad.addColorStop(1 - trailSpan * 0.6, "rgba(34, 211, 238, 0.01)");
      sweepGrad.addColorStop(1 - trailSpan * 0.3, "rgba(34, 211, 238, 0.04)");
      sweepGrad.addColorStop(1 - trailSpan * 0.1, "rgba(34, 211, 238, 0.08)");
      sweepGrad.addColorStop(1, "rgba(34, 211, 238, 0.12)");

      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // World map — bright revealed layer (clipped to sweep trail)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.clip();
      const mapTrailSpan = 0.25; // wider reveal than the sweep cone
      const mapGrad = ctx.createConicGradient(sweepRad, cx, cy);
      mapGrad.addColorStop(0, "rgba(34, 211, 238, 0.35)");
      mapGrad.addColorStop(0.001, "rgba(34, 211, 238, 0)");
      mapGrad.addColorStop(1 - mapTrailSpan, "rgba(34, 211, 238, 0)");
      mapGrad.addColorStop(1 - mapTrailSpan * 0.5, "rgba(34, 211, 238, 0.08)");
      mapGrad.addColorStop(1 - mapTrailSpan * 0.2, "rgba(34, 211, 238, 0.2)");
      mapGrad.addColorStop(1, "rgba(34, 211, 238, 0.35)");
      ctx.strokeStyle = mapGrad;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = "round";
      drawMapLines();
      ctx.restore();

      // Sweep line (bright edge)
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
        // Check if sweep is hitting this dot
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

        // Distance from center for clipping
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r - 6) return;

        // Ping ring when just hit
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
          const glowGrad = ctx.createRadialGradient(
            dot.x, dot.y, 0,
            dot.x, dot.y, 10
          );
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
    []
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Force re-render periodically to keep React in sync
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = RADAR_SIZE / rect.width;
    const scaleY = RADAR_SIZE / rect.height;
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
    <div className="relative w-[min(440px,85vw)] aspect-square">
      {/* Outer ring decoration */}
      <div
        className="absolute -inset-3 rounded-full"
        style={{
          background:
            "radial-gradient(circle, transparent 65%, rgba(34,211,238,0.03) 100%)",
        }}
      />
      <canvas
        ref={canvasRef}
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        onClick={handleClick}
        className="relative rounded-full cursor-crosshair w-full h-full"
      />
    </div>
  );
}

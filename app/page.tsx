"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { DEMO_API_KEY, DEMO_POLL_INTERVAL_MS } from "@/lib/constants";
import { fetchRadarData } from "@/lib/fetch-radar";
import type { RadarPayload, Visitor } from "@/lib/types";
import marcPic from "@/app/marc.png";
import RadarScope from "@/app/radar/components/RadarScope";
import VisitorCard from "@/app/radar/components/VisitorCard";
import EventFeed from "@/app/radar/components/EventFeed";

const DOWNLOAD_URL = "/api/download";
const GITHUB_RELEASE = "https://github.com/marclou/dataradar/releases/latest";

export default function HomePage() {
	const [data, setData] = useState<RadarPayload | null>(null);
	const [selected, setSelected] = useState<Visitor | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

	const poll = useCallback(async () => {
		try {
			const payload = await fetchRadarData(DEMO_API_KEY);
			setData(payload);
		} catch {}
	}, []);

	useEffect(() => {
		poll();
		intervalRef.current = setInterval(poll, DEMO_POLL_INTERVAL_MS);
		return () => clearInterval(intervalRef.current);
	}, [poll]);

	return (
		<div className="min-h-dvh flex flex-col items-center relative overflow-hidden">
			{/* Ambient BG */}
			<div className="pointer-events-none fixed inset-0">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
			</div>

			{/* Hero */}
			<div className="relative z-10 flex flex-col items-center pt-12 sm:pt-16 pb-6 px-4">
				<h1 className="font-[family-name:var(--font-mono)] text-4xl sm:text-6xl font-bold tracking-[0.15em] uppercase bg-gradient-to-b from-white via-cyan-200 to-cyan-500/60 bg-clip-text text-transparent mb-3 text-center">
					DATARADAR
				</h1>
				<p className="text-stone-400 text-center text-sm sm:text-base sm:text-[1.06rem] max-w-[410px] leading-relaxed mb-6">
					A real-time visitor radar for your website. Watch visitors light up as the scanner sweeps across the
					map.
				</p>

				{/* Download CTA */}
				<a
					href={DOWNLOAD_URL}
					className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-colors"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Download for macOS
				</a>
			</div>

			{/* Live demo */}
			<div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 pb-8 w-full max-w-6xl">
				{/* Radar */}
				<div className="flex flex-col items-center gap-4">
					{data ? (
						<RadarScope visitors={data.visitors} onSelectVisitor={(v) => setSelected(v)} />
					) : (
						<div className="w-[min(440px,85vw)] aspect-square rounded-full border border-stone-800/50 flex items-center justify-center">
							<div className="flex flex-col items-center gap-3">
								<div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
								<span className="text-xs text-stone-600">Loading demo...</span>
							</div>
						</div>
					)}
				</div>

				{/* Side panel */}
				<div className="flex flex-col items-center lg:items-start gap-6 min-w-[280px]">
					{selected && <VisitorCard visitor={selected} onClose={() => setSelected(null)} />}
					{data && (
						<EventFeed
							events={data.recentEvents}
							payments={data.recentPayments}
							visitorCount={data.count}
						/>
					)}
				</div>
			</div>

			{/* Footer */}
			<footer className="relative z-10 pb-6 flex flex-col items-center gap-3">
				<p className="text-stone-700 text-[12px]">
					Powered by{" "}
					<a href="https://datafa.st" className="text-stone-600 hover:text-stone-400 transition-colors">
						DataFast
					</a>
				</p>
			</footer>

			{/* Creator badge */}
			<a
				href="https://x.com/marclou"
				target="_blank"
				rel="noopener noreferrer"
				className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-stone-400 hover:text-stone-200 transition-colors z-20"
			>
				<Image
					src={marcPic}
					alt="Marc Lou"
					width={20}
					height={20}
					className="w-5 h-5 rounded-full object-cover"
				/>
				by Marc Lou
			</a>
		</div>
	);
}

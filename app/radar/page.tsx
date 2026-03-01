"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LS_KEY, DEMO_API_KEY, POLL_INTERVAL_MS } from "@/lib/constants";
import { fetchRadarData, fetchSiteMetadata } from "@/lib/fetch-radar";
import type { RadarPayload, Visitor, SiteMetadata } from "@/lib/types";
import marcPic from "@/app/marc.png";
import RadarScope from "./components/RadarScope";
import VisitorCard from "./components/VisitorCard";
import EventFeed from "./components/EventFeed";

export default function RadarPage() {
	const router = useRouter();
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [data, setData] = useState<RadarPayload | null>(null);
	const [site, setSite] = useState<SiteMetadata | null>(null);
	const [selected, setSelected] = useState<Visitor | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

	useEffect(() => {
		const key = localStorage.getItem(LS_KEY);
		if (!key) {
			router.replace("/");
			return;
		}
		setApiKey(key);
		fetchSiteMetadata(key).then(setSite);
	}, [router]);

	const poll = useCallback(async () => {
		if (!apiKey) return;
		try {
			const payload = await fetchRadarData(apiKey);
			setData(payload);
			setError("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch data");
		} finally {
			setLoading(false);
		}
	}, [apiKey]);

	useEffect(() => {
		if (!apiKey) return;
		poll();
		intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
		return () => clearInterval(intervalRef.current);
	}, [apiKey, poll]);

	function handleExit() {
		localStorage.removeItem(LS_KEY);
		router.replace("/");
	}

	if (!apiKey) return null;

	const isDemo = apiKey === DEMO_API_KEY;

	return (
		<div className="min-h-dvh flex flex-col items-center relative overflow-hidden">
			{/* Ambient BG */}
			<div className="pointer-events-none fixed inset-0">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/[0.02] blur-[120px]" />
			</div>

		{/* Header */}
		<header className="relative z-10 w-full flex items-center justify-between px-5 py-4">
			<div className="flex items-center gap-3">
				<h1 className="font-[family-name:var(--font-mono)] text-sm font-bold tracking-[0.15em] uppercase text-stone-300">
					DATARADAR
				</h1>
				{isDemo && (
					<span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
						demo
					</span>
				)}
				{site?.domain && (
					<>
						<span className="text-stone-700">·</span>
						<div className="flex items-center gap-2">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={site.logo || `/api/datafast/radar/favicon?domain=${site.domain}`}
								alt=""
								className="w-4 h-4 rounded"
								loading="lazy"
							/>
							<span className="text-xs text-stone-500">
								{site.name || site.domain}
							</span>
						</div>
					</>
				)}
			</div>
		<div className="flex items-center gap-4">
			<button
					onClick={handleExit}
					className="text-xs text-stone-600 hover:text-stone-400 transition-colors cursor-pointer"
				>
					Exit
				</button>
			</div>
		</header>

			{/* Main content */}
			<div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 pb-8 w-full max-w-6xl">
				{/* Radar */}
				<div className="flex flex-col items-center gap-6">
					{loading && !data ? (
						<div className="w-[min(440px,85vw)] aspect-square rounded-full border border-stone-800/50 flex items-center justify-center">
							<div className="flex flex-col items-center gap-3">
								<div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
								<span className="text-xs text-stone-600">Scanning...</span>
							</div>
						</div>
					) : data ? (
						<RadarScope visitors={data.visitors} onSelectVisitor={(v) => setSelected(v)} />
					) : null}

				</div>

				{/* Side panel */}
				<div className="flex flex-col items-center lg:items-start gap-6 min-w-[280px]">
					{error && <div className="text-sm text-red-400/80 glass rounded-xl px-4 py-3">{error}</div>}

					{selected ? <VisitorCard visitor={selected} onClose={() => setSelected(null)} /> : null}

					{data && <EventFeed events={data.recentEvents} payments={data.recentPayments} visitorCount={data.count} />}
				</div>
			</div>

			{/* Creator badge — demo only */}
			{isDemo && (
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
			)}

			{/* Powered by */}
			<footer className="relative z-10 pb-4">
				<p className="text-stone-700 text-[10px]">
					Powered by{" "}
					<a href="https://datafa.st" className="text-stone-600 hover:text-stone-400 transition-colors">
						DataFast
					</a>
				</p>
			</footer>
		</div>
	);
}

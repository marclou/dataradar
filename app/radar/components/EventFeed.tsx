/* eslint-disable @next/next/no-img-element */
"use client";

import type { RecentEvent, RecentPayment } from "@/lib/types";

function timeAgo(ts: string): string {
	const diff = Date.now() - new Date(ts).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "now";
	if (mins === 1) return "1m";
	return `${mins}m`;
}

export default function EventFeed({
	events,
	payments,
	visitorCount,
}: {
	events: RecentEvent[];
	payments: RecentPayment[];
	visitorCount: number;
}) {
	const combined = [
		...payments.map((p) => ({
			key: p.id,
			type: "payment" as const,
			ts: p.timestamp,
			data: p,
		})),
		...events.slice(0, 8).map((e) => ({
			key: e.id,
			type: "event" as const,
			ts: e.timestamp,
			data: e,
		})),
	].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

	if (combined.length === 0) return null;

	return (
		<div className="w-full max-w-xs space-y-1.5">
			<div className="flex items-center justify-between mb-2">
				{/* <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-600">
          Live feed
        </h3> */}
				<h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-600">
					{/* <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> */}
					{visitorCount} online
				</h3>
			</div>
			<div className="space-y-1">
				{combined.slice(0, 6).map((item, i) => (
					<div
						key={item.key}
						className="animate-fade-in-up flex items-center gap-2.5 py-1.5 px-3 rounded-lg text-xs"
						style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
					>
						{item.type === "payment" ? (
							<>
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
								<span className="text-emerald-400 font-[family-name:var(--font-mono)]">
									${(item.data as RecentPayment).amount}
								</span>
								<span className="text-stone-500 truncate">{(item.data as RecentPayment).name}</span>
								<span className="text-stone-700 ml-auto flex-shrink-0">{timeAgo(item.ts)}</span>
							</>
						) : (
							<>
								<span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 flex-shrink-0" />
								<img
									src={`/api/datafast/radar/favicon?flag=${(item.data as RecentEvent).countryCode}`}
									alt=""
									className="w-4 h-3 rounded-sm object-cover"
									loading="lazy"
								/>
								<span className="text-stone-400 font-[family-name:var(--font-mono)] truncate">
									{(item.data as RecentEvent).path}
								</span>
								<span className="text-stone-700 ml-auto flex-shrink-0">{timeAgo(item.ts)}</span>
							</>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

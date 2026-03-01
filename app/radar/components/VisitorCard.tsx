/* eslint-disable @next/next/no-img-element */
"use client";

import type { Visitor } from "@/lib/types";

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "tablet") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1m ago";
  return `${mins}m ago`;
}

export default function VisitorCard({
  visitor,
  onClose,
}: {
  visitor: Visitor;
  onClose: () => void;
}) {
  return (
    <div className="animate-card-slide-in glass rounded-2xl p-5 w-full max-w-xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Country flag */}
          <img
            src={`/api/datafast/radar/favicon?flag=${visitor.countryCode}`}
            alt={visitor.countryCode}
            className="w-8 h-6 rounded object-cover"
            loading="lazy"
          />
          <div>
            <p className="text-sm font-medium text-white">
              {visitor.city}
            </p>
            <p className="text-xs text-stone-500">{visitor.country}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-stone-600 hover:text-stone-400 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Page */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-stone-600">page</span>
        <span className="text-cyan-400 font-[family-name:var(--font-mono)] truncate">
          {visitor.page}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <DeviceIcon type={visitor.device} />
          <span className="capitalize">{visitor.device}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{visitor.browser}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          </svg>
          <span>{visitor.os}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{timeAgo(visitor.sessionStart)}</span>
        </div>
      </div>

      {/* Referrer */}
      {visitor.referrer && (
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-stone-800/50">
          <img
            src={`/api/datafast/radar/favicon?domain=${visitor.referrer}`}
            alt=""
            className="w-4 h-4 rounded"
            loading="lazy"
          />
          <span className="text-stone-500">via</span>
          <span className="text-stone-300">{visitor.referrer}</span>
        </div>
      )}

      {/* Customer badge */}
      {visitor.isCustomer && (
        <div className="flex items-center gap-1.5 text-xs text-yellow-400/80">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Existing customer · {visitor.visitCount} visits
        </div>
      )}
    </div>
  );
}

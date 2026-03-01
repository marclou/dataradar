"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import RadarScope from "@/app/radar/components/RadarScope";
import { LS_KEY, POLL_INTERVAL_MS } from "@/lib/constants";
import { fetchRadarData, fetchSiteMetadata } from "@/lib/fetch-radar";
import type { RadarPayload, SiteMetadata } from "@/lib/types";

const MENU_RADAR_SIZE = 320;

function isCredentialError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid api key") ||
    normalized.includes("website not found")
  );
}

export default function MenubarPage() {
  const [apiKey, setApiKey] = useState("");
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [data, setData] = useState<RadarPayload | null>(null);
  const [site, setSite] = useState<SiteMetadata | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const pollRadar = useCallback(async (key: string) => {
    const payload = await fetchRadarData(key);
    setData(payload);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return;
    setApiKey(stored);
    setActiveApiKey(stored);
  }, []);

  useEffect(() => {
    if (!activeApiKey) return;

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        await pollRadar(activeApiKey);
        if (!cancelled) setError("");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Request failed";
        if (isCredentialError(message)) {
          localStorage.removeItem(LS_KEY);
          setActiveApiKey(null);
          setApiKey("");
          setData(null);
          setSite(null);
        }
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    intervalRef.current = setInterval(run, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [activeApiKey, pollRadar]);

  useEffect(() => {
    if (!activeApiKey) return;

    let cancelled = false;

    fetchSiteMetadata(activeApiKey)
      .then((metadata) => {
        if (!cancelled) setSite(metadata);
      })
      .catch(() => {
        if (!cancelled) setSite({ domain: null, name: null, logo: null });
      });

    return () => {
      cancelled = true;
    };
  }, [activeApiKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const key = apiKey.trim();
    if (!key) {
      setError("API key required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await pollRadar(key);
      localStorage.setItem(LS_KEY, key);
      setActiveApiKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect");
    } finally {
      setLoading(false);
    }
  }

  if (!activeApiKey) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5">
        <form onSubmit={handleSubmit} className="w-full max-w-[320px] space-y-2">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="DataFast API key"
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-500 text-zinc-950 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Connecting..." : "Start radar"}
          </button>
          {error ? <p className="text-xs text-red-400/90 pt-1">{error}</p> : null}
        </form>
      </main>
    );
  }

  const liveCount = data?.count ?? data?.visitors.length ?? 0;
  const siteLabel = site?.name || site?.domain || "DataFast";
  const siteLogo =
    site?.logo || (site?.domain ? `/api/datafast/radar/favicon?domain=${site.domain}` : null);

  return (
    <main className="min-h-dvh flex flex-col overflow-hidden px-3 py-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {siteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteLogo}
              alt=""
              className="w-4 h-4 rounded-sm border border-cyan-500/20"
              loading="lazy"
            />
          ) : (
            <div className="w-4 h-4 rounded-sm border border-cyan-500/20 bg-cyan-500/10" />
          )}
          <span className="text-[11px] text-stone-300 truncate">{siteLabel}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 px-2 py-0.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-70 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
          </span>
          <span className="text-[11px] text-cyan-300 tabular-nums">{liveCount} online</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <RadarScope visitors={data?.visitors ?? []} size={MENU_RADAR_SIZE} />
      </div>
    </main>
  );
}

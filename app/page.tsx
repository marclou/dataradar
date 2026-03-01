"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEMO_API_KEY, LS_KEY } from "@/lib/constants";
import marcPic from "@/app/marc.png";

export default function HomePage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && stored !== DEMO_API_KEY) setApiKey(stored);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const key = apiKey.trim();
    if (!key) {
      setError("Please enter your API key");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/datafast/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Invalid API key");
      }
      localStorage.setItem(LS_KEY, key);
      router.push("/radar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    localStorage.setItem(LS_KEY, DEMO_API_KEY);
    router.push("/radar");
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-400/[0.02] blur-[80px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Title */}
        <h1 className="font-[family-name:var(--font-mono)] text-5xl sm:text-6xl font-bold tracking-[0.15em] uppercase bg-gradient-to-b from-white via-cyan-200 to-cyan-500/60 bg-clip-text text-transparent mb-3 text-center">
          DATARADAR
        </h1>

        {/* Tagline */}
        <p className="text-stone-400 text-center text-base sm:text-lg mb-10 max-w-xs leading-relaxed">
          Watch your website visitors light up on a live radar
        </p>

        {/* API key form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your DataFast API key"
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl font-[family-name:var(--font-mono)] text-sm text-white placeholder:text-stone-600 glass outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-cyan-500 text-black hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Connecting..." : "Launch radar"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-400/90 text-center animate-fade-in-up">
            {error}
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 w-full my-8">
          <div className="flex-1 h-px bg-stone-800" />
          <span className="text-stone-600 text-xs uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-stone-800" />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          className="text-stone-400 hover:text-white text-sm transition-colors cursor-pointer"
        >
          View a demo →
        </button>

        {/* How to get started */}
        <div className="mt-16 w-full">
          <h2 className="text-stone-500 text-xs uppercase tracking-widest mb-6 text-center">
            How to get started
          </h2>
          <ol className="space-y-5">
            {[
              {
                step: "1",
                text: (
                  <>
                    Create a free account on{" "}
                    <a
                      href="https://datafa.st"
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      DataFast
                    </a>
                  </>
                ),
              },
              {
                step: "2",
                text: "Add the tracking script to your website",
              },
              {
                step: "3",
                text: "Copy your API key from settings → API",
              },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border border-stone-700 flex items-center justify-center text-xs text-stone-400 font-[family-name:var(--font-mono)]">
                  {step}
                </span>
                <span className="text-stone-400 text-sm pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Powered by */}
        <p className="mt-14 text-stone-600 text-xs">
          Powered by{" "}
          <a
            href="https://datafa.st"
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            DataFast
          </a>
        </p>
      </main>

      {/* Creator badge */}
      <a
        href="https://x.com/marclou"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-stone-400 hover:text-stone-200 transition-colors"
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

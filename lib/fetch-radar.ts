import { DEMO_API_KEY } from "./constants";
import { getDemoPayload } from "./demo-data";
import type { RadarPayload, SiteMetadata } from "./types";

export async function fetchRadarData(apiKey: string): Promise<RadarPayload> {
  if (apiKey === DEMO_API_KEY) {
    return getDemoPayload();
  }

  const res = await fetch("/api/datafast/radar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const json = await res.json();
  return json.data as RadarPayload;
}

export async function fetchSiteMetadata(apiKey: string): Promise<SiteMetadata> {
  if (apiKey === DEMO_API_KEY) {
    return { domain: "demo.example.com", name: "Demo website", logo: null };
  }

  const res = await fetch("/api/datafast/radar/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) return { domain: null, name: null, logo: null };

  const json = await res.json();
  return json.data as SiteMetadata;
}

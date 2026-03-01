import type { RadarPayload } from "./types";

const cities = [
  { city: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194 },
  { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
  { city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lng: 13.405 },
  { city: "São Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lng: -46.6333 },
  { city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
  { city: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lng: 72.8777 },
  { city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lng: -79.3832 },
  { city: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lng: 126.978 },
  { city: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.5244, lng: 3.3792 },
  { city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lng: 4.9041 },
  { city: "Dubai", country: "UAE", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
  { city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lng: 18.0686 },
  { city: "Denver", country: "United States", countryCode: "US", lat: 39.7392, lng: -104.9903 },
  { city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018 },
  { city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4326, lng: -99.1332 },
];

const pages = ["/", "/pricing", "/blog", "/docs", "/about", "/dashboard", "/features", "/changelog", "/api", "/login"];
const referrers = [null, "google.com", "twitter.com", "reddit.com", "producthunt.com", "hackernews.com", "youtube.com", null];
const devices: ("desktop" | "mobile" | "tablet")[] = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];
const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Arc"];
const oses = ["Mac OS", "Windows", "iOS", "Android", "Linux"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function getDemoPayload(): RadarPayload {
  const visitorCount = 5 + Math.floor(Math.random() * 10);
  const usedCities = new Set<number>();
  const visitors = Array.from({ length: visitorCount }, () => {
    let idx: number;
    do { idx = Math.floor(Math.random() * cities.length); } while (usedCities.has(idx) && usedCities.size < cities.length);
    usedCities.add(idx);
    const c = cities[idx];
    const device = pick(devices);
    return {
      id: makeId(),
      city: c.city,
      country: c.country,
      countryCode: c.countryCode,
      latitude: c.lat + (Math.random() - 0.5) * 2,
      longitude: c.lng + (Math.random() - 0.5) * 2,
      page: pick(pages),
      referrer: pick(referrers),
      device,
      browser: device === "mobile" ? pick(["Safari", "Chrome"]) : pick(browsers),
      os: device === "mobile" ? pick(["iOS", "Android"]) : pick(oses),
      isCustomer: Math.random() > 0.85,
      sessionStart: new Date(Date.now() - Math.floor(Math.random() * 600_000)).toISOString(),
      visitCount: 1 + Math.floor(Math.random() * 8),
    };
  });

  const recentEvents = visitors.slice(0, 6).map((v) => ({
    id: makeId(),
    type: "pageview",
    visitorId: v.id,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 300_000)).toISOString(),
    path: v.page,
    countryCode: v.countryCode,
    referrer: v.referrer,
  }));

  const recentPayments = Math.random() > 0.5
    ? [
        {
          id: makeId(),
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 600_000)).toISOString(),
          name: pick(["Alex Kim", "Jordan Lee", "Sam Patel", "Maria Garcia"]),
          amount: pick([29, 49, 99, 199]),
          currency: "USD",
          isNew: Math.random() > 0.5,
        },
      ]
    : [];

  return { count: visitors.length, visitors, recentEvents, recentPayments };
}

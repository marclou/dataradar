import type { RadarPayload, Visitor } from "./types";

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
  { city: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006 },
  { city: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lng: -87.6298 },
  { city: "Miami", country: "United States", countryCode: "US", lat: 25.7617, lng: -80.1918 },
  { city: "Seattle", country: "United States", countryCode: "US", lat: 47.6062, lng: -122.3321 },
  { city: "Austin", country: "United States", countryCode: "US", lat: 30.2672, lng: -97.7431 },
  { city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lng: -9.1393 },
  { city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lng: -3.7038 },
  { city: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  { city: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lng: 21.0122 },
  { city: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.0755, lng: 14.4378 },
  { city: "Vienna", country: "Austria", countryCode: "AT", lat: 48.2082, lng: 16.3738 },
  { city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lng: 8.5417 },
  { city: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.6761, lng: 12.5683 },
  { city: "Helsinki", country: "Finland", countryCode: "FI", lat: 60.1699, lng: 24.9384 },
  { city: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.3498, lng: -6.2603 },
  { city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lng: 36.8219 },
  { city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lng: 18.4241 },
  { city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lng: 31.2357 },
  { city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lng: -58.3816 },
  { city: "Bogotá", country: "Colombia", countryCode: "CO", lat: 4.711, lng: -74.0721 },
  { city: "Lima", country: "Peru", countryCode: "PE", lat: -12.0464, lng: -77.0428 },
  { city: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.2088, lng: 106.8456 },
  { city: "Manila", country: "Philippines", countryCode: "PH", lat: 14.5995, lng: 120.9842 },
  { city: "Taipei", country: "Taiwan", countryCode: "TW", lat: 25.033, lng: 121.5654 },
  { city: "Osaka", country: "Japan", countryCode: "JP", lat: 34.6937, lng: 135.5023 },
  { city: "Shanghai", country: "China", countryCode: "CN", lat: 31.2304, lng: 121.4737 },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.3193, lng: 114.1694 },
  { city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
  { city: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -36.8485, lng: 174.7633 },
  { city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lng: -123.1207 },
  { city: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lng: -73.5673 },
];

const pages = ["/", "/pricing", "/blog", "/docs", "/about", "/dashboard", "/features", "/changelog", "/api", "/login", "/signup", "/settings", "/integrations"];
const referrers = [null, "google.com", "twitter.com", "reddit.com", "producthunt.com", "hackernews.com", "youtube.com", "linkedin.com", "github.com", null, null];
const devices: ("desktop" | "mobile" | "tablet")[] = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];
const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Arc"];
const oses = ["Mac OS", "Windows", "iOS", "Android", "Linux"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function makeVisitor(): Visitor {
  const c = pick(cities);
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
}

let previousVisitors: Visitor[] = [];

export function getDemoPayload(): RadarPayload {
  const targetCount = 15 + Math.floor(Math.random() * 31); // 15–45

  let kept: Visitor[];
  if (previousVisitors.length === 0) {
    kept = [];
  } else {
    // Keep ~90% of existing visitors
    kept = previousVisitors.filter(() => Math.random() < 0.9);
  }

  // Fill up to target with new visitors
  while (kept.length < targetCount) {
    kept.push(makeVisitor());
  }

  // Trim if we're over (unlikely but safe)
  if (kept.length > targetCount) {
    kept = kept.slice(0, targetCount);
  }

  // Randomly update a page for a few existing visitors (simulates navigation)
  for (const v of kept) {
    if (Math.random() < 0.05) {
      v.page = pick(pages);
    }
  }

  previousVisitors = kept;

  const recentEvents = kept.slice(0, 8).map((v) => ({
    id: makeId(),
    type: "pageview",
    visitorId: v.id,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 300_000)).toISOString(),
    path: v.page,
    countryCode: v.countryCode,
    referrer: v.referrer,
  }));

  const recentPayments = Math.random() > 0.6
    ? [
        {
          id: makeId(),
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 600_000)).toISOString(),
          name: pick(["Alex Kim", "Jordan Lee", "Sam Patel", "Maria Garcia", "Chris Wu", "Nina Berg"]),
          amount: pick([29, 49, 99, 199]),
          currency: "USD",
          isNew: Math.random() > 0.5,
        },
      ]
    : [];

  return { count: kept.length, visitors: kept, recentEvents, recentPayments };
}

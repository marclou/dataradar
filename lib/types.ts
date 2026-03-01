export interface Visitor {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  page: string;
  referrer: string | null;
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  isCustomer: boolean;
  sessionStart: string;
  visitCount: number;
}

export interface RecentEvent {
  id: string;
  type: string;
  visitorId: string;
  timestamp: string;
  path: string;
  countryCode: string;
  referrer: string | null;
}

export interface RecentPayment {
  id: string;
  timestamp: string;
  name: string;
  amount: number;
  currency: string;
  isNew: boolean;
}

export interface RadarPayload {
  count: number;
  visitors: Visitor[];
  recentEvents: RecentEvent[];
  recentPayments: RecentPayment[];
}

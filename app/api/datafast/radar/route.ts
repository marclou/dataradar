import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      "https://datafa.st/api/v1/analytics/realtime/map",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      const message =
        upstream.status === 401
          ? "Invalid API key"
          : upstream.status === 404
          ? "Website not found for this API key"
          : errBody?.error?.message || "Upstream error";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    const json = await upstream.json();
    const raw = json.data;

    const visitors = (raw.visitors || []).map((v: Record<string, unknown>) => {
      const loc = v.location as Record<string, string> | undefined;
      const sys = v.system as Record<string, Record<string, string>> | undefined;
      return {
        id: v.visitorId,
        city: loc?.city || "Unknown",
        country: loc?.countryCode || "??",
        countryCode: loc?.countryCode || "??",
        latitude: v.latitude ?? 0,
        longitude: v.longitude ?? 0,
        page: v.currentUrl || "/",
        referrer: v.referrer || null,
        device: sys?.device?.type || "desktop",
        browser: sys?.browser?.name || "Unknown",
        os: sys?.os?.name || "Unknown",
        isCustomer: !!v.isCustomer,
        sessionStart: v.sessionStartTime || new Date().toISOString(),
        visitCount: v.visitCount ?? 1,
      };
    });

    const recentEvents = (raw.recentEvents || [])
      .slice(0, 10)
      .map((e: Record<string, unknown>) => ({
        id: e._id,
        type: e.type,
        visitorId: e.visitorId,
        timestamp: e.timestamp,
        path: e.path,
        countryCode: e.countryCode,
        referrer: e.referrer || null,
      }));

    const recentPayments = (raw.recentPayments || [])
      .filter((p: Record<string, unknown>) => p.visible !== false)
      .slice(0, 5)
      .map((p: Record<string, unknown>) => ({
        id: p._id,
        timestamp: p.timestamp,
        name: p.name || "Someone",
        amount: p.amount,
        currency: p.currency || "USD",
        isNew: !!p.isNew,
      }));

    return NextResponse.json({
      data: {
        count: raw.count ?? visitors.length,
        visitors,
        recentEvents,
        recentPayments,
      },
    });
  } catch (err) {
    console.error("Radar API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

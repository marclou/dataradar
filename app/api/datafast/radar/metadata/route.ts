import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const upstream = await fetch(
      "https://datafa.st/api/v1/analytics/metadata?fields=domain,name,logo",
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
          : errBody?.error?.message || "Upstream error";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    const json = await upstream.json();
    const site = json.data?.[0];

    if (!site) {
      return NextResponse.json({ error: "No website found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        domain: site.domain || null,
        name: site.name || null,
        logo: site.logo || null,
      },
    });
  } catch (err) {
    console.error("Metadata API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

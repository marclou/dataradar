import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const domain = searchParams.get("domain");
  const flag = searchParams.get("flag");

  if (flag) {
    const url = `https://catamphetamine.gitlab.io/country-flag-icons/3x2/${flag.toUpperCase()}.svg`;
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        const svg = await res.text();
        return new NextResponse(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    } catch {}
    return new NextResponse(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="#444"><rect width="24" height="16" rx="2"/><text x="12" y="12" text-anchor="middle" fill="#888" font-size="10">${flag.toUpperCase()}</text></svg>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }

  if (domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0];

    const sources = [
      `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
      `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`,
    ];

    for (const src of sources) {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const ct = res.headers.get("content-type") || "image/x-icon";
          return new NextResponse(Buffer.from(buf), {
            headers: {
              "Content-Type": ct,
              "Cache-Control": "public, max-age=86400, immutable",
            },
          });
        }
      } catch {}
    }

    return new NextResponse(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none"><rect width="32" height="32" rx="8" fill="#1c1917"/><text x="16" y="21" text-anchor="middle" fill="#a8a29e" font-size="16" font-family="monospace">${cleanDomain[0]?.toUpperCase() || "?"}</text></svg>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }

  return NextResponse.json({ error: "Provide domain or flag param" }, { status: 400 });
}

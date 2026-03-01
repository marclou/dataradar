import { NextResponse } from "next/server";

const REPO = "marclou/dataradar";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.redirect(
        `https://github.com/${REPO}/releases/latest`
      );
    }

    const release = await res.json();
    const dmg = release.assets?.find((a: { name: string }) =>
      a.name.endsWith(".dmg")
    );

    if (dmg?.browser_download_url) {
      return NextResponse.redirect(dmg.browser_download_url);
    }

    return NextResponse.redirect(
      `https://github.com/${REPO}/releases/latest`
    );
  } catch {
    return NextResponse.redirect(
      `https://github.com/${REPO}/releases/latest`
    );
  }
}

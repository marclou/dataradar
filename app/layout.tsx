import type { Metadata } from "next";
import { Space_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dataradar.app"),
  title: "DATARADAR — real-time visitor radar",
  description:
    "Watch your website visitors appear on a live radar. A fun real-time analytics experience powered by DataFast.",
  keywords: [
    "real-time analytics",
    "visitor radar",
    "website analytics",
    "DataFast",
    "live visitors",
  ],
  authors: [{ name: "Marc Lou", url: "https://x.com/marclou" }],
  openGraph: {
    title: "DATARADAR — real-time visitor radar",
    description:
      "Watch your website visitors appear on a live radar. Powered by DataFast.",
    url: "https://dataradar.app",
    siteName: "DATARADAR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DATARADAR — real-time visitor radar",
    description:
      "Watch your website visitors appear on a live radar. Powered by DataFast.",
    creator: "@marclou",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className="font-[family-name:var(--font-outfit)] min-h-dvh">
        {children}
      </body>
    </html>
  );
}

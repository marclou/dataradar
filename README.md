# DATARADAR

A real-time visitor radar for your website. Watch visitors light up as the scanner sweeps across a world map.

Powered by [DataFast](https://datafa.st) analytics API.

## Download

**[Download the latest release](https://github.com/marclou/dataradar/releases/latest)** — macOS menubar app (Apple Silicon)

Or try the [live demo](https://dataradar.app) in your browser.

## Setup

1. Create a free account on [DataFast](https://datafa.st)
2. Add the tracking script to your website
3. Copy your API key from Settings → API
4. Paste it into DataRadar

## Development

```bash
npm install
npm run dev          # web app on localhost:3000
npm run menubar:dev  # electron menubar app
```

## Build

```bash
npm run build         # web app
npm run menubar:dist  # electron DMG + ZIP → dist/
```

## Credits

Built by [Marc Lou](https://x.com/marclou)

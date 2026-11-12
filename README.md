# in.gov — India Open Data, Mission Control

A futuristic command deck for India’s open government data ([data.gov.in](https://www.data.gov.in)).
One Mission Control home; curated sector dashboards, each with its own look & feel on a shared HUD chassis.

**Status — MVP:** Mission Control + **Agriculture (Mandi Intelligence)** live, and **Sector 02 Economy (The Ledger — CPI inflation)** live. Other sectors are on the manifest.

> The Economy deck ships on the official **stale** CPI feed (OGD stopped updates in March 2023; latest print Feb 2024) and is labeled as an archived print in the UI — see `/d/economy`.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your data.gov.in API key
npm run dev                  # http://localhost:3000
```

Get a free API key: register at [data.gov.in](https://www.data.gov.in/) → profile → generate API key.
The key is **server-side only** (`.env.local`, git-ignored) — it never reaches the browser.
Without a key (or if the upstream is down), the app falls back to a bundled **snapshot** of the dataset and shows a `SNAPSHOT` badge instead of `LIVE`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm test` | vitest — data adapter unit tests |
| `npm run typecheck` | `tsc --noEmit` |

## Regenerate the snapshots

```bash
node scripts/build-mandi-snapshot.mjs   # reads key from .env.local
node scripts/build-cpi-snapshot.mjs     # CPI series (archived feed)
```

## Architecture

- `src/app` — routes: `/` (Mission Control), `/d/agriculture`, `/d/economy`, `/api/agriculture/mandi`, `/api/economy/cpi`
- `src/server/mandi.ts` — server-only: paginated OGD client (5000/page, in-process 30 min TTL), normalize, aggregate, live→snapshot fallback.
- `src/server/economy.ts` — same pattern for the CPI feed (`cd73a2e7-…`, base 2012=100).
- `src/lib/mandi.ts` + `src/lib/types.ts` — pure, tested adapter/aggregation functions
- `src/lib/domains.ts` — sector registry (add a sector here + a route folder)
- `src/lib/snapshots/mandi.json` — bundled fallback (sampled live data)
- `src/components/hud` — chassis: `HudPanel`, `StatTile`, `StatusPill`, `NavBar`
- `src/components/charts/neon-chart.tsx` — echarts wrapper (dark HUD theme)

## Data source

[data.gov.in](https://www.data.gov.in) — “Current Daily Price of Various Commodities from Various Markets (Mandi)”
resource `9ef84268-d588-465a-a308-a864a43d0070`, Ministry of Agriculture & Farmers Welfare, ₹ per quintal, updated daily.
License: GODL-India. Attribution shown in-app.

## Deploy (Vercel)

Push to a git remote → import in Vercel → add env var `DATA_GOV_IN_API_KEY` in project settings. No other config needed.

## Roadmap

03 Energy (CEA) · 04 Weather (IMD) · 05 Trade (DGCI&S) · 06 Railways · 07 Health · 08 Budget.
Backlog: real-time CPI once MOSPI resumes OGD publishing (orPIB/press-release ingestion), IIP depth.
Later: uncurated catalog browser across all 10k+ resources.

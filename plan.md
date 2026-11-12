# in.gov — India Open Data, Mission Control

Goal: a futuristic dark-HUD portal that turns India's open government data
(data.gov.in) into curated, domain-specific dashboards. One card per domain on a
"Mission Control" home; each domain dashboard has its own look & feel on a
shared HUD design chassis.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- ECharts (via echarts + echarts-for-react or a thin client wrapper)
- Framer Motion (ambient animation, counters)
- Vitest (data-adapter tests)
- Vercel-ready deployment

## Architecture

- **Server-side data layer**: Route Handlers under `app/api/**` call
  data.gov.in with the `DATA_GOV_IN_API_KEY` server-only env var (`.env.local`,
  git-ignored; never shipped to the browser). Handlers normalize per-dataset
  quirks (field-name mapping, CSV fallback, off-by-one pagination) and cache
  via Next.js `revalidate`.
- **Domain registry**: `src/lib/domains.ts` — slug, title, icon, per-domain
  theme tokens (accent palette, motif). New domains = registry entry + route
  folder + dataset config. Home renders cards from the registry.
- **Snapshot fallback**: bundled JSON in `src/lib/snapshots/`. If the API key
  is missing / upstream fails / quota exhausted, the UI falls back to the
  snapshot automatically and shows a `SNAPSHOT` badge (vs `LIVE`).
- **Routes**:
  - `/` — Mission Control: header, HUD status bar, domain card grid
    (Agriculture active; other domains shown as `STANDBY` locked cards)
  - `/d/agriculture` — themed Agriculture dashboard (MVP)

## Visual system (shared chassis, per-domain skin)

Near-black navy, subtle grid + scanline overlay, corner-bracket glass panels,
JetBrains Mono data labels + Space Grotesk headings, ambient glow, animated
stat counters. Agriculture skin: deep green / amber accent, mandi motif.

## MVP scope (Agriculture domain only)

1. Mission Control home — domain card grid + roadmap cards
2. `/d/agriculture` dashboard:
   - Headline stats: markets reporting, top price movers, commodities tracked
   - Cascading filters: State → District → APMC Market → Commodity, date range
   - Modal-price trend chart, top gainers/losers, state-wise comparison
   - Sortable/searchable table
3. Loading skeletons, empty/error states, responsive to tablet
4. Tests for the data adapter

## Explicitly deferred

Economy / Energy / IMD / Trade / Railways domains, catalog/search browser for
all 10k+ datasets, auth, database, production deployment config.

## Known data.gov.in quirks (handled in adapter)

- Field names inconsistent per dataset → per-dataset field maps
- Some endpoints return CSV regardless of `format=json` → check Content-Type
- Filters are case-sensitive → verified against sample payloads
- Off-by-one pagination at end of dataset → empty-`records` guard
- Price columns are strings → numeric coercion on normalize

## Data source

OGD Platform API: `https://api.data.gov.in/resource/{resource_id}`
`?api-key=...&format=json&offset=N&limit=100`

Primary dataset (MVP): daily mandi commodity prices
(`9ef84268-d588-465a-a308-a864a43d0070`).

## TODO

See `TODO.md`.

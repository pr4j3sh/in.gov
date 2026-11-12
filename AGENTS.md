# in.gov — Agent Notes

India's open government data, visualized. Mission Control home; curated sector decks on a shared HUD chassis.

## Stack

Next.js (App Router, Turbopack, cacheComponents) · TypeScript · Tailwind v4 · ECharts (thin `NeonChart` wrapper) · Vitest · Node 26.

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm test` — vitest
- `npm run typecheck` — `tsc --noEmit`

## Data honesty contract

- Live OGD (`api.data.gov.in`) for Agriculture (mandi) and Economy (CPI). CPI feed is **archived** — latest print Feb 2024; decks must stay labeled `ARCHIVED PRINT`, never `LIVE`.
- Crime (NCRB) is bundled from a parsed opencity.in XLSX snapshot (`src/lib/snapshots/crime.json`) — no live crime API exists.
- Every sector must show LIVE / SNAPSHOT / ARCHIVED / STANDBY honestly. No fake freshness.

## Architecture

- `src/app` — routes: `/` (Mission Control), `/d/<sector>`, `/api/<sector>/...`
- `src/server/*.ts` — server-only data layer (paginated OGD client, in-process TTL cache, live→snapshot fallback, bundled snapshot import)
- `src/lib/*.ts` — pure, tested adapters (`mandi.ts`, `cpi.ts`, `crime.ts`) + `chart-theme.ts`, `domains.ts` (sector registry), `types.ts`
- `src/components/hud` — chassis: `HudPanel`, `StatTile`, `StatusPill`, `NavBar`, `ManifestStrip`, `MetaRail`, `Chip`, `HudSearch`, `InfoTip`, `SourceLink`, skeletons; `charts/neon-chart.tsx`
- Per-sector identity lives in `src/app/globals.css` (`[data-domain="…"]`) — never re-plow the chassis; restyle via tokens
- Snapshots regenerate via `scripts/build-*.mjs`; commit the JSON

## Secrets

`DATA_GOV_IN_API_KEY` — server-only, `.env.local` (git-ignored). Never expose to client or logs. `maxDuration = 60` on live routes for cold-start headroom on Vercel.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

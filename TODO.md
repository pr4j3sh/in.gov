# TODO — in.gov MVP

## Phase 1 — Scaffold
- [x] Scaffold Next.js app (App Router, TS, Tailwind) in repo root
- [x] `.gitignore` includes `.env.local`; verify key not committed
- [x] Theme tokens + fonts (Space Grotesk, JetBrains Mono)
- [x] HUD component kit: `HudPanel` (corner brackets), `ScanlineBackground`,
      `StatTile` (animated counter), `StatusPill` (LIVE/SNAPSHOT), `GlowChart`
- [x] App shell: layout, nav bar, Mission Control background

## Phase 2 — Data layer
- [x] `src/lib/dataGovIn.ts` — paginated OGD client (offset/limit, filters,
      Content-Type guard, off-by-one guard, TTL cache, timeout)
- [x] Mandi dataset adapter: field map, numeric coercion, typed `MandiRecord`
- [x] Bundled snapshot JSON (`src/lib/snapshots/mandi.json`)
- [x] `app/api/agriculture/mandi/route.ts` — query params (state, district,
      market, commodity, date range), normalization, live↔snapshot fallback
- [x] Vitest tests for adapter (parsing, normalization, pagination, fallback)

## Phase 3 — Home (Mission Control)
- [x] Header + status bar (LIVE/SNAPSHOT, key source, Indian time)
- [x] Domain registry `src/lib/domains.ts`
- [x] Domain card grid — Agriculture `ACTIVE`; Economy/Energy/Weather/Trade/
      Railways as `STANDBY` roadmap cards
- [x] Ambient animations (Framer Motion), responsive

## Phase 4 — Agriculture dashboard (`/d/agriculture`)
- [x] Headline stat tiles (markets reporting, movers, commodities tracked)
- [x] Cascading filters: State → District → Market → Commodity + date range
- [x] Modal-price trend chart (ECharts neon line w/ gradient fill)
- [x] Top gainers/losers bar chart; state-wise comparison chart
- [x] Sortable, searchable table of records
- [x] Loading skeletons + empty/error states
- [x] Agriculture theme (green/amber skin) applied on shared chassis

## Phase 5 — Polish & verify
- [x] `npm run build` passes; typecheck clean
- [x] `npm test` passes
- [x] Smoke-test live API path with real key + snapshot fallback path
- [x] README with setup instructions (env var, dev, build, deploy note)

## Economy sector (Sector 02 — The Ledger)
- [x] CPI snapshot generator (full series, dedupe, pressure-week window)
- [x] `src/lib/cpi.ts` + `cpi.test.ts` — parse, YoY, ledger, pressure aggregation
- [x] `src/server/economy.ts` — paginated live fetch + in-process TTL cache + snapshot fallback
- [x] `/api/economy/cpi` route
- [x] Economy dashboard: One Number hero, YoY trajectory (5Y/10Y/MAX + RBI corridor markArea), per-basket pressure bars, 18-month ledger table, sector chips (Rural/Urban/Combined)
- [x] Ink-gold ledger identity (tokens, background, table rules), Home card → ACTIVE
- [ ] IIP / GDP depth — blocked on live OGD resources (MoSPI feeds ended 2023)

## Crime sector (Sector 09 — Rakshak)
- [x] Snapshot generator from NCRB Tables 1.1/1.2/1.3/1B.3/9B.1 (opencity.in CKAN mirror)
- [x] src/lib/crime.ts + tests — table parsing, totals, metro/cyber aggregation
- [x] /api/crime/ncrb route (disk-cached snapshot, archived source)
- [x] Crime dashboard: One Number hero (58,85,867; complaint→FIR funnel), crime-heads ranking, Metro League table, cyber-surge chart, 3-yr arc
- [x] Rakshak dossier identity, home 3×3 grid, nav link, 3 of 9 sectors online

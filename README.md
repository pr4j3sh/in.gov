# in.gov

India's open government data, visualized. Currently live: **Agriculture** (live mandi prices), **Economy** (CPI inflation), **Crime & Order** (NCRB 2024). Source: data.gov.in (+ opencity.in mirror for crime).

## Stack

Next.js (App Router) · TypeScript · Tailwind · ECharts · Vitest

## Quick start

```bash
npm install
cp .env.example .env.local   # add your data.gov.in API key
npm run dev                  # http://localhost:3000
```

Get a free key at [data.gov.in](https://www.data.gov.in/) → your profile → generate API key. Key is server-side only (`.env.local`, git-ignored). Without it, the app falls back to bundled snapshots.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm test` | vitest |
| `npm run typecheck` | `tsc --noEmit` |

## Regenerate snapshots

```bash
node scripts/build-mandi-snapshot.mjs   # live mandi data (needs key)
node scripts/build-cpi-snapshot.mjs     # CPI series (frozen feed)
node scripts/build-crime-snapshot.mjs   # NCRB 2024 (opencity.in)
```

## Deploy

Vercel: import repo, set `DATA_GOV_IN_API_KEY`, deploy. Snapshots are bundled — no runtime network needed for fallback paths.

## License

Data: GODL-India. Code: see `LICENSE` if present, else all rights reserved.

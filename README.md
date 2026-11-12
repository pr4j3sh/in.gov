# in.gov

India's open government data, visualized.

**All 10 sectors online.** Agriculture · Economy · Energy · Weather & Rainfall · Trade · Railways · Crime & Order · Population · Health · Budget & FinMin.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your data.gov.in API key
npm run dev                  # http://localhost:3000
```

Get a free key at [data.gov.in](https://www.data.gov.in/) → your profile → generate API key. Key is server-side only (`.env.local`, git-ignored). Without it, the app falls back to bundled snapshots.

## Scripts

| Command                       | Purpose                  |
| ----------------------------- | ------------------------ |
| `npm run dev`                 | dev server               |
| `npm run build` / `npm start` | production build / serve |
| `npm test`                    | vitest                   |

// One-off generator for the energy snapshot. Usage: node scripts/build-energy-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  mix: '75e31856-e00b-4de9-970e-987442936958',       // Thermal vs Non-fossil FY22-25
  nuclear: '09c4ff3d-6d68-4bfa-9eca-7ec38ded9cd9',   // Nuclear 2014-15 to 2023-24
  solar: '3056d949-7e94-4e2a-ad7f-9bf3dd82e530',     // Solar by state 2022-23
}

async function fetchAll(id) {
  const url = new URL(`https://api.data.gov.in/resource/${id}`)
  url.searchParams.set('api-key', key)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5000')
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  const d = await res.json()
  if (d.status !== 'ok') throw new Error(`status=${d.status}`)
  return d.records
}

const [mix, nuclear, solar] = await Promise.all([
  fetchAll(R.mix), fetchAll(R.nuclear), fetchAll(R.solar),
])
console.log(`mix=${mix.length} nuclear=${nuclear.length} solar=${solar.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim().replace(/,/g, '')); return Number.isFinite(n) ? n : null }
const str = (v) => (v == null ? '' : String(v).trim())

const isAggregate = (name) => /total|region|all india|india/i.test(String(name ?? ''))

const snapshot = {
  meta: {
    title: 'Energy — URJA',
    source: 'Ministry of Power / PIB — via data.gov.in',
    generatedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
  },
  mix: mix.map((r) => ({
    source: str(r.electricity_generation_by_source),
    fy2023: num(r._2022_23),
    fy2024: num(r._2023_24),
    fy2025: num(r._2024_25),
  })).filter((r) => r.source),
  nuclear: nuclear.map((r) => ({
    year: str(r._year),
    generationMU: num(r.gross_generation__million_units_),
  })).filter((r) => r.year && r.generationMU != null),
  solar: solar
    .filter((r) => !isAggregate(r.state_ut))
    .map((r) => ({
      state: str(r.state_ut),
      generationGWh: num(r.solar_electricity_generation_in_2022_2023_),
    }))
    .filter((r) => r.state && r.generationGWh != null)
    .sort((a, b) => b.generationGWh - a.generationGWh),
}
writeFileSync('src/lib/snapshots/energy.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/energy.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

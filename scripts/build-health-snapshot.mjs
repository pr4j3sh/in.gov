// One-off generator for the health snapshot. Usage: node scripts/build-health-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  ficByState: '808b9b9c-8720-4fe8-8d52-7de613f2c5a3',   // State FIC 2023-24
  ficYearwise: 'aee4a2c3-a126-4e80-b151-6274d514ee1d',  // FIC 2019-20 to 2023-24
  vacancies: '782c19ad-5833-4745-95b2-31656af47bed',    // RHS 2021 vacancies
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

const fic = await fetchAll(R.ficByState)
const ficYears = await fetchAll(R.ficYearwise)
const vacancies = await fetchAll(R.vacancies)
console.log(`Fetched: fic=${fic.length} ficYears=${ficYears.length} vacancies=${vacancies.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim()); return Number.isFinite(n) ? n : null }

const snapshot = {
  meta: {
    title: 'Health — FIC + RHS Vacancies',
    source: 'Ministry of Health & Family Welfare — via data.gov.in',
    generatedAt: new Date().toISOString(),
    asOf: '2023-24',
  },
  ficByState: fic.map((r) => ({ state: String(r.state_ut ?? '').trim(), ficPct: num(r._2023_24) })).filter((r) => r.state),
  ficYearwise: ficYears.map((r) => ({ year: String(r._year ?? '').trim(), ficPct: num(r.india_) })).filter((r) => r.year),
  vacancies: vacancies.map((r) => ({
    state: String(r.state_ut ?? '').trim(),
    doctors: num(r.doctors__dh_and_below_),
    specialists: num(r.specialist___physician__chc_),
    labTechnicians: num(r.lab_technicians__chc_and_below_),
    radiographers: num(r.radiographer__chc_),
    pharmacists: num(r.pharmacists__chc_and_below_),
    nurses: num(r.staff_nurses__chc_and_below_),
    mpw: num(r.mpw__m___f__at_phc_and_below),
    paramedical: num(r.paramedical_staff__dh_and_sdh_),
  })).filter((r) => r.state),
}
writeFileSync('src/lib/snapshots/health.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/health.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

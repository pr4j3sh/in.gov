// One-off generator for the population snapshot (Census 2011 archived prints).
// Usage: node scripts/build-census-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  series: 'e00c5fab-ad0a-420a-b1e3-d499b244c99f',   // All-India 1901-2011
  states: '463d908b-c03b-47d3-b5bb-33d584d27f65',   // State pop/growth/density 2011
  sexRatio: '2320f4d4-85b6-46bb-86b6-36824b87cd08', // State sex ratio + growth
  workers: '64d4bcb5-945d-48e8-84ec-995558785336',  // Main workers by state 2011
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

const series = await fetchAll(R.series)
const states = await fetchAll(R.states)
const sexRatio = await fetchAll(R.sexRatio)
const workers = await fetchAll(R.workers)
console.log(`Fetched: series=${series.length} states=${states.length} sexRatio=${sexRatio.length} workers=${workers.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim()); return Number.isFinite(n) ? n : null }

const snapshot = {
  meta: {
    title: 'Census of India 2011',
    source: 'Office of the Registrar General & Census Commissioner — via data.gov.in',
    generatedAt: new Date().toISOString(),
    asOf: '2011',
  },
  series: series.map((r) => ({
    year: num(r.year),
    populationMillions: num(r.population__in_million_),
    decadalVariationPct: num(r.percentage_decadal_variation),
    annualGrowthPct: num(r.average_annual_exponential_growth_rate__percent_),
    crudeBirthRate: num(r.crude_birth_rate),
    crudeDeathRate: num(r.crude_death_rate),
    sexRatioFemalesPer1000Males: num(r.sex_ratio__females_per_1000_males_),
  })).filter((r) => r.year),
  states: states.map((r) => ({
    name: String(r.india_state_union_territory ?? '').trim(),
    category: String(r.category ?? '').trim(),
    population2011: num(r.population_2011),
    decadalGrowthPct: num(r.decadal_population_growth_rate___2001_2011),
    densityPerSqKm: num(r.population_density_per_sq_km___2011),
  })).filter((r) => r.name),
  sexRatio: sexRatio.map((r) => ({
    name: String(r.state_union_territory ?? '').trim(),
    population2011: num(r.percent_female_population___2011___persons),
    femalePct2011: num(r.percent_female_population___2011_____female),
    sexRatio: num(r.sex_ratio___2011),
    annualGrowthPct: num(r.average_annual_exponential_growth_rate_______2001_2011),
  })).filter((r) => r.name),
  workers: workers.map((r) => ({
    name: String(r.india_state_union_territory ?? '').trim(),
    totalPopulation: num(r.total_population_persons),
    mainWorkers: num(r.main_workers_persons),
    mainWorkersPct2001: num(r.percentage_of_main_workers_to_total_population_2001_persons),
    mainWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_persons),
    maleWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_males),
    femaleWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_females),
  })).filter((r) => r.name),
}
writeFileSync('src/lib/snapshots/census.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/census.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

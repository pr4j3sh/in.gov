// One-off generator for the railways snapshot. Usage: node scripts/build-railways-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  freight: '4cb9673d-44e5-476b-8faf-47196db99bf8', // Freight loading/revenue FY21-FY25
  trains: '10b38365-5fe4-459d-880b-cda4b26458b2',  // Train types FY18-19 to FY23-24
  coal: '8002f953-737e-4e88-b593-b52ea512329f',    // Coal freight revenue FY16-17 to FY21-22
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

const freight = await fetchAll(R.freight)
const trains = await fetchAll(R.trains)
const coal = await fetchAll(R.coal)
console.log(`freight=${freight.length} trains=${trains.length} coal=${coal.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim().replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : null }
const str = (v) => (v == null ? '' : String(v).trim())

const snapshot = {
  meta: {
    title: 'Railways — Freight (FY25) + Train mix + Coal freight',
    source: 'Ministry of Railways · PIB — via data.gov.in',
    generatedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
  },
  freight: freight.map((r) => ({
    year: str(r._year),
    loadingMnt: num(r.freight_loading__in_million_tonnes_),
    revenueCrore: num(r.freight_revenue__rs__in_crore_),
  })).filter((r) => r.year),
  trains: trains.map((r) => ({
    year: str(r.type_of_train),
    mailExpress: num(r.mail_express),
    ordinary: num(r.ordinary),
    goods: num(r.goods),
  })).filter((r) => r.year),
  coal: coal.map((r) => ({
    year: str(r._year).replace(/\s*\(.*?\)\.?\s*$/, ''),
    revenueCrore: num(r.freight_revenue_from_coal),
  })).filter((r) => r.year && r.revenueCrore != null),
}
writeFileSync('src/lib/snapshots/railways.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/railways.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

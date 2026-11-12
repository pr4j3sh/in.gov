// One-off generator for the bundled mandi snapshot used when the live
// data.gov.in API is unreachable (no key / network failure).
// Usage: node scripts/build-mandi-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'
const SAMPLE_KEEP_EVERY = 9 // ~1800 records from 16342

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) {
  console.error('DATA_GOV_IN_API_KEY not found in .env.local')
  process.exit(1)
}

async function fetchPage(offset, limit) {
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`)
  url.searchParams.set('api-key', key)
  url.searchParams.set('format', 'json')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(`API status=${data.status} at offset ${offset}`)
  return data
}

const LIMIT = 5000
const first = await fetchPage(0, LIMIT)
const total = Number(first.total)
const pages = [first]
for (let offset = LIMIT; offset < total; offset += LIMIT) {
  pages.push(await fetchPage(offset, LIMIT))
}
const records = pages.flatMap((p) => p.records)
console.log(`Fetched ${records.length} / ${total} records`)

const sample = records.filter((_, i) => i % SAMPLE_KEEP_EVERY === 0)
const asOf = sample.reduce((acc, r) => (r.arrival_date > acc ? r.arrival_date : acc), '')

const snapshot = {
  meta: {
    resourceId: RESOURCE_ID,
    title: 'Current Daily Price of Various Commodities from Various Markets (Mandi)',
    source: 'data.gov.in',
    asOf,
    totalRecords: total,
    sampledRecords: sample.length,
    generatedAt: new Date().toISOString(),
  },
  records: sample,
}
writeFileSync('src/lib/snapshots/mandi.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/mandi.json (${sample.length} sampled records)`)

// One-off generator for the economy snapshot (stale official CPI series).
// Usage: node scripts/build-cpi-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const RESOURCE_ID = 'cd73a2e7-f928-45de-ae61-f4e34fc9bb5c' // All India CPI (Rural/Urban)
const PAGE = 5000

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) {
  console.error('DATA_GOV_IN_API_KEY not found in .env.local')
  process.exit(1)
}

async function fetchPage(offset, attempt = 1) {
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`)
  url.searchParams.set('api-key', key)
  url.searchParams.set('format', 'json')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(PAGE))
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`)
    const data = await res.json()
    if (data.status !== 'ok') throw new Error(`API status=${data.status} at offset ${offset}`)
    return data
  } catch (err) {
    if (attempt >= 4) throw err
    const wait = 2 ** attempt * 1000
    console.warn(`page ${offset} failed (${err.message}); retrying in ${wait}ms`)
    await new Promise((r) => setTimeout(r, wait))
    return fetchPage(offset, attempt + 1)
  }
}

const SERIES_KEEP = ['sector', 'year', 'month', 'general_index', 'food_and_beverages', 'fuel_and_light', 'miscellaneous', 'education', 'transport_and_communication']
const FULL_KEEP = [
  'sector', 'year', 'month',
  'food_and_beverages', 'cereals_and_products', 'vegetables', 'milk_and_products',
  'clothing_and_footwear', 'fuel_and_light', 'housing',
  'health', 'education', 'transport_and_communication', 'miscellaneous', 'general_index',
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const first = await fetchPage(0)
const total = Number(first.total)
const pages = [first]
for (let offset = PAGE; offset < total; offset += PAGE) {
  pages.push(await fetchPage(offset))
}
const records = pages.flatMap((p) => p.records)
console.log(`Fetched ${records.length} / ${total}`)

const sorted = [...records].sort((a, b) =>
  (Number(a.year) - Number(b.year)) || (MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)))

// Collapse duplicated (sector, year, month) rows — the feed carries ~20 copies each.
// Keep the first entry per key; drop junk rows without a parseable key.
const seen = new Map()
for (const r of sorted) {
  const key = `${r.sector}|${r.year}|${r.month}`
  if (!r.sector || !r.year || !r.month || r.sector === 'NA' || seen.has(key)) continue
  seen.set(key, r)
}
const deduped = [...seen.values()].sort((a, b) =>
  (a.sector ?? '').localeCompare(b.sector ?? '') ||
  (Number(a.year) - Number(b.year)) ||
  (MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)))

const latest = deduped[deduped.length - 1]

// Latest month + the 13 months before it carry the full basket (pressure YoY
// needs the same month a year ago).
const monthNum = (y, mIdx) => y * 12 + mIdx
const latestMonthNum = monthNum(Number(latest?.year ?? 2000), MONTHS.indexOf(latest?.month ?? 'January'))
const fullCutoff = latestMonthNum - 13
const isFull = (y, mIdx) => monthNum(y, mIdx) >= fullCutoff

const seriesRecords = deduped.map((r) => {
  if (isFull(Number(r.year), MONTHS.indexOf(r.month))) {
    const out = {}
    for (const k of FULL_KEEP) out[k] = r[k]
    return out
  }
  const out = {}
  for (const k of SERIES_KEEP) out[k] = r[k]
  return out
})

// Full record per sector for all-group YoY pressure charts.
const latestBySector = {}
for (const sector of new Set(deduped.map((r) => r.sector))) {
  const rows = deduped.filter((r) => r.sector === sector)
  latestBySector[sector] = rows[rows.length - 1]
}

const snapshot = {
  meta: {
    resourceId: RESOURCE_ID,
    title: 'All India Consumer Price Index (Rural/Urban)',
    source: 'data.gov.in',
    asOf: `${latest?.year}-${String(MONTHS.indexOf(latest?.month ?? 'January') + 1).padStart(2, '0')}`,
    totalRecords: total,
    generatedAt: new Date().toISOString(),
  },
  // Full monthly series (kept small) + one complete latest record for all-group YoY.
  records: seriesRecords,
  latestBySector,
}
writeFileSync('src/lib/snapshots/cpi.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/cpi.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB) — asOf ${snapshot.meta.asOf}`)

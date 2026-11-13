// Append today's mandi insights to a JSONL history file.
// One line per day — tiny; keeps a running record for trend analysis without raw-data bloat.
// Usage: node scripts/accumulate-mandi.mjs
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }
if (!existsSync('data')) mkdirSync('data', { recursive: true })

const RESOURCE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
async function fetchAll() {
  const records = []
  for (let offset = 0; offset < 50000; offset += 5000) {
    const u = new URL(RESOURCE_URL)
    u.searchParams.set('api-key', key); u.searchParams.set('format', 'json')
    u.searchParams.set('offset', String(offset)); u.searchParams.set('limit', '5000')
    let d
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const res = await fetch(u, { signal: AbortSignal.timeout(60_000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        d = await res.json()
        if (d.status !== 'ok') throw new Error(`status=${d.status}`)
        break
      } catch (err) {
        if (attempt === 5) throw err
        console.warn(`page ${offset} failed (${err.message}); retrying`)
        await new Promise((r) => setTimeout(r, 2 ** attempt * 800))
      }
    }
    records.push(...d.records)
    if (records.length >= Number(d.total)) break
  }
  return records
}

const num = (v) => { const n = Number(String(v ?? '0').trim()); return Number.isFinite(n) ? n : 0 }
const str = (v) => (v == null ? '' : String(v).trim())

const raw = await fetchAll()
console.log(`Pulled ${raw.length} raw rows`)
const records = raw.map((r) => ({ state: str(r.state), market: str(r.market), commodity: str(r.commodity), modal_price: num(r.modal_price), arrival_date: str(r.arrival_date) }))
  .filter((r) => r.modal_price > 0)

const byCommodity = new Map()
for (const r of records) {
  const arr = byCommodity.get(r.commodity) ?? []
  arr.push(r.modal_price); byCommodity.set(r.commodity, arr)
}
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const today = records[0]?.arrival_date ?? new Date().toISOString().slice(0, 10)
const mostQuoted = [...byCommodity.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10).map(([c, arr]) => ({
  commodity: c, markets: arr.length, median: Math.round(median(arr) * 10) / 10,
}))

const line = JSON.stringify({
  date: today,
  ts: new Date().toISOString(),
  totalRows: records.length,
  distinctMarkets: new Set(records.map((r) => r.market)).size,
  distinctCommodities: byCommodity.size,
  distinctStates: new Set(records.map((r) => r.state)).size,
  top10ByCoverage: mostQuoted,
})
appendFileSync('data/mandi-history.jsonl', line + '\n')
console.log(`Appended insights for ${today} → data/mandi-history.jsonl`)

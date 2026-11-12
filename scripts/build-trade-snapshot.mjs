// One-off generator for the trade snapshot. Usage: node scripts/build-trade-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  balance: '13fb29e1-29c2-4a0f-a351-f735b59f2dcc',   // Merchandise trade balance FY22-25
  eu: 'd885fcd0-678b-4a76-87c9-2e7887fdde3a',        // India–EU 2020-21 to 2024-25
  chemicals: '53d18625-f069-47f2-8abc-980dad14b072', // Chemicals & petro exports FY21-25
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

const balance = await fetchAll(R.balance)
const eu = await fetchAll(R.eu)
const chemicals = await fetchAll(R.chemicals)
console.log(`balance=${balance.length} eu=${eu.length} chemicals=${chemicals.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim()); return Number.isFinite(n) ? n : null }

const snapshot = {
  meta: {
    title: 'Trade — merchandise balance, EU ledger, chemicals',
    source: 'Ministry of Commerce & Industry · Rajya Sabha — via data.gov.in (PIB replies)',
    generatedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
  },
  balance: balance.map((r) => ({ year: String(r._year ?? '').trim(), balanceBn: num(r.merchandise_trade_balance) })),
  eu: eu.map((r) => ({
    year: String(r._year ?? '').trim(),
    exportBn: num(r.export),
    importBn: num(r.import),
    totalBn: num(r.total_trade),
    balanceBn: num(r.trade_balance),
  })),
  // Keep HS baskets; drop the two aggregate cosmetic rows.
  chemicals: chemicals
    .filter((r) => !String(r.sl__no_).toLowerCase().includes('total') && !String(r.sl__no_).toLowerCase().includes('growth'))
    .map((r) => ({
      hsCode: String(r.hs_code ?? '').trim(),
      commodity: String(r.commodity ?? '').trim(),
      fy2021: num(r._2020_21),
      fy2022: num(r._2021_22),
      fy2023: num(r._2022_23),
      fy2024: num(r._2023_24),
      fy2025: num(r._2024_25),
    })),
  chemicalsTotal: num((chemicals.find((r) => String(r.sl__no_).toLowerCase().includes('total')) ?? {})._2024_25),
}
writeFileSync('src/lib/snapshots/trade.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/trade.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

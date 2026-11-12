// One-off generator for the finmin/budget snapshot. Usage: node scripts/build-finmin-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  gst: 'a880c75a-6e20-419e-b5f6-f551c44e738f',             // GST collections FY17-18 to FY25-26
  directTax: 'b88c704f-93f5-4c6b-8cfb-dc3da3f670ab',       // Corp / non-corp tax FY20-21 to FY24-25
  budgetGlance: '9f60de19-bf93-4ec9-83a4-2b0cf00479d1',    // Budget at a glance FY21-22 to FY23-24
  genderBudget: '1bb65f1f-d579-44a5-a9d2-1d83ee4cec68',    // Gender budget FY21-22 to FY24-25
  disinvestment: '21876b8e-2ff7-4770-b8db-266b6b63773f',   // Disinvestment FY18-19 to FY22-23 (verify id)
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

const gst = await fetchAll(R.gst)
const directTax = await fetchAll(R.directTax)
const budget = await fetchAll(R.budgetGlance)
const gender = await fetchAll(R.genderBudget)
// Disinvestment resource id has an extra '3' vs source; try both
let disinvestment = []
try { disinvestment = await fetchAll(R.disinvestment) } catch {
  disinvestment = await fetchAll('21876b8e-2ff7-4770-b8db-266b6b63773f')
}
console.log(`gst=${gst.length} directTax=${directTax.length} budget=${budget.length} gender=${gender.length} disinvestment=${disinvestment.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim().replace(/,/g, '')); return Number.isFinite(n) ? n : null }
const str = (v) => (v == null ? '' : String(v).trim())

const snapshot = {
  meta: {
    title: 'Budget & FinMin — KOSHAKAR',
    source: 'Ministry of Finance · PIB — via data.gov.in',
    generatedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
  },
  gst: gst.map((r) => ({
    year: str(r._year),
    amountCr: num(r.amount__in_rs__crore_),
    growthPct: num(r.percentage_growth),
  })).filter((r) => r.year),
  directTax: directTax.map((r) => ({
    year: str(r._year),
    nonCorporateCr: num(r.net_collection___non_corporate_tax__rs__in_crore_),
    corporateCr: num(r.net_collection___corporate_tax__rs__in_crore_),
    nonCorporateGrowthPct: num(r.annual_growth_in_percentage___non_corporate_tax),
    corporateGrowthPct: num(r.annual_growth_in_percentage___corporate_tax),
  })).filter((r) => r.year),
  budget: budget.map((r) => ({
    parameter: str(r['si__no_________parameters']),
    fy22Actuals: num(r._2021_2022_actuals),
    fy23BE: num(r._2022_2023_br),
    fy23RE: num(r._2022_2023_re),
    fy24BE: num(r._2023_2024_be),
  })).filter((r) => r.parameter),
  genderBudget: gender.map((r) => ({
    year: str(r._year),
    amountCrore: num(r.amount),
  })).filter((r) => r.year),
  disinvestment: disinvestment.map((r) => ({
    year: str(r._year),
    receiptsCr: num(r.actual_disinvestment_receipts),
    totalReceiptsCr: num(r.total_budget_actual_receipts__revenue_capital_),
    pctOfTotal: num(r.actual_disinvestment_receipts_as___of_total_receipts__revenue_capital_),
  })).filter((r) => r.year),
}
writeFileSync('src/lib/snapshots/finmin.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/finmin.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

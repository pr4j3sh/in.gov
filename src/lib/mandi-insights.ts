/**
 * Derived insights from a mandi snapshot. All results are for the single-day
 * print — no trend/anomaly claims without history.
 */
import type { MandiRecord } from './types'

export interface PlaceholderStats {
  totalRows: number
  placeholderRows: number
  affectedMarkets: string[]
  severity: 'clean' | 'low' | 'high'
}

const PLACEHOLDER_CEILING = 0.05 // ₹ — anything at/below 5 paise is a null-sentinel

export function placeholderStats(records: MandiRecord[]): PlaceholderStats {
  const affected = new Set<string>()
  let n = 0
  for (const r of records) {
    if (r.modalPrice != null && r.modalPrice <= PLACEHOLDER_CEILING) {
      n += 1
      affected.add(r.market)
    }
  }
  return {
    totalRows: records.length,
    placeholderRows: n,
    affectedMarkets: [...affected],
    severity: n === 0 ? 'clean' : n < 10 ? 'low' : 'high',
  }
}

export interface ArbitrageRow {
  commodity: string
  nationalMedian: number
  northMedian: number
  southMedian: number
  spread: number
  spreadPct: number
  southCheaper: boolean
}

const NORTH = new Set(['Punjab', 'Haryana', 'Himachal Pradesh', 'Delhi', 'NCT of Delhi', 'Jammu & Kashmir', 'Jammu and Kashmir', 'Chandigarh', 'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Uttarakhand', 'Gujarat', 'Chhattisgarh', 'Chattisgarh', 'Jharkhand'])
const SOUTH = new Set(['Tamil Nadu', 'Kerala', 'Keralam', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Pondicherry', 'Puducherry'])

const groupMedian = (vals: number[]): number | null => {
  if (vals.length === 0) return null
  const s = [...vals].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function arbitrageSpread(records: MandiRecord[], commodities: string[] = ['Tomato', 'Onion', 'Potato']): ArbitrageRow[] {
  const out: ArbitrageRow[] = []
  for (const commodity of commodities) {
    const rows = records.filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase() && r.modalPrice > 0)
    const all = rows.map((r) => r.modalPrice)
    const north = rows.filter((r) => NORTH.has(r.state)).map((r) => r.modalPrice)
    const south = rows.filter((r) => SOUTH.has(r.state)).map((r) => r.modalPrice)
    const nm = groupMedian(all)
    const nn = groupMedian(north)
    const ns = groupMedian(south)
    if (nm == null || nn == null || ns == null) continue
    const spread = Math.abs(nn - ns)
    out.push({
      commodity,
      nationalMedian: nm,
      northMedian: nn,
      southMedian: ns,
      spread,
      spreadPct: Math.round((spread / nm) * 1000) / 10,
      southCheaper: ns < nn,
    })
  }
  return out
}

export interface OutlierRow {
  commodity: string
  market: string
  state: string
  modalPrice: number
  multiple: number
}

export function outliers(records: MandiRecord[], n = 8, multiplier = 5): OutlierRow[] {
  const byC = new Map<string, number[]>()
  for (const r of records) {
    if (r.modalPrice <= 0) continue
    const arr = byC.get(r.commodity) ?? []
    arr.push(r.modalPrice)
    byC.set(r.commodity, arr)
  }
  const meds = new Map<string, number>()
  for (const [c, arr] of byC) {
    const m = groupMedian(arr)
    if (m != null) meds.set(c, m)
  }
  const out: OutlierRow[] = []
  for (const r of records) {
    if (r.modalPrice <= 0) continue
    const med = meds.get(r.commodity)
    if (!med || (byC.get(r.commodity)?.length ?? 0) < 15) continue
    const mult = r.modalPrice / med
    if (mult >= multiplier) out.push({ commodity: r.commodity, market: r.market, state: r.state, modalPrice: r.modalPrice, multiple: Math.round(mult * 10) / 10 })
  }
  return out.sort((a, b) => b.multiple - a.multiple).slice(0, n)
}

export interface SaleRankingRow {
  market: string
  state: string
  commodity: string
  modalPrice: number
  relativeToMedianPct: number
}

export function topMarkets(records: MandiRecord[], commodity: string, n = 5): { rows: SaleRankingRow[]; commodityMedian: number | null; stateWideAvg: number | null } {
  const rows = records.filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase() && r.modalPrice > 0)
  const med = rows.length ? groupMedian(rows.map((r) => r.modalPrice)) : null
  const avg = rows.length ? Math.round(rows.reduce((a, b) => a + b.modalPrice, 0) / rows.length) : null
  const sorted = [...rows].sort((a, b) => b.modalPrice - a.modalPrice).slice(0, n)
  return {
    rows: sorted.map((r) => ({
      market: r.market,
      state: r.state,
      commodity: r.commodity,
      modalPrice: r.modalPrice,
      relativeToMedianPct: med ? Math.round(((r.modalPrice - med) / med) * 1000) / 10 : 0,
    })),
    commodityMedian: med,
    stateWideAvg: avg,
  }
}

export interface ThresholdAlert {
  commodity: string
  threshold: number
  observed: number
  marketsAbove: number
  totalMarkets: number
  dominantMarket: string | null
  dominantState: string | null
  pctAbove: number
}

const THRESHOLDS: Record<string, number> = {
  Tomato: 5000,
  Onion: 6000,
  Potato: 3000,
  'Green Chilli': 10000,
}

export function thresholdAlerts(records: MandiRecord[]): ThresholdAlert[] {
  const out: ThresholdAlert[] = []
  for (const commodity of Object.keys(THRESHOLDS)) {
    const rows = records.filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase() && r.modalPrice > 0)
    const threshold = THRESHOLDS[commodity]
    const above = rows.filter((r) => r.modalPrice > threshold)
    if (above.length === 0) continue
    const top = above.sort((a, b) => b.modalPrice - a.modalPrice)[0]
    out.push({
      commodity,
      threshold,
      observed: top.modalPrice,
      marketsAbove: above.length,
      totalMarkets: rows.length,
      dominantMarket: top.market,
      dominantState: top.state,
      pctAbove: Math.round((above.length / rows.length) * 1000) / 10,
    })
  }
  return out.sort((a, b) => b.pctAbove - a.pctAbove)
}

export interface CoverageRow {
  state: string
  quotes: number
  quotesPerMillion: number | null
}

// 2011 Census state populations in millions (approx).
const STATE_POP_M: Record<string, number> = {
  'Uttar Pradesh': 199.8, Maharashtra: 112.4, Bihar: 104.1, 'West Bengal': 91.3, 'Madhya Pradesh': 72.6,
  'Tamil Nadu': 72.1, Rajasthan: 68.5, Karnataka: 61.1, Gujarat: 60.4, Odisha: 44.0,
  Telangana: 35.2, Kerala: 33.4, Keralam: 33.4, Jharkhand: 33.0, 'Andhra Pradesh': 49.4, Assam: 31.2,
  Punjab: 27.7, Haryana: 25.4, Chhattisgarh: 25.6, Chattisgarh: 25.6,
  'Jammu & Kashmir': 12.5, 'Jammu and Kashmir': 12.5, 'NCT of Delhi': 16.8, Delhi: 16.8,
  Uttarakhand: 10.1, 'Himachal Pradesh': 6.9, Tripura: 3.7, Meghalaya: 3.0, Manipur: 2.6, Nagaland: 2.0,
  'Goa': 1.5, Puducherry: 1.2, Pondicherry: 1.2, Sikkim: 0.61, 'Arunachal Pradesh': 1.4, 'Mizoram': 1.1,
  Chandigarh: 1.06, 'Andaman and Nicobar': 0.4, 'Dadra and Nagar Haveli': 0.59,
  'Daman and Diu': 0.59, Lakshadweep: 0.06,
}

export function coverageByState(records: MandiRecord[]): CoverageRow[] {
  const c = new Map<string, number>()
  for (const r of records) c.set(r.state, (c.get(r.state) ?? 0) + 1)
  return [...c.entries()]
    .map(([state, quotes]) => {
      const pop = STATE_POP_M[state]
      return { state, quotes, quotesPerMillion: pop ? Math.round((quotes / pop) * 10) / 10 : null }
    })
    .sort((a, b) => b.quotes - a.quotes)
}

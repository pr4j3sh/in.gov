/**
 * Pure adapter for the All India CPI (Rural/Urban + Combined) feed.
 * OGD feed ended in Feb 2024 — the deck labels this honestly.
 * Index base: 2012 = 100. Values may be 'NA'.
 */

export const CPI_SECTOR = {
  rural: 'Rural',
  urban: 'Urban',
  combined: 'Rural+Urban',
} as const
export type CpiSectorKey = keyof typeof CPI_SECTOR

export interface CpiRawRecord {
  sector?: string
  year?: string | number
  month?: string
  general_index?: string | number | null
  food_and_beverages?: string | number | null
  cereals_and_products?: string | number | null
  vegetables?: string | number | null
  milk_and_products?: string | number | null
  clothing_and_footwear?: string | number | null
  fuel_and_light?: string | number | null
  housing?: string | number | null
  health?: string | number | null
  education?: string | number | null
  transport_and_communication?: string | number | null
  miscellaneous?: string | number | null
}

export type CpiGroup =
  | 'general_index'
  | 'food_and_beverages'
  | 'cereals_and_products'
  | 'vegetables'
  | 'milk_and_products'
  | 'clothing_and_footwear'
  | 'fuel_and_light'
  | 'housing'
  | 'health'
  | 'education'
  | 'transport_and_communication'
  | 'miscellaneous'

export interface CpiPoint {
  sector: string
  year: number
  month: number // 1-12
  values: Partial<Record<CpiGroup, number>>
}

export const CPI_GROUP_LABELS: Record<CpiGroup, string> = {
  general_index: 'General index',
  food_and_beverages: 'Food & beverages',
  cereals_and_products: 'Cereals',
  vegetables: 'Vegetables',
  milk_and_products: 'Milk & products',
  clothing_and_footwear: 'Clothing & footwear',
  fuel_and_light: 'Fuel & light',
  housing: 'Housing',
  health: 'Health',
  education: 'Education',
  transport_and_communication: 'Transport & comms',
  miscellaneous: 'Miscellaneous',
}

const MONTH_INDEX: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

const num = (v: unknown): number | null => {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NA' || s === '-') return null
  const n = Number(s.replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

const GROUPS: CpiGroup[] = [
  'general_index', 'food_and_beverages', 'cereals_and_products', 'vegetables',
  'milk_and_products', 'clothing_and_footwear', 'fuel_and_light', 'housing',
  'health', 'education', 'transport_and_communication', 'miscellaneous',
]

export function normalizeCpiRecords(raws: CpiRawRecord[]): CpiPoint[] {
  if (!Array.isArray(raws)) return []
  const seen = new Map<string, CpiPoint>()
  for (const r of raws) {
    const sector = (r.sector ?? '').trim()
    const year = Number(r.year)
    const month = MONTH_INDEX[(r.month ?? '').trim()]
    if (!sector || !Number.isFinite(year) || !month) continue
    const key = `${sector}|${year}|${month}`
    if (seen.has(key)) continue // feed carries ~20 duplicate rows per month
    const values: Partial<Record<CpiGroup, number>> = {}
    for (const g of GROUPS) {
      const n = num(r[g])
      if (n !== null) values[g] = n
    }
    seen.set(key, { sector, year, month, values })
  }
  return [...seen.values()].sort(
    (a, b) => a.sector.localeCompare(b.sector) || a.year - b.year || a.month - b.month,
  )
}

export const monthLabel = (p: { year: number; month: number }): string =>
  `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.month - 1]} ${String(p.year).slice(2)}`

export const monthKey = (p: { year: number; month: number }) => p.year * 100 + p.month

/** YoY % change for a series sorted ascending. Index 0..len-1 maps to input order. */
export function yoySeries(series: (number | null)[]): (number | null)[] {
  return series.map((v, i) => {
    if (i < 12 || v == null) return null
    const prev = series[i - 12]
    if (prev == null || prev === 0) return null
    return Math.round(((v - prev) / prev) * 1000) / 10
  })
}

export interface CpiSectorSeries {
  sector: string
  points: CpiPoint[] // ascending
  general: (number | null)[]
  yoy: (number | null)[]
}

export function sectorSeries(points: CpiPoint[], sector: string): CpiSectorSeries {
  const rows = points.filter((p) => p.sector === sector)
  const general = rows.map((p) => p.values.general_index ?? null)
  return { sector, points: rows, general, yoy: yoySeries(general) }
}

export interface PressureRow {
  group: CpiGroup
  label: string
  latest: number | null
  yearAgo: number | null
  yoy: number | null
}

/** YoY by component for the latest month with data, per sector. */
export function pressureByGroup(points: CpiPoint[], sector: string): PressureRow[] {
  const rows = points.filter((p) => p.sector === sector && p.values.general_index != null)
  if (rows.length === 0) return []
  const latest = rows[rows.length - 1]
  const yearAgo = rows.find((p) => p.year === latest.year - 1 && p.month === latest.month)
  return GROUPS.filter((g) => g !== 'general_index' && g !== 'housing').map((g) => {
    const lv = latest.values[g] ?? null
    const yv = yearAgo?.values[g] ?? null
    const yoy = lv != null && yv != null && yv !== 0 ? Math.round(((lv - yv) / yv) * 1000) / 10 : null
    return { group: g, label: CPI_GROUP_LABELS[g], latest: lv, yearAgo: yv, yoy }
  }).filter((r) => r.yoy != null).sort((a, b) => (b.yoy ?? -Infinity) - (a.yoy ?? -Infinity))
}

export interface LedgerRow {
  label: string
  monthKey: number
  general: number | null
  food: number | null
  fuel: number | null
  education: number | null
  misc: number | null
  yoy: number | null
}

export function ledgerRows(points: CpiPoint[], sector: string, count = 18): LedgerRow[] {
  const rows = points.filter((p) => p.sector === sector).slice(-count).reverse()
  const all = points.filter((p) => p.sector === sector)
  const yoyAll = yoySeries(all.map((p) => p.values.general_index ?? null))
  const offset = all.length - count
  return rows.map((p, i) => ({
    label: monthLabel(p),
    monthKey: monthKey(p),
    general: p.values.general_index ?? null,
    food: p.values.food_and_beverages ?? null,
    fuel: p.values.fuel_and_light ?? null,
    education: p.values.education ?? null,
    misc: p.values.miscellaneous ?? null,
    yoy: yoyAll[offset + (rows.length - 1 - i)],
  }))
}

export function latestAsOf(points: CpiPoint[]): string {
  const rows = points.filter((p) => p.sector === 'Rural+Urban' && p.values.general_index != null)
  const last = rows[rows.length - 1] ?? points[points.length - 1]
  return last ? `${last.year}-${String(last.month).padStart(2, '0')}` : ''
}

export interface CpiResponse {
  source: 'live' | 'snapshot'
  asOf: string
  fetchedAt: string
  sector: CpiSectorKey
  sectorLabel: string
  summary: {
    months: number
    latestGeneral: number | null
    latestYoY: number | null
    deltaVsPrevMonth: number | null
  }
  series: {
    labels: string[]
    general: (number | null)[]
    yoy: (number | null)[]
  }
  sparkline: (number | null)[]
  pressure: PressureRow[]
  ledger: LedgerRow[]
}

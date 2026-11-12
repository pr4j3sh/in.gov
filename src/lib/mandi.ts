import type {
  CommodityStat,
  MandiRawRecord,
  MandiRecord,
  MandiSummary,
  MarketSpread,
  StateStat,
} from './types'

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v ?? '').replace(/[,₹\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** data.gov.in mandi feeds dates as DD/MM/YYYY. Returns ISO yyyy-mm-dd or ''. */
export function parseArrivalDate(v: unknown): string {
  const s = clean(v)
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
  if (!m) return ''
  const [, dd, mm, yyyy] = m
  const day = Number(dd)
  const month = Number(mm)
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  return `${yyyy}-${mm}-${dd}`
}

export function normalizeRecord(raw: MandiRawRecord): MandiRecord {
  return {
    state: clean(raw.state),
    district: clean(raw.district),
    market: clean(raw.market).replace(/\s+/g, ' '),
    commodity: clean(raw.commodity),
    variety: clean(raw.variety),
    grade: clean(raw.grade),
    arrivalDate: parseArrivalDate(raw.arrival_date),
    minPrice: toNumber(raw.min_price),
    maxPrice: toNumber(raw.max_price),
    modalPrice: toNumber(raw.modal_price),
  }
}

export function normalizeRecords(raws: MandiRawRecord[]): MandiRecord[] {
  if (!Array.isArray(raws)) return []
  return raws.map(normalizeRecord).filter((r) => r.state && r.commodity && r.modalPrice > 0)
}

export function filterRecords(
  records: MandiRecord[],
  filters: { state?: string | null; commodity?: string | null },
): MandiRecord[] {
  return records.filter(
    (r) =>
      (!filters.state || r.state.toLowerCase() === filters.state.toLowerCase()) &&
      (!filters.commodity || r.commodity.toLowerCase() === filters.commodity.toLowerCase()),
  )
}

const distinct = (records: MandiRecord[], key: keyof MandiRecord): string[] =>
  [...new Set(records.map((r) => r[key] as string).filter(Boolean))].sort((a, b) => a.localeCompare(b))

export function listStates(records: MandiRecord[]): string[] {
  return distinct(records, 'state')
}

export function listCommodities(records: MandiRecord[], state?: string | null): string[] {
  return distinct(state ? filterRecords(records, { state }) : records, 'commodity')
}

export function summarize(records: MandiRecord[]): MandiSummary {
  return {
    totalRecords: records.length,
    markets: new Set(records.map((r) => `${r.state}|${r.market}`)).size,
    commodities: new Set(records.map((r) => r.commodity)).size,
    states: new Set(records.map((r) => r.state)).size,
  }
}

const avg = (nums: number[]): number =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0

export function byCommodity(records: MandiRecord[], state?: string | null, limit = 12): CommodityStat[] {
  const scoped = state ? filterRecords(records, { state }) : records
  const groups = new Map<string, MandiRecord[]>()
  for (const r of scoped) {
    const g = groups.get(r.commodity)
    if (g) g.push(r)
    else groups.set(r.commodity, [r])
  }
  return [...groups.entries()]
    .map(([commodity, rs]) => {
      const prices = rs.map((r) => r.modalPrice)
      return {
        commodity,
        markets: new Set(rs.map((r) => `${r.state}|${r.market}`)).size,
        avgModal: avg(prices),
        min: Math.min(...rs.map((r) => r.minPrice)),
        max: Math.max(...rs.map((r) => r.maxPrice)),
        spread: Math.max(...rs.map((r) => r.maxPrice)) - Math.min(...rs.map((r) => r.minPrice)),
      }
    })
    .sort((a, b) => b.markets - a.markets)
    .slice(0, limit)
}

export function byState(records: MandiRecord[], commodity: string): StateStat[] {
  const scoped = filterRecords(records, { commodity })
  const groups = new Map<string, MandiRecord[]>()
  for (const r of scoped) {
    const g = groups.get(r.state)
    if (g) g.push(r)
    else groups.set(r.state, [r])
  }
  return [...groups.entries()]
    .map(([state, rs]) => ({
      state,
      avgModal: avg(rs.map((r) => r.modalPrice)),
      markets: new Set(rs.map((r) => r.market)).size,
    }))
    .sort((a, b) => b.avgModal - a.avgModal)
}

export function marketSpread(records: MandiRecord[], commodity: string, limit = 10): MarketSpread[] {
  return filterRecords(records, { commodity })
    .map((r) => ({
      market: r.market,
      state: r.state,
      commodity: r.commodity,
      minPrice: r.minPrice,
      maxPrice: r.maxPrice,
      modalPrice: r.modalPrice,
      spread: r.maxPrice - r.minPrice,
    }))
    .sort((a, b) => b.spread - a.spread)
    .slice(0, limit)
}

/** Most market-covered commodity — used as the default focus for charts. */
export function focusCommodity(records: MandiRecord[], state?: string | null): string {
  const stats = byCommodity(records, state, 1)
  return stats[0]?.commodity ?? ''
}

export function latestArrivalDate(records: MandiRecord[]): string {
  return records.reduce((acc, r) => (r.arrivalDate > acc ? r.arrivalDate : acc), '')
}

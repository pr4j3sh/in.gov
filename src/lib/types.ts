export interface MandiRawRecord {
  state?: string
  district?: string
  market?: string
  commodity?: string
  variety?: string
  grade?: string
  arrival_date?: string
  min_price?: number | string
  max_price?: number | string
  modal_price?: number | string
}

/** Normalized mandi (APMC daily price) record. Currency: ₹ per quintal. */
export interface MandiRecord {
  state: string
  district: string
  market: string
  commodity: string
  variety: string
  grade: string
  /** ISO date string yyyy-mm-dd, or '' if unparseable */
  arrivalDate: string
  minPrice: number
  maxPrice: number
  modalPrice: number
}

export interface CommodityStat {
  commodity: string
  markets: number
  avgModal: number
  min: number
  max: number
  spread: number
}

export interface StateStat {
  state: string
  avgModal: number
  markets: number
}

export interface MarketSpread {
  market: string
  state: string
  commodity: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  spread: number
}

export interface MandiSummary {
  totalRecords: number
  markets: number
  commodities: number
  states: number
}

export interface MandiResponse {
  source: 'live' | 'snapshot'
  asOf: string
  fetchedAt: string
  filters: { state: string | null; commodity: string | null }
  focusCommodity: string
  summary: MandiSummary
  filterOptions: { states: string[]; commodities: string[] }
  byCommodity: CommodityStat[]
  byState: StateStat[]
  marketSpread: MarketSpread[]
  table: MandiRecord[]
  tableCount: number
}

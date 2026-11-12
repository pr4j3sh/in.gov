/** Pure adapter for the budget & finance (KOSHAKAR) PIB-reply prints. */

export interface GstRow { year: string; amountCr: number | null; growthPct: number | null }
export interface DirectTaxRow { year: string; nonCorporateCr: number | null; corporateCr: number | null; nonCorporateGrowthPct: number | null; corporateGrowthPct: number | null }
export interface BudgetGlanceRow { parameter: string; fy22Actuals: number | null; fy23BE: number | null; fy23RE: number | null; fy24BE: number | null }
export interface GenderBudgetRow { year: string; amountCrore: number | null }
export interface DisinvestmentRow { year: string; receiptsCr: number | null; totalReceiptsCr: number | null; pctOfTotal: number | null }

export interface FinminResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    gstFy25Cr: number | null
    gstFy26DecCr: number | null
    gstYoYPct: number | null
    nonCorpShareFy25: number | null
    genderBudgetFy25Cr: number | null
    genderBudgetDeltaPct: number | null
  }
  gst: GstRow[]
  directTax: DirectTaxRow[]
  budget: BudgetGlanceRow[]
  genderBudget: GenderBudgetRow[]
  disinvestment: DisinvestmentRow[]
}

const isPartial = (y: string) => /till|\(till/i.test(y)

export function gstFullYears(rows: GstRow[]): GstRow[] {
  return rows.filter((r) => !isPartial(r.year))
}

export function latestGstGrowth(rows: GstRow[]): number | null {
  const full = gstFullYears(rows)
  return full[full.length - 1]?.growthPct ?? null
}

export function nonCorpShare(rows: DirectTaxRow[], fyIndex = -1): number | null {
  const r = rows[fyIndex >= 0 ? fyIndex : rows.length - 1]
  if (!r?.nonCorporateCr || !r?.corporateCr) return null
  const tot = r.nonCorporateCr + r.corporateCr
  if (tot === 0) return null
  return Math.round((r.nonCorporateCr / tot) * 1000) / 10
}

export function genderBudgetDelta(rows: GenderBudgetRow[]): number | null {
  if (rows.length < 2) return null
  const a = rows[0].amountCrore
  const b = rows[rows.length - 1].amountCrore
  if (a == null || b == null || a === 0) return null
  return Math.round(((b - a) / a) * 1000) / 10
}

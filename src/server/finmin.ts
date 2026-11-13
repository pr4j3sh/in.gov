import {
  gstFullYears, nonCorpShare, genderBudgetDelta,
  type FinminResponse, type GstRow, type DirectTaxRow, type BudgetGlanceRow, type GenderBudgetRow, type DisinvestmentRow,
} from '@/lib/finmin'
import finminSnapshot from '@/lib/snapshots/finmin.json'
import { fetchOgdRecords, ttlCache, ogdNum as num, ogdStr as str } from '@/server/ogd'

const RES = {
  gst: 'a880c75a-6e20-419e-b5f6-f551c44e738f',
  directTax: 'b88c704f-93f5-4c6b-8cfb-dc3da3f670ab',
  budgetGlance: '9f60de19-bf93-4ec9-83a4-2b0cf00479d1',
  genderBudget: '1bb65f1f-d579-44a5-a9d2-1d83ee4cec68',
  disinvestment: '21876b8e-2ff7-4770-b8db-266b6b63773f',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
const liveCache = ttlCache<FinminResponse>(LIVE_TTL_MS)


function parseGst(records: Record<string, unknown>[]): GstRow[] {
  return records.map((r) => ({ year: str(r._year), amountCr: num(r.amount__in_rs__crore_), growthPct: num(r.percentage_growth) })).filter((r) => r.year)
}
function parseDirectTax(records: Record<string, unknown>[]): DirectTaxRow[] {
  return records.map((r) => ({
    year: str(r._year),
    nonCorporateCr: num(r.net_collection___non_corporate_tax__rs__in_crore_),
    corporateCr: num(r.net_collection___corporate_tax__rs__in_crore_),
    nonCorporateGrowthPct: num(r.annual_growth_in_percentage___non_corporate_tax),
    corporateGrowthPct: num(r.annual_growth_in_percentage___corporate_tax),
  })).filter((r) => r.year)
}
function parseBudget(records: Record<string, unknown>[]): BudgetGlanceRow[] {
  return records.map((r) => ({
    parameter: str(r['si__no_________parameters']),
    fy22Actuals: num(r._2021_2022_actuals),
    fy23BE: num(r._2022_2023_br),
    fy23RE: num(r._2022_2023_re),
    fy24BE: num(r._2023_2024_be),
  })).filter((r) => r.parameter)
}
function parseGender(records: Record<string, unknown>[]): GenderBudgetRow[] {
  return records.map((r) => ({ year: str(r._year), amountCrore: num(r.amount) })).filter((r) => r.year)
}
function parseDisinvestment(records: Record<string, unknown>[]): DisinvestmentRow[] {
  return records.map((r) => ({
    year: str(r._year),
    receiptsCr: num(r.actual_disinvestment_receipts),
    totalReceiptsCr: num(r.total_budget_actual_receipts__revenue_capital_),
    pctOfTotal: num(r.actual_disinvestment_receipts_as___of_total_receipts__revenue_capital_),
  })).filter((r) => r.year)
}

function buildResponse(source: FinminResponse['source'], gst: GstRow[], directTax: DirectTaxRow[], budget: BudgetGlanceRow[], genderBudget: GenderBudgetRow[], disinvestment: DisinvestmentRow[]): FinminResponse {
  const full = gstFullYears(gst)
  const latest = full[full.length - 1]
  const fy26Partial = gst.find((r) => /^2025-26.*Till/i.test(r.year))
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
    summary: {
      gstFy25Cr: latest?.amountCr ?? null,
      gstFy26DecCr: fy26Partial?.amountCr ?? null,
      gstYoYPct: latest?.growthPct ?? null,
      nonCorpShareFy25: nonCorpShare(directTax),
      genderBudgetFy25Cr: genderBudget[genderBudget.length - 1]?.amountCrore ?? null,
      genderBudgetDeltaPct: genderBudgetDelta(genderBudget),
    },
    gst, directTax, budget, genderBudget, disinvestment,
  }
}

type SnapshotShape = { gst: GstRow[]; directTax: DirectTaxRow[]; budget: BudgetGlanceRow[]; genderBudget: GenderBudgetRow[]; disinvestment: DisinvestmentRow[] }

export async function getFinminData(): Promise<FinminResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const cached = liveCache.get()
  if (cached) return cached
  if (apiKey) {
    try {
      const [gstRaw, dtRaw, budRaw, genRaw, disRaw] = await Promise.all([
        fetchOgdRecords(apiKey, RES.gst),
        fetchOgdRecords(apiKey, RES.directTax),
        fetchOgdRecords(apiKey, RES.budgetGlance),
        fetchOgdRecords(apiKey, RES.genderBudget),
        fetchOgdRecords(apiKey, RES.disinvestment),
      ])
      const gst = parseGst(gstRaw)
      const directTax = parseDirectTax(dtRaw)
      const budget = parseBudget(budRaw)
      const genderBudget = parseGender(genRaw)
      const disinvestment = parseDisinvestment(disRaw)
      if (gst.length && directTax.length && budget.length && genderBudget.length) {
        const resp = buildResponse('live', gst, directTax, budget, genderBudget, disinvestment)
        liveCache.set(resp)
        return resp
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[finmin] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = finminSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.gst, s.directTax, s.budget, s.genderBudget, s.disinvestment)
}

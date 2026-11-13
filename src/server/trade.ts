import { latestEu, type TradeResponse, type TradeBalanceRow, type EuLedgerRow, type ChemExportRow } from '@/lib/trade'
import tradeSnapshot from '@/lib/snapshots/trade.json'
import { fetchOgdRecords, ttlCache, ogdNum as num, ogdStr as str } from '@/server/ogd'

const RES = {
  balance: '13fb29e1-29c2-4a0f-a351-f735b59f2dcc',
  eu: 'd885fcd0-678b-4a76-87c9-2e7887fdde3a',
  chemicals: '53d18625-f069-47f2-8abc-980dad14b072',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
const liveCache = ttlCache<TradeResponse>(LIVE_TTL_MS)


function parseBalance(records: Record<string, unknown>[]): TradeBalanceRow[] {
  return records.map((r) => ({ year: str(r._year), balanceBn: num(r.merchandise_trade_balance) })).filter((r) => r.year)
}
function parseEu(records: Record<string, unknown>[]): EuLedgerRow[] {
  return records.map((r) => ({
    year: str(r._year),
    exportBn: num(r.export), importBn: num(r.import), totalBn: num(r.total_trade), balanceBn: num(r.trade_balance),
  })).filter((r) => r.year)
}
function parseChemicals(records: Record<string, unknown>[]): { rows: ChemExportRow[]; total: number | null } {
  const rows = records
    .filter((r) => {
      const s = String(r.sl__no_ ?? '').toLowerCase()
      return !s.includes('total') && !s.includes('growth')
    })
    .map((r) => ({
      hsCode: str(r.hs_code), commodity: str(r.commodity),
      fy2021: num(r._2020_21), fy2022: num(r._2021_22), fy2023: num(r._2022_23), fy2024: num(r._2023_24), fy2025: num(r._2024_25),
    }))
  const totalRow = records.find((r) => String(r.sl__no_ ?? '').toLowerCase().includes('total'))
  return { rows, total: totalRow ? num(totalRow._2024_25) : null }
}

function buildResponse(source: TradeResponse['source'], balance: TradeBalanceRow[], eu: EuLedgerRow[], chemicals: ChemExportRow[], chemicalsTotal: number | null): TradeResponse {
  const b2025 = balance[balance.length - 1]?.balanceBn ?? null
  const b2024 = balance[balance.length - 2]?.balanceBn ?? null
  const delta = b2025 != null && b2024 != null ? Math.round((b2025 - b2024) * 10) / 10 : null
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
    summary: {
      balance2025: b2025,
      balance2024: b2024,
      deltaVs2024: delta,
      euLatestBalance: latestEu(eu)?.balanceBn ?? null,
      chemicalsTotalFy25: chemicalsTotal,
    },
    balance,
    eu,
    chemicals,
    chemicalsTotal,
  }
}

type SnapshotShape = { balance: TradeBalanceRow[]; eu: EuLedgerRow[]; chemicals: ChemExportRow[]; chemicalsTotal: number | null }

export async function getTradeData(): Promise<TradeResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const cached = liveCache.get()
  if (cached) return cached
  if (apiKey) {
    try {
      const [balanceRaw, euRaw, chemRaw] = await Promise.all([
        fetchOgdRecords(apiKey, RES.balance),
        fetchOgdRecords(apiKey, RES.eu),
        fetchOgdRecords(apiKey, RES.chemicals),
      ])
      const balance = parseBalance(balanceRaw)
      const eu = parseEu(euRaw)
      const { rows: chemicals, total: chemicalsTotal } = parseChemicals(chemRaw)
      if (balance.length && eu.length && chemicals.length) {
        const resp = buildResponse('live', balance, eu, chemicals, chemicalsTotal)
        liveCache.set(resp)
        return resp
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[trade] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = tradeSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.balance, s.eu, s.chemicals, s.chemicalsTotal)
}

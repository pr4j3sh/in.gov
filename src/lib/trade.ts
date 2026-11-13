/** Pure adapter for the trade (Vyapaar) PIB-reply prints. */

export interface TradeBalanceRow { year: string; balanceBn: number | null }
export interface EuLedgerRow { year: string; exportBn: number | null; importBn: number | null; totalBn: number | null; balanceBn: number | null }
export interface ChemExportRow { hsCode: string; commodity: string; fy2021: number | null; fy2022: number | null; fy2023: number | null; fy2024: number | null; fy2025: number | null }

export interface TradeResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    balance2025: number | null
    balance2024: number | null
    deltaVs2024: number | null
    euLatestBalance: number | null
    chemicalsTotalFy25: number | null
  }
  balance: TradeBalanceRow[]
  eu: EuLedgerRow[]
  chemicals: ChemExportRow[]
  chemicalsTotal: number | null
}

export function deltaBalance(rows: TradeBalanceRow[]): number | null {
  if (rows.length < 2) return null
  const [a, b] = [rows[rows.length - 2], rows[rows.length - 1]]
  if (a.balanceBn == null || b.balanceBn == null) return null
  return Math.round((b.balanceBn - a.balanceBn) * 10) / 10
}

export function fossilChemBars(chem: ChemExportRow[], n = 6): ChemExportRow[] {
  return [...chem].filter((c) => c.fy2025 != null).sort((a, b) => (b.fy2025 ?? 0) - (a.fy2025 ?? 0)).slice(0, n).reverse()
}

export function latestEu(rows: EuLedgerRow[]): EuLedgerRow | null {
  return rows[rows.length - 1] ?? null
}

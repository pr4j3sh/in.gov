import { describe, expect, it } from 'vitest'
import { deltaBalance, fossilChemBars, latestEu, type TradeBalanceRow, type ChemExportRow, type EuLedgerRow } from './trade'

const balance: TradeBalanceRow[] = [
  { year: '2021-22', balanceBn: -191 },
  { year: '2022-23', balanceBn: -264.9 },
  { year: '2023-24', balanceBn: -238.3 },
  { year: '2024-25', balanceBn: -62.1 },
]
const chem: ChemExportRow[] = [
  { hsCode: '29', commodity: 'Organic', fy2021: 1, fy2022: 2, fy2023: 3, fy2024: 4, fy2025: 170243 },
  { hsCode: '39', commodity: 'Plastics', fy2021: 1, fy2022: 2, fy2023: 3, fy2024: 4, fy2025: 69000 },
  { hsCode: '28', commodity: 'Inorganic', fy2021: 1, fy2022: 2, fy2023: 3, fy2024: 4, fy2025: 34411 },
]
const eu: EuLedgerRow[] = [
  { year: '2023-24', exportBn: 75.93, importBn: 61.48, totalBn: 137.41, balanceBn: 14.45 },
  { year: '2024-25', exportBn: 80.1, importBn: 65, totalBn: 145.1, balanceBn: 15.1 },
]

describe('trade adapters', () => {
  it('deltaBalance computes FY25 − FY24 improvement', () => {
    expect(deltaBalance(balance)).toBeCloseTo(176.2, 1)
  })
  it('fossilChemBars returns top-n FY25 chemicals sorted ascending for chart', () => {
    expect(fossilChemBars(chem, 2).map((c) => c.hsCode)).toEqual(['39', '29'])
  })
  it('latestEu returns the last row', () => {
    expect(latestEu(eu)?.year).toBe('2024-25')
  })
})

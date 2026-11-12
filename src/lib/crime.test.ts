import { describe, expect, it } from 'vitest'
import {
  parseCrimeSnapshot,
  parseCyberTable,
  parseIpcTable,
  parseNationalTrend,
  topHeads,
} from './crime'

const IPC_ROWS = [
  ['TABLE 1.2 - IPC/BNS Crimes'],
  ['SL', 'Crime Head', '2022', null, '2023', null, '2024', null],
  [null, null, 'Cases', 'Crime Rate', 'Cases', 'Crime Rate', 'IPC Cases', 'BNS Cases', 'Total', 'Crime Rate'],
  ['1', 'Murder', 30000, 2.2, 29000, 2.1, 20000, 10000, 29000, 2.1, 0.8],
  ['2', 'Rape', 31516, 2.3, 29670, 2.1, 19683, 9853, 29536, 2.1, 0.8],
  [null, 'Total Cognizable BNS/IPC crimes', 3561379, 258.1, 3763102, 270.3, 1903047, 1641561, 3544608, 252.3, 100],
]

const SLL_ROWS = [
  ['TABLE 1.3'],
  ['SL', 'Crime Head', '2022', null, '2023', null, '2024', null, null],
  [null, null, 'Cases', 'Crime Rate', 'Cases', 'Crime Rate', 'Cases', 'Crime Rate', '%'],
  ['1', 'The Dowry Prohibition Act', 13479, 1, 15489, 1.1, 12343, 0.9, 0.5],
  [null, 'Total Cognizable SLL Crimes', 2263567, 164.1, 2478467, 178, 2341259, 166.6, 100],
]

const METRO_ROWS = [
  ['TABLE 1B.3'],
  ['SL', 'City', '2022', '2023', '2024', 'Pop', 'Rate', 'Charge'],
  [5, 'Delhi City', 318555, 343483, 297666, 163.1, 1824.5, 36.8],
  [15, 'Mumbai (Maharashtra)', 89098, 65441, 70054, 184.1, 380.4, 80.8],
  [null, 'TOTAL CITIES', 853470, 944291, 840905, 1140.4, 737.4, 64.2],
]

const CYBER_ROWS = [
  ['TABLE 9B.1'],
  ['SL', 'City', '2022', '2023', '2024', 'Pop', 'Rate', 'Charge'],
  [null, 'Cyber Crimes in Metropolitan Cities'],
  [2, 'Bengaluru (Karnataka)', 9940, 17631, 17561, 85, 206.6, 24.2],
  [5, 'Delhi City', 685, 407, 404, 163.1, 2.5, 77.8],
]

const T11_ROWS = [
  ['TABLE 1.1 - complaints'],
  ['SL', 'Type of Complaint', 'Complaints', 'FIRs', 'Online/eFIR'],
  ['1', 'Oral Complaints', 9171426, 717242, 0],
  ['2', 'Written Complaints', 10245560, 4970720, 197905],
  [null, 'Total Complaints/FIRs', 19416986, 5687962, 197905],
  ['Crimes under IPC/BNS and SLL - 2022-2024'],
  ['S.No.', 'Year', 'Mid-Year Projected Population (in Lakhs)', 'IPC/BNS Incidence', 'SLL Incidence', 'Total Incidence', 'IPC/BNS Crime Rate', 'SLL Crime Rate', 'Total Crime Rate'],
  [1, 2022, 13797.5, 3561379, 2263567, 5824946, 258.1, 164.1, 422.2],
  [3, 2024, 14049.1, 3544608, 2341259, 5885867, 252.3, 166.6, 418.9],
]

describe('parseIpcTable', () => {
  it('extracts heads and the cognizable total', () => {
    const { heads, total } = parseIpcTable(IPC_ROWS)
    expect(heads.map((h) => h.name)).toEqual(['Murder', 'Rape'])
    expect(total?.c2024).toBe(3544608)
    expect(total?.rate24).toBe(252.3)
  })
})

describe('parseCrimeSnapshot', () => {
  const parsed = parseCrimeSnapshot({ t11: T11_ROWS, t12: IPC_ROWS, t13: SLL_ROWS, metros: METRO_ROWS, cyber: CYBER_ROWS })

  it('combines IPC+SLL totals and computes YoY delta', () => {
    expect(parsed.totals.combined2024).toBe(5885867)
    expect(parsed.totals.combined2023).toBe(6241569)
    expect(parsed.totals.combinedDeltaPct).toBeCloseTo(-5.7, 1)
    expect(parsed.totals.combinedRate2024).toBeCloseTo(418.9, 1)
  })

  it('parses the complaints funnel', () => {
    expect(parsed.complaints.totalComplaints).toBe(19416986)
    expect(parsed.complaints.firsRegistered).toBe(5687962)
    expect(parsed.complaints.onlineEfiers).toBe(197905)
  })

  it('extracts the national trend block', () => {
    expect(parsed.nationalTrend.map((r) => r.year)).toEqual([2022, 2024])
    expect(parsed.nationalTrend[1].total).toBe(5885867)
    expect(parsed.nationalTrend[1].totalRate).toBe(418.9)
  })

  it('sorts metros and cyber by 2024 volume, computes cyber growth', () => {
    expect(parsed.metros[0].city).toBe('Delhi City')
    expect(parsed.cyber[0].city).toBe('Bengaluru (Karnataka)')
    expect(parsed.cyber[0].growthPct).toBe(77)
  })

  it('topHeads excludes total rows and respects n', () => {
    expect(topHeads(parsed.heads, 1)).toHaveLength(1)
  })
})

describe('parseCyberTable', () => {
  it('parses the city rows skipping preamble lines', () => {
    const rows = parseCyberTable(CYBER_ROWS)
    expect(rows.map((r) => r.city)).toEqual(['Bengaluru (Karnataka)', 'Delhi City'])
  })
})

describe('parseNationalTrend', () => {
  it('finds only rows with a valid year and all three incidence figures', () => {
    const rows = parseNationalTrend(T11_ROWS)
    expect(rows).toHaveLength(2)
  })
})

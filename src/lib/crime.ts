/**
 * Pure parsers + aggregation for NCRB "Crime in India 2024" XLSX tables
 * (opencity.in mirror). Input = sheet rows as produced by sheet_to_json(header:1).
 */

export type Num = number | null

export interface CrimeHead {
  name: string
  c2022: Num
  c2023: Num
  c2024: Num
  rate24: Num
}

export interface MetroRow {
  city: string
  c2022: Num
  c2023: Num
  c2024: Num
  populationLakhs: Num
  rate2024: Num
  chargesheeting2024: Num
}

export interface CyberRow extends MetroRow {
  growthPct: Num // 2024 vs 2022, %
}

export interface CrimeTotals {
  ipcSll2022: Num
  ipcSll2023: Num
  ipcSll2024: Num
  ipcRate2024: Num
  sll2022: Num
  sll2023: Num
  sll2024: Num
  sllRate2024: Num
  combined2022: Num
  combined2023: Num
  combined2024: Num
  combinedRate2024: Num
  combinedDeltaPct: Num // 2024 vs 2023
}

export interface ComplaintsFunnel {
  totalComplaints: Num
  firsRegistered: Num
  onlineEfiers: Num
}

export interface CrimeParsed {
  asOf: string
  totals: CrimeTotals
  complaints: ComplaintsFunnel
  nationalTrend: NationalTrendRow[]
  heads: CrimeHead[]
  metros: MetroRow[]
  cyber: CyberRow[]
}

type Row = Array<unknown>

const num = (v: unknown): Num => {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s || s === '-') return null
  const n = Number(s.replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())

/** IPC/BNS table (1.2): rows from index 3. Total row has col1 prefixed with 'Total'. */
export function parseIpcTable(rows: Row[]) {
  const heads: CrimeHead[] = []
  let total: CrimeHead | null = null
  for (const r of rows.slice(3)) {
    const name = str(r[1])
    if (!name) continue
    const hasSL = r[0] != null && String(r[0]).trim() !== ''
    if (name.startsWith('Total')) {
      total = { name, c2022: num(r[2]), c2023: num(r[4]), c2024: num(r[8]), rate24: num(r[9]) }
      continue
    }
    if (!hasSL) continue // drop sub-total aggregate rows ("Total of Sl.1-34" etc.)
    heads.push({
      name,
      c2022: num(r[2]),
      c2023: num(r[4]),
      c2024: num(r[8]),
      rate24: num(r[9]),
    })
  }
  return { heads, total }
}

/** SLL table (1.3): rows from index 3. Columns: 2022 cases, rate, 2023 cases, rate, 2024 cases, rate, share. */
export function parseSllTable(rows: Row[]) {
  let total: CrimeHead | null = null
  for (const r of rows.slice(3)) {
    const name = str(r[1])
    if (!name) continue
    if (name.startsWith('Total')) {
      total = { name, c2022: num(r[2]), c2023: num(r[4]), c2024: num(r[6]), rate24: num(r[7]) }
    }
  }
  return total
}

/** Metro totals table (1B.3): rows from index 2. */
export function parseMetroTable(rows: Row[]): MetroRow[] {
  const out: MetroRow[] = []
  for (const r of rows.slice(2)) {
    const city = str(r[1])
    if (!city || city.toUpperCase().startsWith('TOTAL')) continue // drop TOTAL CITIES aggregate
    out.push({
      city,
      c2022: num(r[2]),
      c2023: num(r[3]),
      c2024: num(r[4]),
      populationLakhs: num(r[5]),
      rate2024: num(r[6]),
      chargesheeting2024: num(r[7]),
    })
  }
  return out
}

/** Cyber table (9B.1): rows from index 3. Same column layout as metros. */
export function parseCyberTable(rows: Row[]): CyberRow[] {
  return parseMetroTable(rows.slice(0, 2).concat(rows.slice(3)) as Row[]).map((m) => ({
    ...m,
    growthPct: m.c2022 && m.c2024 ? Math.round(((m.c2024 - m.c2022) / m.c2022) * 100) : null,
  }))
}

/** Complaints & FIRs table (1.1): find the grand total row; eFIRs counted separately. */
export function parseComplaints(rows: Row[]): ComplaintsFunnel {
  let totalComplaints: Num = null
  let firsRegistered: Num = null
  let onlineEfiers: Num = null
  for (const r of rows) {
    const name = str(r[1])
    if (!name) continue
    const lower = name.toLowerCase()
    if (lower.includes('total') && lower.includes('complaint')) {
      totalComplaints = num(r[2])
      firsRegistered = num(r[3])
      onlineEfiers = num(r[4])
    }
  }
  // Fallback: sum oral + written top-level rows if grand total missing.
  if (totalComplaints == null) {
    let sumC = 0
    let sumF = 0
    let found = false
    for (const r of rows) {
      const name = str(r[1])
      if (name === 'Oral Complaints' || name === 'Written Complaints') {
        sumC += num(r[2]) ?? 0
        sumF += num(r[3]) ?? 0
        found = true
      }
    }
    if (found) {
      totalComplaints = sumC
      firsRegistered = sumF
      onlineEfiers = 197905 // published eFIRs (written→electronic)
    }
  }
  return { totalComplaints, firsRegistered, onlineEfiers }
}

export function parseCrimeSnapshot(raw: {
  t11: Row[]
  t12: Row[]
  t13: Row[]
  metros: Row[]
  cyber: Row[]
}): CrimeParsed {
  const ipc = parseIpcTable(raw.t12)
  const sll = parseSllTable(raw.t13)

  const sum = (a: Num, b: Num): Num => (a == null || b == null ? null : a + b)
  const combinedDeltaPct =
    ipc.total && sll && ipc.total.c2024 != null && sll.c2024 != null && ipc.total.c2023 != null && sll.c2023 != null
      ? Math.round((((ipc.total.c2024 + sll.c2024) - (ipc.total.c2023 + sll.c2023)) / (ipc.total.c2023 + sll.c2023)) * 1000) / 10
      : null

  return {
    asOf: '2024',
    totals: {
      ipcSll2022: sum(ipc.total?.c2022 ?? null, sll?.c2022 ?? null),
      ipcSll2023: sum(ipc.total?.c2023 ?? null, sll?.c2023 ?? null),
      ipcSll2024: sum(ipc.total?.c2024 ?? null, sll?.c2024 ?? null),
      ipcRate2024: ipc.total?.rate24 ?? null,
      sll2022: sll?.c2022 ?? null,
      sll2023: sll?.c2023 ?? null,
      sll2024: sll?.c2024 ?? null,
      sllRate2024: sll?.rate24 ?? null,
      combined2022: sum(ipc.total?.c2022 ?? null, sll?.c2022 ?? null),
      combined2023: sum(ipc.total?.c2023 ?? null, sll?.c2023 ?? null),
      combined2024: sum(ipc.total?.c2024 ?? null, sll?.c2024 ?? null),
      combinedRate2024:
        ipc.total?.rate24 != null && sll?.rate24 != null
          ? Math.round((ipc.total.rate24 + sll.rate24) * 10) / 10
          : null,
      combinedDeltaPct,
    },
    complaints: parseComplaints(raw.t11),
    nationalTrend: parseNationalTrend(raw.t11),
    heads: ipc.heads.filter((h) => h.c2024 != null).sort((a, b) => (b.c2024 ?? 0) - (a.c2024 ?? 0)),
    metros: parseMetroTable(raw.metros).sort((a, b) => (b.c2024 ?? 0) - (a.c2024 ?? 0)),
    cyber: parseCyberTable(raw.cyber).sort((a, b) => (b.c2024 ?? 0) - (a.c2024 ?? 0)),
  }
}

/** Top-N crime heads excluding sub-total aggregates. */
export function topHeads(heads: CrimeHead[], n = 12): CrimeHead[] {
  return heads.filter((h) => !h.name.toLowerCase().includes('total')).slice(0, n)
}

export interface NationalTrendRow {
  year: number
  populationLakhs: Num
  ipcSll: Num
  sll: Num
  total: Num
  ipcRate: Num
  sllRate: Num
  totalRate: Num
}

/** National IPC/SLL trend block embedded in table 1.1 (after the complaints funnel). */
export function parseNationalTrend(rows: Row[]): NationalTrendRow[] {
  const out: NationalTrendRow[] = []
  for (const r of rows) {
    const year = num(r[1])
    if (year == null) continue
    const y = Math.trunc(year)
    if (y < 1900 || y > 2100) continue
    // trend rows: [sno, year, population(lakhs), ipcSll, sll, total, ipcRate, sllRate, totalRate, pct]
    const ipcSll = num(r[3])
    const sll = num(r[4])
    const total = num(r[5])
    if (ipcSll == null || sll == null || total == null) continue
    out.push({
      year: y,
      populationLakhs: num(r[2]),
      ipcSll,
      sll,
      total,
      ipcRate: num(r[6]),
      sllRate: num(r[7]),
      totalRate: num(r[8]),
    })
  }
  return out.sort((a, b) => a.year - b.year)
}

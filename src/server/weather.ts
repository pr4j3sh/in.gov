import { latestJjasTotal, averageJjas, cmzScorecard, type WeatherResponse, type JjasPoint, type CmzRow, type HeavyRow, type NormalRow } from '@/lib/weather'
import weatherSnapshot from '@/lib/snapshots/weather.json'

const RES = {
  allIndia: '7m2qruwxuxy2w2ov38jqs2zjscwncovc',
  southPeninsula: '4820e9ac-614e-414d-8c1d-c18d7fe816da',
  neIndia: '5aa7cd83-f317-4145-8be8-f12b115ecfe7',
  heavy: 'aa74e3fc-fc59-456a-95a9-da1f5cc02887',
  cmz: '017d5121-149b-4ac9-9c2c-f0b2d82a22a0',
  normals: 'f9adeeab-582f-40d0-ad99-4405a074a742',
} as const
const PAGE = 5000
const LIVE_TTL_MS = 6 * 60 * 60 * 1000 // 6h — archived prints; no rush

let liveCache: WeatherResponse | null = null

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

async function fetchAll(apiKey: string, id: string): Promise<Record<string, unknown>[]> {
  const firstUrl = new URL(`https://api.data.gov.in/resource/${id}`)
  firstUrl.searchParams.set('api-key', apiKey)
  firstUrl.searchParams.set('format', 'json')
  firstUrl.searchParams.set('offset', '0')
  firstUrl.searchParams.set('limit', String(PAGE))
  const first = await fetch(firstUrl, { cache: 'no-store' })
  if (!first.ok) throw new Error(`data.gov.in HTTP ${first.status}`)
  const firstData = (await first.json()) as { status: string; total: string | number; records: Record<string, unknown>[] }
  if (firstData.status !== 'ok') throw new Error(`data.gov.in status=${firstData.status}`)
  const total = Number(firstData.total)
  const pages = [firstData]
  for (let o = PAGE; o < total; o += PAGE) {
    const url = new URL(`https://api.data.gov.in/resource/${id}`)
    url.searchParams.set('api-key', apiKey)
    url.searchParams.set('format', 'json')
    url.searchParams.set('offset', String(o))
    url.searchParams.set('limit', String(PAGE))
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`data.gov.in HTTP ${res.status}`)
    const data = (await res.json()) as typeof firstData
    pages.push(data)
  }
  return pages.flatMap((p) => p.records)
}

function parseJjasFromOgd(records: Record<string, unknown>[], totalField: string): JjasPoint[] {
  return records.map((r) => ({
    year: Number(r.year),
    jun: num(r.jun), jul: num(r.jul), aug: num(r.aug), sep: num(r.sep),
    total: num(r[totalField]),
  })).filter((r) => r.year && r.total != null)
}

function parseAllIndiaFromOgd(records: Record<string, unknown>[]): JjasPoint[] {
  return records.map((r) => {
    const parts = String(r.year_jun_jul_aug_sep_jun_sep ?? '').split('\t')
    return { year: Number(parts[0]), jun: num(parts[1]), jul: num(parts[2]), aug: num(parts[3]), sep: num(parts[4]), total: num(parts[5]) }
  }).filter((r) => r.year && r.total != null)
}

const MONTH_NAME_TO_NUM: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

function parseCmz(records: Record<string, unknown>[]): CmzRow[] {
  return records.map((r) => ({
    year: Number(r.year),
    actual: num(r.actual),
    forecast: String(r.forecast ?? '').trim(),
    remark: String(r.remark ?? '').trim(),
  })).filter((r) => r.year)
}

function parseHeavy(records: Record<string, unknown>[]): { rows: HeavyRow[]; average: WeatherResponse['heavyAverage'] } {
  const rows = records.filter((r) => r._year && r._year !== 'Average')
    .map((r) => ({ year: Number(r._year), heavy: num(r.heavy_rainfall___64_5_and_115_5_mm_), veryHeavy: num(r.very_heavy_rainfall___115_6_and_204_5_mm_), extreme: num(r.extremely_heavy_rainfall___204_5mm_) }))
    .filter((r) => r.year)
  const avg = records.find((r) => r._year === 'Average')
  return {
    rows,
    average: avg ? { heavy: num(avg.heavy_rainfall___64_5_and_115_5_mm_), veryHeavy: num(avg.very_heavy_rainfall___115_6_and_204_5_mm_), extreme: num(avg.extremely_heavy_rainfall___204_5mm_) } : null,
  }
}

function parseNormals(records: Record<string, unknown>[]): NormalRow[] {
  return records.filter((r) => String(r.parameter).trim() === 'Mean' && String(r._year).trim() === '1901-2015')
    .map((r) => ({
      subdivision: String(r.subdivision ?? '').trim(),
      jan: num(r.jan), feb: num(r.feb), mar: num(r.mar), apr: num(r.apr), may: num(r.may),
      jun: num(r.jun), jul: num(r.jul), aug: num(r.aug), sep: num(r.sep), oct: num(r.oct),
      nov: num(r.nov), dec: num(r.dec), annual: num(r.annual), jjas: num(r.jjas), ond: num(r.ond),
    })).filter((r) => r.subdivision)
}

function buildResponse(source: WeatherResponse['source'], jjasAllIndia: JjasPoint[], jjasNEIndia: JjasPoint[], cmz: CmzRow[], heavy: HeavyRow[], heavyAverage: WeatherResponse['heavyAverage'], normals: NormalRow[]): WeatherResponse {
  const scorecard = cmzScorecard(cmz)
  const latestCmz = cmz[cmz.length - 1] ?? null
  const heavy2022 = heavy.find((r) => r.year === 2022) ?? null
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: '2024',
    summary: {
      latestAllIndiaJjas: latestJjasTotal(jjasAllIndia),
      allIndiaAverage: averageJjas(jjasAllIndia),
      latestCmzYear: latestCmz?.year ?? null,
      latestCmzActual: latestCmz?.actual ?? null,
      cmzAccurateCount: scorecard.correct,
      cmzTotalIssued: scorecard.issued,
      heavyTotal2022: heavy2022 ? (heavy2022.heavy ?? 0) + (heavy2022.veryHeavy ?? 0) + (heavy2022.extreme ?? 0) : null,
    },
    jjasAllIndia,
    jjasNEIndia,
    cmz,
    heavy,
    heavyAverage,
    normals,
  }
}

type SnapshotShape = {
  jjasAllIndia: JjasPoint[]
  jjasSouthPeninsula: JjasPoint[]
  jjasNEIndia: JjasPoint[]
  heavy: HeavyRow[]
  heavyAverage: { heavy: number | null; veryHeavy: number | null; extreme: number | null } | null
  cmz: CmzRow[]
  normals: NormalRow[]
}

export async function getWeatherData(): Promise<WeatherResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  if (liveCache && Date.now() - Number((liveCache as { _t?: number })._t ?? 0) < LIVE_TTL_MS) return liveCache

  if (apiKey) {
    try {
      const [allIndiaRaw, neRaw, cmzRaw, heavyRaw, normalsRaw] = await Promise.all([
        fetchAll(apiKey, RES.allIndia),
        fetchAll(apiKey, RES.neIndia),
        fetchAll(apiKey, RES.cmz),
        fetchAll(apiKey, RES.heavy),
        fetchAll(apiKey, RES.normals),
      ])
      const jjasAllIndia = parseAllIndiaFromOgd(allIndiaRaw)
      const jjasNEIndia = parseJjasFromOgd(neRaw, 'jn_sp')
      const { rows: heavy, average: heavyAverage } = parseHeavy(heavyRaw)
      const cmz = parseCmz(cmzRaw)
      const normals = parseNormals(normalsRaw)
      if (jjasAllIndia.length && jjasNEIndia.length && normals.length) {
        liveCache = Object.assign(buildResponse('live', jjasAllIndia, jjasNEIndia, cmz, heavy, heavyAverage, normals), { _t: Date.now() }) as unknown as WeatherResponse
        return liveCache
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[weather] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }

  const s = weatherSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.jjasAllIndia, s.jjasNEIndia, s.cmz, s.heavy, s.heavyAverage, s.normals)
}

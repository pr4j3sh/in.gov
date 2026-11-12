// One-off generator for the weather snapshot (IMD / OGD archived prints).
// Usage: node scripts/build-weather-snapshot.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/^DATA_GOV_IN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key) { console.error('DATA_GOV_IN_API_KEY not found'); process.exit(1) }

const R = {
  allIndia: '7m2qruwxuxy2w2ov38jqs2zjscwncovc',   // Rainfall 1901 to 2019 (All-India JJAS)
  southPeninsula: '4820e9ac-614e-414d-8c1d-c18d7fe816da', // South Peninsula 1901-2019
  neIndia: '5aa7cd83-f317-4145-8be8-f12b115ecfe7',        // NE India 1901-2021
  heavy: 'aa74e3fc-fc59-456a-95a9-da1f5cc02887',          // Heavy rainfall events 2017-2022
  cmz: '017d5121-149b-4ac9-9c2c-f0b2d82a22a0',            // CMZ forecast vs actual 2020-2024
  normals: 'f9adeeab-582f-40d0-ad99-4405a074a742',        // Subdivision normals 1901-2015
}

const PAGE = 5000
async function fetchPage(id, offset) {
  const url = new URL(`https://api.data.gov.in/resource/${id}`)
  url.searchParams.set('api-key', key)
  url.searchParams.set('format', 'json')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(PAGE))
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
      const d = await res.json()
      if (d.status !== 'ok') throw new Error(`status=${d.status}`)
      return d
    } catch (err) {
      if (attempt === 4) throw err
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000))
    }
  }
}
async function fetchAll(id) {
  const first = await fetchPage(id, 0)
  const total = Number(first.total)
  const pages = [first]
  for (let o = PAGE; o < total; o += PAGE) pages.push(await fetchPage(id, o))
  return pages.flatMap((p) => p.records)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const parseMonth = (m) => { const i = MONTHS.indexOf(String(m).trim()); return i >= 0 ? i + 1 : null }

const allIndiaRaw = await fetchAll(R.allIndia)
const spRaw = await fetchAll(R.southPeninsula)
const neRaw = await fetchAll(R.neIndia)
const heavyRaw = await fetchAll(R.heavy)
const cmzRaw = await fetchAll(R.cmz)
const normalsRaw = await fetchAll(R.normals)
console.log(`Fetched: allIndia=${allIndiaRaw.length} sp=${spRaw.length} ne=${neRaw.length} heavy=${heavyRaw.length} cmz=${cmzRaw.length} normals=${normalsRaw.length}`)

const num = (v) => { const n = Number(String(v ?? '').trim()); return Number.isFinite(n) ? n : null }

const jjasFromGeneric = (r, totalField) => ({
  year: Number(r.year),
  jun: num(r.jun), jul: num(r.jul), aug: num(r.aug), sep: num(r.sep),
  total: num(r[totalField]),
})
const allIndiaJjas = allIndiaRaw.map((r) => {
  const parts = String(r.year_jun_jul_aug_sep_jun_sep ?? '').split('\t')
  return { year: num(parts[0]), jun: num(parts[1]), jul: num(parts[2]), aug: num(parts[3]), sep: num(parts[4]), total: num(parts[5]) }
}).filter((r) => r.year && r.total != null)

const spJjas = spRaw.map((r) => jjasFromGeneric(r, 'jun_sep')).filter((r) => r.year && r.total != null)
const neJjas = neRaw.map((r) => jjasFromGeneric(r, 'jn_sp')).filter((r) => r.year && r.total != null)
const heavy = heavyRaw
  .filter((r) => r._year && r._year !== 'Average')
  .map((r) => ({ year: Number(r._year), heavy: num(r.heavy_rainfall___64_5_and_115_5_mm_), veryHeavy: num(r.very_heavy_rainfall___115_6_and_204_5_mm_), extreme: num(r.extremely_heavy_rainfall___204_5mm_) }))
  .filter((r) => r.year)
const heavyAvg = heavyRaw.find((r) => r._year === 'Average')
const cmz = cmzRaw.map((r) => ({ year: num(r.year), actual: num(r.actual), forecast: String(r.forecast ?? '').trim(), remark: String(r.remark ?? '').trim() }))
// Keep only subdivision-level 1901-2015 Mean rows (36 subdivisions)
const normals = normalsRaw
  .filter((r) => String(r.parameter).trim() === 'Mean' && String(r._year).trim() === '1901-2015')
  .map((r) => ({
    subdivision: String(r.subdivision ?? '').trim(),
    jan: num(r.jan), feb: num(r.feb), mar: num(r.mar), apr: num(r.apr), may: num(r.may),
    jun: num(r.jun), jul: num(r.jul), aug: num(r.aug), sep: num(r.sep), oct: num(r.oct),
    nov: num(r.nov), dec: num(r.dec), annual: num(r.annual), jjas: num(r.jjas), ond: num(r.ond),
  }))
  .filter((r) => r.subdivision)

const snapshot = {
  meta: {
    title: 'Weather & Rainfall (IMD / OGD)',
    source: 'IMD — via data.gov.in (OGD)',
    generatedAt: new Date().toISOString(),
    asOf: '2024',
    vintages: { jjas: '1901–2019', neIndia: '1901–2021', heavy: '2017–2022', cmz: '2020–2024', normals: '1901–2015' },
  },
  jjasAllIndia: allIndiaJjas,
  jjasSouthPeninsula: spJjas,
  jjasNEIndia: neJjas,
  heavy,
  heavyAverage: heavyAvg ? {
    heavy: num(heavyAvg.heavy_rainfall___64_5_and_115_5_mm_),
    veryHeavy: num(heavyAvg.very_heavy_rainfall___115_6_and_204_5_mm_),
    extreme: num(heavyAvg.extremely_heavy_rainfall___204_5mm_),
  } : null,
  cmz,
  normals,
}
writeFileSync('src/lib/snapshots/weather.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/weather.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

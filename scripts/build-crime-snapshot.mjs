// One-off generator for the crime snapshot from NCRB "Crime in India 2024"
// mirrored on opencity.in (CKAN). Usage: node scripts/build-crime-snapshot.mjs
import { writeFileSync } from 'node:fs'
import * as XLSX from 'xlsx'

const BASE = 'https://data.opencity.in/dataset/7d883875-921a-4820-b298-713c6219bd90/resource'
const TABLES = {
  t11: `${BASE}/0dd7e28c-5d20-4556-a278-87df8fef9e89/download/table_1.1.xlsx`,
  t12: `${BASE}/3d330926-b6a1-444d-b1c0-c7e61e6ea8db/download/table_1.2.xlsx`,
  t13: `${BASE}/79d3c772-b0c4-46cb-9fbc-f2838d3705ea/download/table_1.3.xlsx`,
  metros: `${BASE}/d5b81375-7f97-4a66-bbcc-e7aadb89140e/download/table_1b.3.xlsx`,
  cyber: `${BASE}/c3e62daf-6c30-43b4-b937-be635ff175df/download/vol2-9b.1.xlsx`,
}

async function downloadXlsx(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function rowsOf(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
}

const out = {}
for (const [name, url] of Object.entries(TABLES)) {
  console.log(`Downloading ${name}…`)
  out[name] = rowsOf(await downloadXlsx(url))
}

const snapshot = {
  meta: {
    title: 'Crime in India 2024',
    edition: '2024',
    source: 'NCRB — Crime in India 2024 (opencity.in mirror)',
    sourceUrl: 'https://data.opencity.in/dataset/7d883875-921a-4820-b298-713c6219bd90',
    generatedAt: new Date().toISOString(),
    asOf: '2024',
  },
  raw: out,
}
writeFileSync('src/lib/snapshots/crime.json', JSON.stringify(snapshot))
console.log(`Wrote src/lib/snapshots/crime.json (${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)

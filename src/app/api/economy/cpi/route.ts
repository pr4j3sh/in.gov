import { NextResponse } from 'next/server'
import { getEconomyData } from '@/server/economy'
import { CPI_SECTOR, type CpiSectorKey } from '@/lib/cpi'

// Cold starts pull 4 pages × 5000 records from api.data.gov.in — allow up to 60s on Vercel.
export const maxDuration = 60

const SECTORS = new Set(Object.keys(CPI_SECTOR))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get('sector') ?? 'combined').toLowerCase()
  const sector: CpiSectorKey = SECTORS.has(raw) ? (raw as CpiSectorKey) : 'combined'
  try {
    const data = await getEconomyData(sector)
    return NextResponse.json(data, {
      headers: {
        'x-data-source': data.source,
        'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[api/economy/cpi] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load CPI data' }, { status: 502 })
  }
}

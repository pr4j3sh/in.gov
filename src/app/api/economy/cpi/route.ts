import { NextResponse } from 'next/server'
import { getEconomyData } from '@/server/economy'
import { CPI_SECTOR, type CpiSectorKey } from '@/lib/cpi'

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

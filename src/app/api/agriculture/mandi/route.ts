import { NextResponse } from 'next/server'
import { getMandiData } from '@/server/mandi'

// Cold starts pull 4 pages × 5000 records from api.data.gov.in — allow up to 60s on Vercel.
export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const commodity = searchParams.get('commodity')
  const q = searchParams.get('q')
  try {
    const data = await getMandiData({ state, commodity, q })
    return NextResponse.json(data, {
      headers: {
        'x-data-source': data.source,
        'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[api/agriculture/mandi] error:', err)
    return NextResponse.json({ error: 'Failed to load mandi data' }, { status: 502 })
  }
}

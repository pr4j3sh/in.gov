import { NextResponse } from 'next/server'
import { getCrimeData } from '@/server/crime'

export async function GET() {
  try {
    const data = await getCrimeData()
    return NextResponse.json(data, {
      headers: {
        'x-data-source': 'archived',
        'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[api/crime/ncrb] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load crime data' }, { status: 502 })
  }
}

import path from 'node:path'
import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'

export async function GET() {
  const file = path.join(process.cwd(), 'data', 'mandi-history.jsonl')
  if (!existsSync(file)) {
    return NextResponse.json({ entries: [], count: 0 })
  }
  try {
    const raw = readFileSync(file, 'utf8')
    const entries = raw.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    return NextResponse.json({ entries, count: entries.length }, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (err) {
    console.error('[api/agriculture/history] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to read history' }, { status: 500 })
  }
}

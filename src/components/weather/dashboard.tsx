'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloudSun, CloudRain, ShieldCheck, CircleCheck, CircleSlash } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { HudSearch } from '@/components/hud/hud-search'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, TickerSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MOVING_AVG_LINE, SKY_BAR, TEAL_BAR, INDIGO_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import { movingAverage } from '@/lib/weather'
import type { WeatherResponse } from '@/lib/weather'
import { escapeHtml } from '@/lib/format'

type SeriesKey = 'allIndia' | 'neIndia'

const SERIES_META: Record<SeriesKey, { label: string; sub: string }> = {
  allIndia: { label: 'All India', sub: 'OGD · Rainfall 1901–2019' },
  neIndia: { label: 'NE India', sub: 'OGD · 1901–2021 · JN_SP' },
}

export function WeatherDashboard() {
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [series, setSeries] = useState<SeriesKey>('allIndia')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/weather/monsoon')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as WeatherResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(t)
  }, [load])

  const loading = syncing || !hasLoaded
  const cmzLatest = data?.cmz?.[data.cmz.length - 1] ?? null

  const arcChart = useMemo(() => {
    if (!data) return null
    const src = series === 'allIndia' ? data.jjasAllIndia : data.jjasNEIndia
    const labels = src.map((p) => String(p.year))
    const values = src.map((p) => p.total)
    const ma = movingAverage(values as number[], 10)
    return {
      grid: { left: 8, right: 12, top: 20, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(56,189,248,0.45)', '#e0f2fe', { color: 'rgba(56,189,248,0.09)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number | null }>) => {
          const lines = params.map((p) => {
            if (p.seriesName === '10-yr avg') return `<span style="color:#2dd4bf">10-yr MA</span>&nbsp;&nbsp;: <b>${p.value?.toFixed(1) ?? '—'} mm</b>`
            return `<span style="color:#38bdf8">Monsoon total</span>&nbsp;: <b>${p.value?.toFixed(1) ?? '—'} mm</b>`
          })
          return `<b style="color:#38bdf8">${escapeHtml(params[0].name)}</b><br/>${lines.join('<br/>')}`
        },
      },
      xAxis: categoryAxis(labels, { interval: 11, rotate: 0, fontSize: 8 }),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${v}` }) }),
      series: [
        {
          name: 'JJAS total',
          type: 'line' as const,
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 3.5,
          lineStyle: {
            width: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(56,189,248,0.55)',
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#0c4a6e' },
                { offset: 0.5, color: '#0ea5e9' },
                { offset: 1, color: '#67e8f9' },
              ],
            },
          },
          itemStyle: { color: '#38bdf8' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(56,189,248,0.32)' },
                { offset: 1, color: 'rgba(56,189,248,0.01)' },
              ],
            },
          },
          data: values,
        },
        { ...MOVING_AVG_LINE, data: ma },
      ],
    }
  }, [data, series])

  const heavyChart = useMemo(() => {
    if (!data || !data.heavy.length) return null
    return {
      grid: { left: 8, right: 8, top: 20, bottom: 0, containLabel: true },
      legend: { show: false },
      tooltip: {
        ...glowTooltip('rgba(56,189,248,0.4)', '#e0f2fe', { color: 'rgba(56,189,248,0.08)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number }>) =>
          `<b style="color:#38bdf8">${escapeHtml(params[0].name)}</b><br/>${params.map((p) => `${escapeHtml(p.seriesName)}: <b>${p.value.toLocaleString('en-IN')}</b>`).join('<br/>')}`,
      },
      xAxis: categoryAxis(data.heavy.map((r) => String(r.year))),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }) }),
      series: [
        { name: 'Heavy (64.5–115.5mm)', type: 'bar' as const, stack: 'h', barWidth: 30, data: data.heavy.map((r) => r.heavy ?? 0), itemStyle: SKY_BAR },
        { name: 'Very heavy (115.6–204.5mm)', type: 'bar' as const, stack: 'h', data: data.heavy.map((r) => r.veryHeavy ?? 0), itemStyle: TEAL_BAR },
        { name: 'Extreme (≥204.5mm)', type: 'bar' as const, stack: 'h', data: data.heavy.map((r) => r.extreme ?? 0), itemStyle: INDIGO_BAR },
      ],
    }
  }, [data])

  const filteredNormals = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.normals
      .filter((r) => !q || r.subdivision.toLowerCase().includes(q))
      .sort((a, b) => (b.jjas ?? 0) - (a.jjas ?? 0))
  }, [data, query])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Weather data could not reach this machine and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-sky-400/40 bg-sky-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-sky-400">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const cmzPct = cmzLatest?.actual ?? null
  const avgJjas = data?.summary.allIndiaAverage ?? null

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source="archived" note={`ARCHIVED PRINT · 1901–2024 · LATEST ${data?.asOf ?? '—'}`} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.jjasAllIndia.length} YEARS · ${data.normals.length} SUBDIVISIONS · ${data.cmz.length} CMZ SCORECARD` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-sky-400/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* one number — CMZ scorecard */}
        <HudPanel
          title="The One Number — CMZ 2024"
          info="SW Monsoon 2024 Core Monsoon Zone actual rainfall as % of Long Period Average. IMD's forecast was called 'Above Normal' and verified — 4 of 4 issued forecasts since 2021 landed accurate."
          infoSource="IMD · data.gov.in"
          className="lg:col-span-4"
        >
          {loading || !data ? (
            <div className="space-y-3 py-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-20 w-56" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className="hud-title">SW MONSOON 2024 · CMZ</p>
              <p className="mt-2 font-mono text-6xl font-bold leading-none tracking-tighter text-sky-400 glow-text">
                {cmzPct ?? '—'}<span className="text-3xl align-top">%</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>OF LPA · {cmzLatest?.forecast?.toUpperCase() ?? '—'}</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-leaf">
                  ✓ ACCURATE
                </span>
              </p>

              <div className="mt-4 border-t border-sky-400/10 pt-3">
                <p className="hud-title">Issued forecast record · 2020–2024</p>
                <ul className="mt-2 space-y-1.5 font-mono text-[10px]">
                  {data.cmz.map((r) => {
                    const ok = r.remark.toLowerCase() === 'accurate'
                    return (
                      <li key={r.year} className="flex items-center justify-between gap-2">
                        <span className="text-text-dim">{r.year}</span>
                        <span className="text-text">{r.actual != null ? `${r.actual}% LPA` : '—'}</span>
                        <span className="truncate text-[8.5px] uppercase tracking-wider text-text-dim/75">{r.forecast}</span>
                        <span className={ok ? 'text-leaf' : 'text-text-dim/50'}>
                          {ok ? <CircleCheck size={12} aria-hidden /> : <CircleSlash size={12} aria-hidden />}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-text-dim/65">
                  {data.summary.cmzAccurateCount}/{data.summary.cmzTotalIssued} issued forecasts called right
                </p>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between border-t border-sky-400/10 pt-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">
                  <span>All-India JJAS avg 1901–2019</span>
                  <span className="text-sky-400/90">{avgJjas ? `${avgJjas.toFixed(1)} mm` : '—'}</span>
                </div>
              </div>
            </div>
          )}
        </HudPanel>

        {/* 124-year arc */}
        <HudPanel
          title="The 124-Year Monsoon Arc · JJAS"
          info="All-India June–September rainfall totals 1901–2019 (dashed teal = 10-yr moving average). OGD resource: 'Rainfall 1901 to 2019'. Switch to NE India for the 1901–2021 series."
          infoSource="IMD · data.gov.in"
          className="lg:col-span-8"
          right={
            <span className="flex items-center gap-1.5">
              {(Object.keys(SERIES_META) as SeriesKey[]).map((key) => (
                <button key={key} onClick={() => setSeries(key)} className="sector-chip !px-2.5 !py-1" aria-pressed={series === key}>
                  {SERIES_META[key].label.toUpperCase()}
                </button>
              ))}
            </span>
          }
        >
          {loading || !arcChart ? (
            <ChartSkeleton height={340} />
          ) : (
            <NeonChart option={arcChart} height={340} />
          )}
        </HudPanel>
      </div>

      {/* extreme rainfall + reliability board */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="Extreme Rainfall 2017–2022"
          info="Count of heavy (64.5–115.5mm), very heavy (115.6–204.5mm) and extremely heavy (≥204.5mm) rainfall events per year. 2019–2020 saw a surge in extreme events (523, 371); IMD average: 343 extreme events per year."
          infoSource="IMD · data.gov.in"
          className="lg:col-span-7"
        >
          {loading || !heavyChart ? (
            <ChartSkeleton height={300} />
          ) : (
            <NeonChart option={heavyChart} height={300} />
          )}
        </HudPanel>

        <HudPanel
          title="Monsoon Reliability Board — Subdivisions"
          info="Average June–September rainfall (mm, 1901–2015 normal) by IMD subdivision, wettest first. Useful for anchoring 'normal monsoon' expectations before diagnosing any single season."
          infoSource="IMD · data.gov.in · 1901–2015 normals"
          className="lg:col-span-5"
          pad={false}
          right={
            <HudSearch value={query} onChange={setQuery} placeholder="subdivision…" ariaLabel="Filter subdivisions" width="w-40" />
          }
        >
          {loading || !data ? <TickerSkeleton /> : (
            <div className="max-h-[380px] overflow-auto">
              <table className="metro-table hud-table w-full min-w-[430px] text-left font-mono text-[10px]">
                <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                  <tr className="hud-title">
                    <th className="px-3 py-2.5 font-medium">SUBDIVISION</th>
                    <th className="px-3 py-2.5 font-medium text-right">JJAS mm</th>
                    <th className="px-3 py-2.5 font-medium text-right">ANNUAL mm</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNormals.map((r) => (
                    <tr key={r.subdivision}>
                      <td className="px-3 py-2 text-text">{r.subdivision}</td>
                      <td className="px-3 py-2 text-right text-sky-400">{r.jjas?.toFixed(0) ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-text-dim">{r.annual?.toFixed(0) ?? '—'}</td>
                    </tr>
                  ))}
                  {filteredNormals.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-dim">NO SUBDIVISION MATCHES</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </HudPanel>
      </div>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (IMD)" className="hover:text-sky-400" />,
          <span key="imdb" className="inline-flex items-center gap-1.5"><CloudRain size={11} aria-hidden /> IMD · 1901–2024 ARCHIVES</span>,
          <span key="note" className="inline-flex items-center gap-1.5 text-amber/80"><CloudSun size={11} aria-hidden /> LIVE TRACKING NOT ON OGD</span>,
          <span key="jjas" className="text-text-dim/60">JJAS = JUN–SEP · LPA = LONG PERIOD AVERAGE</span>,
        ]}
      />
    </div>
  )
}

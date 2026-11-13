'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShieldCheck, BookOpenText, Landmark, UserRound } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { HudSearch } from '@/components/hud/hud-search'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, TickerSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, ROSE_BAR, GOLD_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import type { CensusResponse } from '@/lib/census'
import { escapeHtml } from '@/lib/format'

const cr = (n: number | null, d = 2) => (n == null ? '—' : (n / 1e7).toFixed(d) + ' Cr')

export function PopulationDashboard() {
  const [data, setData] = useState<CensusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/population/census')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as CensusResponse)
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

  const arcChart = useMemo(() => {
    if (!data) return null
    const s = data.series
    return {
      grid: { left: 8, right: 8, top: 20, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(249,115,22,0.45)', '#ffedd5', { color: 'rgba(249,115,22,0.09)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number | null }>) =>
          `<b style="color:#f97316">${escapeHtml(params[0].name)}</b><br/>${params.map((p) => `${escapeHtml(p.seriesName)}: <b>${p.value == null ? '—' : p.value.toLocaleString('en-IN') + ' M'}</b>`).join('<br/>')}`,
      },
      xAxis: categoryAxis(s.map((p) => String(p.year)), { interval: 0, rotate: 0, width: 34, overflow: 'truncate' as const }),
      yAxis: [
        valueAxis({ name: 'M', axisLabel: monoLabel() }),
        { type: 'value' as const, name: 'Δ%', axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }), splitLine: { show: false } },
      ],
      series: [
        {
          name: 'Population',
          type: 'bar' as const,
          barWidth: 26,
          data: s.map((p) => p.populationMillions),
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#fdba74' },
                { offset: 0.45, color: '#f97316' },
                { offset: 1, color: 'rgba(249,115,22,0.1)' },
              ],
            },
            shadowBlur: 12,
            shadowColor: 'rgba(249,115,22,0.4)',
          },
        },
        {
          name: 'Decadal Δ',
          type: 'line' as const,
          yAxisIndex: 1,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: '#fdba74', shadowBlur: 10, shadowColor: 'rgba(253,186,116,0.5)' },
          itemStyle: { color: '#fdba74' },
          data: s.map((p) => p.decadalVariationPct),
        },
      ],
    }
  }, [data])

  const stateSplitChart = useMemo(() => {
    if (!data) return null
    const top = [...data.states].filter((s) => s.name !== 'India').sort((a, b) => (b.population2011 ?? 0) - (a.population2011 ?? 0)).slice(0, 10).reverse()
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(249,115,22,0.45)', '#ffedd5', { color: 'rgba(249,115,22,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#f97316">${escapeHtml(params[0].name)}</b><br/>population 2011: <b>${params[0].value.toLocaleString('en-IN')}</b>`,
      },
      xAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 1e7).toFixed(0)}Cr` }) }),
      yAxis: categoryAxis(top.map((r) => r.name), { width: 130, overflow: 'truncate' as const }),
      series: [{ type: 'bar' as const, barWidth: 12, data: top.map((r) => r.population2011 ?? 0), itemStyle: GOLD_BAR }],
    }
  }, [data])

  const sexRatioChart = useMemo(() => {
    if (!data) return null
    const worst = [...data.sexRatio].filter((s) => s.name !== 'India').sort((a, b) => (a.sexRatio ?? 0) - (b.sexRatio ?? 0)).slice(0, 8).reverse()
    return {
      grid: { left: 8, right: 30, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(251,113,133,0.45)', '#fecdd3', { color: 'rgba(251,113,133,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#fb7185">${escapeHtml(params[0].name)}</b><br/>${params[0].value} females per 1,000 males`,
      },
      xAxis: valueAxis({ axisLabel: monoLabel(), min: 600, max: 1100 }),
      yAxis: categoryAxis(worst.map((r) => r.name), { width: 120, overflow: 'truncate' as const }),
      series: [{
        type: 'bar' as const,
        barWidth: 11,
        data: worst.map((r) => r.sexRatio ?? 0),
        itemStyle: {
          ...ROSE_BAR,
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(251,113,133,0.08)' },
              { offset: 0.6, color: '#be123d' },
              { offset: 1, color: '#fb7185' },
            ],
          },
        },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { type: 'dashed' as const, width: 1, color: 'rgba(253,186,116,0.7)' },
          label: { formatter: 'INDIA 943', position: 'end' as const, color: '#fdba74', fontFamily: MONO_FONT, fontSize: 8 },
          data: [{ xAxis: 943 }],
        },
      }],
    }
  }, [data])

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const states = data.states.filter((s) => !/^india$/i.test(s.name) && s.population2011 != null)
    const workers = new Map(data.workers.map((w) => [w.name, w]))
    const sex = new Map(data.sexRatio.map((s) => [s.name, s]))
    const merged = states.map((s) => ({
      name: s.name,
      population2011: s.population2011,
      decadalGrowthPct: s.decadalGrowthPct,
      densityPerSqKm: s.densityPerSqKm,
      sexRatio: sex.get(s.name)?.sexRatio ?? null,
      mainWorkersPct2011: workers.get(s.name)?.mainWorkersPct2011 ?? null,
    }))
    .sort((a, b) => (b.population2011 ?? 0) - (a.population2011 ?? 0))
    return q ? merged.filter((r) => r.name.toLowerCase().includes(q)) : merged
  }, [data, query])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Census data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-orange-400/40 bg-orange-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-orange-400">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const top = data ? [...data.workers].filter((w) => /^india$/i.test(w.name)) : []
  const workerIndia = top[0]

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source="archived" note="ARCHIVED PRINT · CENSUS 2011" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.series.length} CENSUS PRINTS · ${data.states.length - 1} STATES/UTs · 2011` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-orange-400/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The One Number"
          info="India's total population at Census 2011 — the last complete count. decadal Δ = growth 2001→2011. Density per km² uses the 2011 area figure (3.287 M km²)."
          infoSource="Census of India 2011 — via data.gov.in"
          className="lg:col-span-4"
        >
          {loading || !data ? (
            <div className="space-y-3 py-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-20 w-56" />
              <div className="skeleton h-16 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className="hud-title">TOTAL POPULATION — 2011</p>
              <p className="mt-2 font-mono text-[3.4rem] font-bold leading-none tracking-tighter text-orange-400 glow-text xl:text-6xl">
                {cr(data.summary.population2011, 2)}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>{(data.summary.population2011 ?? 0).toLocaleString('en-IN')}</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-orange-400/30 bg-orange-400/10 px-1.5 py-0.5 text-orange-300">
                  <ArrowUpRight size={10} aria-hidden /> +{data.summary.decadalGrowthPct?.toFixed(1)}% vs 2001
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono">
                <div className="border-t border-orange-400/10 pt-2">
                  <p className="text-lg text-text">{data.summary.densityPerSqKm ?? '—'}<span className="text-[10px] text-text-dim"> /km²</span></p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Density</p>
                </div>
                <div className="border-t border-orange-400/10 pt-2">
                  <p className="text-lg text-text">{data.summary.sexRatio2011 ?? '—'}<span className="text-[10px] text-text-dim"> ♀/1k ♂</span></p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Sex Ratio</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-orange-400/10">
                <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">
                  <span>Workers (main)</span>
                  <span className="text-orange-400/90">{workerIndia?.mainWorkersPct2011?.toFixed(1) ?? '—'}% of population</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[9px] text-text-dim">
                  <span>♂ {workerIndia?.maleWorkersPct2011?.toFixed(1) ?? '—'}%</span>
                  <span className="text-right">♀ {workerIndia?.femaleWorkersPct2011?.toFixed(1) ?? '—'}%</span>
                </div>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-text-dim/65">
                  {workerIndia ? `${cr(workerIndia.mainWorkers, 1)} main workers` : ''}
                </p>
              </div>
            </div>
          )}
        </HudPanel>

        <HudPanel
          title="The 110-Year Arc · 1901–2011"
          info="Population by census year, bars in millions; orange line = decadal % change. Note the post-Independence surge in the 1960s–70s and the cooling from 2001 onwards."
          infoSource="Census of India 2011 — via data.gov.in"
          className="lg:col-span-8"
        >
          {loading || !arcChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={arcChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* state split + sex ratio */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The State Split — Top 10"
          info="Most populous states & UTs at Census 2011 (India total 121.09 Cr; UP alone 19.98 Cr). Sorted descending."
          infoSource="Census of India 2011 — via data.gov.in"
          className="lg:col-span-7"
          right={<Chip tone="amber">{data ? `Σ ${cr([...data.states].filter((s) => s.name !== 'India').reduce((a, s) => a + (s.population2011 ?? 0), 0))} in states/UTs` : '—'}</Chip>}
        >
          {loading || !stateSplitChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={stateSplitChart} height={330} />
          )}
        </HudPanel>

        <HudPanel
          title="The Female Shortfall — Sex Ratio"
          info="Females per 1,000 males at Census 2011. National: 943. Worst-performing states/UTs shown (left = worst). Haryana's 775 is the floor; the dashed line marks the national average."
          infoSource="Census of India 2011 — via data.gov.in"
          className="lg:col-span-5"
          right={<Chip tone="cyan">INDIA 943</Chip>}
        >
          {loading || !sexRatioChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={sexRatioChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* density & growth board */}
      <HudPanel
        title="Density & Growth Board — States/UTs"
        info="2011 population, decadal growth 2001→2011, density per km², sex ratio and % of population working (main workers). Search to filter; sorted by population."
        infoSource="Census of India 2011 — via data.gov.in"
        className="mt-4"
        pad={false}
        right={
          <span className="flex items-center gap-2">
            <HudSearch value={query} onChange={setQuery} placeholder="state / UT…" ariaLabel="Filter states" width="w-36" />
            <span className="font-mono text-[9px] tracking-[0.2em] text-text-dim">{loading || !data ? '—' : `${rows.length}/${data.states.length - 1} ROWS`}</span>
          </span>
        }
      >
        {loading || !data ? <TickerSkeleton /> : (
          <div className="max-h-[440px] overflow-auto">
            <table className="metro-table hud-table w-full min-w-[760px] text-left font-mono text-[10px]">
              <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                <tr className="hud-title">
                  <th className="px-4 py-2.5 font-medium">STATE / UT</th>
                  <th className="px-4 py-2.5 font-medium text-right">POP 2011</th>
                  <th className="px-4 py-2.5 font-medium text-right">Δ 01→11</th>
                  <th className="px-4 py-2.5 font-medium text-right">DENSITY /km²</th>
                  <th className="px-4 py-2.5 font-medium text-right">♀ / 1k ♂</th>
                  <th className="px-4 py-2.5 font-medium text-right">WORKERS %</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td className="px-4 py-2 text-text">{r.name}</td>
                    <td className="px-4 py-2 text-right text-orange-300">{r.population2011?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className={`px-4 py-2 text-right ${(r.decadalGrowthPct ?? 0) > 22 ? 'text-amber' : 'text-text-dim'}`}>{r.decadalGrowthPct?.toFixed(1) ?? '—'}%</td>
                    <td className="px-4 py-2 text-right text-text-dim">{r.densityPerSqKm?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className={`px-4 py-2 text-right ${(r.sexRatio ?? 999) < 900 ? 'text-danger' : 'text-text-dim'}`}>{r.sexRatio ?? '—'}</td>
                    <td className="px-4 py-2 text-right text-text-dim">{r.mainWorkersPct2011?.toFixed(1) ?? '—'}%</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-text-dim">NO STATE MATCHES “{query.toUpperCase()}”</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (Census)" className="hover:text-orange-400" />,
          <span key="occ" className="inline-flex items-center gap-1.5"><BookOpenText size={11} aria-hidden /> O/o Registrar General & Census Commissioner</span>,
          <span key="yr" className="inline-flex items-center gap-1.5"><Landmark size={11} aria-hidden /> CENSUS 2011 — LAST FULL COUNT</span>,
          <span key="note" className="inline-flex items-center gap-1.5 text-amber/80"><UserRound size={11} aria-hidden /> 2021 CENSUS PENDING</span>,
        ]}
      />
    </div>
  )
}

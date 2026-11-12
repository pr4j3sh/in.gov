'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShieldCheck, Zap, BookOpenText } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, StatTileSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, GREEN_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import type { EnergyResponse } from '@/lib/energy'

const inr = (n: number | null, unit = '') => (n == null ? '—' : `${n.toLocaleString('en-IN')}${unit}`)

export function EnergyDashboard() {
  const [data, setData] = useState<EnergyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/energy/urja')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as EnergyResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loading = syncing || !hasLoaded

  const mixChart = useMemo(() => {
    if (!data) return null
    const thermal = data.mix.find((m) => /thermal/i.test(m.source))
    const nonFossil = data.mix.find((m) => /non-fossil/i.test(m.source))
    const total = data.mix.find((m) => /total/i.test(m.source))
    const fys = ['FY22-23', 'FY23-24', 'FY24-25']
    const t = [thermal?.fy2023 ?? 0, thermal?.fy2024 ?? 0, thermal?.fy2025 ?? 0]
    const n = [nonFossil?.fy2023 ?? 0, nonFossil?.fy2024 ?? 0, nonFossil?.fy2025 ?? 0]
    return {
      grid: { left: 8, right: 8, top: 26, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(250,204,21,0.45)', '#fef9c3', { color: 'rgba(250,204,21,0.09)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number }>) =>
          `<b style="color:#facc15">${params[0].name}</b><br/>${params.map((p) =>
            `${p.seriesName}: <b>${p.value.toLocaleString('en-IN')} BU</b>`).join('<br/>')}`,
      },
      legend: { show: true, top: 0, right: 0, textStyle: { color: '#fde68a', fontFamily: MONO_FONT, fontSize: 9 }, itemWidth: 14, itemHeight: 10 },
      xAxis: categoryAxis(fys),
      yAxis: valueAxis({ axisLabel: monoLabel() }),
      series: [
        { name: 'Non-fossil', type: 'bar' as const, stack: 'total', data: n, itemStyle: { color: '#facc15', shadowBlur: 12, shadowColor: 'rgba(250,204,21,0.45)', borderRadius: [0, 0, 0, 0] } },
        { name: 'Thermal (incl. coal)', type: 'bar' as const, stack: 'total', data: t, itemStyle: { color: '#78350f', shadowBlur: 8, shadowColor: 'rgba(120,53,15,0.35)', borderRadius: [2, 2, 0, 0] } },
      ],
    }
  }, [data])

  const nuclearChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 8, top: 18, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(250,204,21,0.45)', '#fef9c3', { color: 'rgba(250,204,21,0.09)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#facc15">${params[0].name}</b><br/>nuclear generation: <b>${params[0].value.toLocaleString('en-IN')} MU</b>`,
      },
      xAxis: categoryAxis(data.nuclear.map((r) => r.year), { interval: 0 }),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }) }),
      series: [{
        name: 'Gross generation',
        type: 'line' as const,
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.2, shadowBlur: 14, shadowColor: 'rgba(250,204,21,0.55)', color: '#facc15' },
        itemStyle: { color: '#fef08a' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250,204,21,0.32)' },
              { offset: 1, color: 'rgba(250,204,21,0.01)' },
            ],
          },
        },
        data: data.nuclear.map((r) => r.generationMU),
      }],
    }
  }, [data])

  const solarChart = useMemo(() => {
    if (!data) return null
    const top = [...data.solar].sort((a, b) => (b.generationGWh ?? 0) - (a.generationGWh ?? 0)).slice(0, 15).reverse()
    return {
      grid: { left: 8, right: 30, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(250,204,21,0.45)', '#fef9c3', { color: 'rgba(250,204,21,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#facc15">${params[0].name}</b><br/>solar generation 2022-23: <b>${params[0].value.toLocaleString('en-IN')} GWh</b>`,
      },
      xAxis: valueAxis({ axisLabel: monoLabel() }),
      yAxis: categoryAxis(top.map((r) => r.state), { width: 140, overflow: 'truncate' as const }),
      series: [{
        type: 'bar' as const,
        barWidth: 11,
        data: top.map((r) => r.generationGWh ?? 0),
        itemStyle: GREEN_BAR,
      }],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Energy data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-yellow-400">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const shareFY25 = data?.summary.nonFossilShareFy25 ?? null
  const shareDelta = data?.summary.nonFossilShareDelta ?? null
  const totalFY25 = data?.summary.totalGenerationFy25 ?? null

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={data?.source ?? 'live'} note="PIB-REPLY PRINTS · FY 2024-25" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `3 MIX YEARS · 10 NUCLEAR YEARS · ${data.solar.length} SOLAR STATES/UTs` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-yellow-400/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* one number */}
        <HudPanel
          title="The One Number — Generation FY25"
          info="Total electricity generated in India in FY 2024-25 (billion units, BU): 1,829.7 BU, +5.2% vs FY24 (1,739.0 BU). Non-fossil sources (hydro, nuclear, RE) contributed 465.8 BU — a 25.5% share, up from 23.7% in FY24."
          infoSource="Ministry of Power · PIB"
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
              <p className="hud-title">TOTAL GENERATION — FY 2024-25</p>
              <p className="mt-2 font-mono text-6xl font-bold leading-none tracking-tighter text-yellow-400 glow-text">
                {totalFY25?.toLocaleString('en-IN') ?? '—'}<span className="text-2xl align-top"> BU</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>+{data.summary.yoyTotalPct?.toFixed(1) ?? '—'}% vs FY24</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-leaf">
                  <ArrowUpRight size={10} aria-hidden /> +5.2%
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="border-t border-yellow-400/10 pt-2">
                  <p className="text-lg text-text">{shareFY25?.toFixed(1) ?? '—'}<span className="text-[10px] text-text-dim"> %</span></p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Non-fossil share FY25</p>
                </div>
                <div className="border-t border-yellow-400/10 pt-2">
                  <p className="text-lg text-text">+{shareDelta?.toFixed(1) ?? '—'}<span className="text-[10px] text-text-dim"> pp</span></p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">vs FY24 (23.7%)</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-yellow-400/10">
                <p className="hud-title">Solar BY FY23</p>
                <p className="mt-1 font-display text-lg font-semibold text-yellow-400/95">{(data.summary.solarFy23TotalGWh ?? 0).toLocaleString('en-IN')} GWh</p>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">{data.solar.length} reporting states · Rajasthan alone {(data.solar[0]?.generationGWh ?? 0).toLocaleString('en-IN')} GWh</p>
              </div>
            </div>
          )}
        </HudPanel>

        {/* the split */}
        <HudPanel
          title="The Split — Thermal vs Non-fossil · FY22-23 → FY24-25"
          info="Stacked bars: thermal (incl. coal) + non-fossil (hydro + nuclear + renewables) across the last three financial years. Non-fossil share FY23: 25.7% · FY24: 23.7% (dip) · FY25: 25.5% (recovery)."
          infoSource="Ministry of Power · PIB"
          className="lg:col-span-8"
          right={<Chip tone="amber">FY25 · 25.5% NF</Chip>}
        >
          {loading || !mixChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={mixChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* nuclear + solar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The Nuclear Decade · 2014-15 → 2023-24"
          info="Gross nuclear generation, India's atomic fleet. 2014-15: 35,592 MU → 2023-24: 47,971 MU (+34.7% over a decade). Commissioning of Kudankulam + Kakrapar units drove the FY19-20 jump (46,472 MU)."
          infoSource="PIB · OGD"
          className="lg:col-span-4"
          right={<Chip tone="cyan">+35% decade</Chip>}
        >
          {loading || !nuclearChart ? (
            <ChartSkeleton height={260} />
          ) : (
            <NeonChart option={nuclearChart} height={260} />
          )}
        </HudPanel>

        <HudPanel
          title="The Solar Leaderboard · FY 2022-23"
          info="State-wise solar electricity generation in FY 2022-23, GWh. Rajasthan at 34,474 GWh alone accounts for ~68% of all state-level solar generation reported — of India's solar story, Rajasthan is the solar story."
          infoSource="PIB · OGD"
          className="lg:col-span-8"
          right={<Chip tone="amber">RAJ 34,474 GWh</Chip>}
        >
          {loading || !solarChart ? (
            <ChartSkeleton height={260} />
          ) : (
            <NeonChart option={solarChart} height={260} />
          )}
        </HudPanel>
      </div>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (MoP)" className="hover:text-yellow-400" />,
          <span key="mop" className="inline-flex items-center gap-1.5"><Zap size={11} aria-hidden /> MoP · PIB ANSWERS</span>,
          <span key="nf" className="inline-flex items-center gap-1.5 text-amber/80"><BookOpenText size={11} aria-hidden /> UNITS BU / MU / GWh</span>,
          <span key="note" className="text-text-dim/60">SOLAR FY23 LEADERBOARD — LAST REPORTED STATE-WISE YEAR</span>,
        ]}
      />
    </div>
  )
}

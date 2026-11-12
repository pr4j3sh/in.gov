'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShieldCheck, Landmark, BookOpenText } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, TickerSkeleton, StatTileSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, INDIGO_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import { gstFullYears } from '@/lib/finmin'
import type { FinminResponse } from '@/lib/finmin'

const inLCr = (n: number | null) => (n == null ? '—' : `₹${(n / 100000).toFixed(2)} L Cr`)

export function BudgetDashboard() {
  const [data, setData] = useState<FinminResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/finmin/koshakar')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as FinminResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loading = syncing || !hasLoaded

  const gstChart = useMemo(() => {
    if (!data) return null
    const full = gstFullYears(data.gst)
    return {
      grid: { left: 8, right: 8, top: 22, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(129,140,248,0.45)', '#e0e7ff', { color: 'rgba(129,140,248,0.09)' }),
        formatter: (params: Array<{ name: string; value: number | null }>) => {
          const p = params[0]
          const row = full.find((r) => r.year === p.name)
          return `<b style="color:#818cf8">${p.name}</b><br/>collection: <b>₹${((p.value ?? 0) / 100000).toFixed(2)} L Cr</b><br/>growth: <b>${row?.growthPct == null ? '—' : '+' + row.growthPct.toFixed(0) + '%'}</b>`
        },
      },
      xAxis: categoryAxis(full.map((r) => r.year), { interval: 0 }),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 100000).toFixed(0)}` }) }),
      series: [{
        name: 'GST',
        type: 'bar' as const,
        barWidth: 26,
        data: full.map((r) => r.amountCr),
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#c4b5fd' },
              { offset: 0.45, color: '#818cf8' },
              { offset: 1, color: 'rgba(129,140,248,0.12)' },
            ],
          },
          shadowBlur: 14,
          shadowColor: 'rgba(129,140,248,0.5)',
        },
      }],
    }
  }, [data])

  const taxMixChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 8, top: 22, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(129,140,248,0.45)', '#e0e7ff', { color: 'rgba(129,140,248,0.09)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number }>) =>
          `<b style="color:#818cf8">${params[0].name}</b><br/>${params.map((p) =>
            `${p.seriesName}: <b>₹${(p.value / 100000).toFixed(2)} L Cr</b>`).join('<br/>')}`,
      },
      legend: { show: true, top: 0, right: 0, textStyle: { color: '#c7d2fe', fontFamily: MONO_FONT, fontSize: 9 }, itemWidth: 14, itemHeight: 10 },
      xAxis: categoryAxis(data.directTax.map((r) => r.year)),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 100000).toFixed(0)}` }) }),
      series: [
        { name: 'Non-corporate tax', type: 'bar' as const, stack: 'tax', data: data.directTax.map((r) => r.nonCorporateCr), itemStyle: { color: '#818cf8', shadowBlur: 12, shadowColor: 'rgba(129,140,248,0.4)' } },
        { name: 'Corporate tax', type: 'bar' as const, stack: 'tax', data: data.directTax.map((r) => r.corporateCr), itemStyle: { color: '#4c1d95', shadowBlur: 8, shadowColor: 'rgba(76,29,149,0.35)', borderRadius: [3, 3, 0, 0] } },
      ],
    }
  }, [data])

  const genderChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 8, top: 18, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(192,132,252,0.45)', '#f3e8ff', { color: 'rgba(192,132,252,0.09)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#c084fc">${params[0].name}</b><br/>Gender Budget: <b>₹${(params[0].value / 100000).toFixed(2)} L Cr</b>`,
      },
      xAxis: categoryAxis(data.genderBudget.map((r) => r.year)),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${(v / 100000).toFixed(1)}` }) }),
      series: [{
        type: 'line' as const,
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.2, shadowBlur: 14, shadowColor: 'rgba(192,132,252,0.55)', color: '#c084fc' },
        itemStyle: { color: '#e9d5ff' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(192,132,252,0.32)' },
              { offset: 1, color: 'rgba(192,132,252,0.01)' },
            ],
          },
        },
        data: data.genderBudget.map((r) => r.amountCrore),
      }],
    }
  }, [data])

  const disinvestmentChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 8, top: 18, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(251,113,133,0.4)', '#fecdd3', { color: 'rgba(251,113,133,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#fb7185">${params[0].name}</b><br/>disinvest. receipts: <b>${params[0].value.toFixed(2)}%</b> of total receipts`,
      },
      xAxis: categoryAxis(data.disinvestment.map((r) => r.year)),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }) }),
      series: [{
        type: 'bar' as const,
        barWidth: 22,
        data: data.disinvestment.map((r) => r.pctOfTotal),
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(251,113,133,0.85)' },
              { offset: 1, color: 'rgba(251,113,133,0.08)' },
            ],
          },
          shadowBlur: 12,
          shadowColor: 'rgba(251,113,133,0.4)',
        },
      }],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Budget data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-indigo-400/40 bg-indigo-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-indigo-300">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const fy25Cr = data?.summary.gstFy25Cr ?? null
  const yoy = data?.summary.gstYoYPct ?? null
  const genderCr = data?.summary.genderBudgetFy25Cr ?? null
  const genderDelta = data?.summary.genderBudgetDeltaPct ?? null

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={data?.source ?? 'live'} note="PIB-REPLY PRINTS · FY 2024-25" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.gst.length} GST YEARS · ${data.directTax.length} TAX YEARS · FY25 = ₹20.56 L Cr` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-indigo-300/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* one number — GST */}
        <HudPanel
          title="The One Number — GST FY25"
          info="Total GST collected in FY 2024-25: ₹20.56 lakh-crore, +10% vs FY24 (₹18.74 lakh-crore) — third year of double-digit growth since implementation. FY26 (Apr–Dec) already at ₹16.50 lakh-crore, +9% YoY."
          infoSource="Ministry of Finance · PIB"
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
              <p className="hud-title">GST COLLECTION — FY 2024-25</p>
              <p className="mt-2 font-mono text-[3.4rem] font-bold leading-none tracking-tighter text-indigo-300 glow-text xl:text-6xl">
                ₹{((fy25Cr ?? 0) / 100000).toFixed(2)}<span className="text-2xl align-top"> L Cr</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>₹{((fy25Cr ?? 0) / 100000).toFixed(2)} lakh crore</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-leaf">
                  <ArrowUpRight size={10} aria-hidden /> +{yoy?.toFixed(0) ?? '—'}% YoY
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="border-t border-indigo-400/10 pt-2">
                  <p className="text-lg text-text">{inLCr(data.summary.gstFy26DecCr)}</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">FY26 till Dec (+9%)</p>
                </div>
                <div className="border-t border-indigo-400/10 pt-2">
                  <p className="text-lg text-text">{data.summary.nonCorpShareFy25?.toFixed(1) ?? '—'}<span className="text-[10px] text-text-dim"> %</span></p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Non-corp tax share</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-indigo-400/10">
                <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">
                  <span>Gender Budget FY25</span>
                  <span className="text-violet-300">{inLCr(genderCr)}</span>
                </div>
                <p className="mt-1 font-display text-sm font-semibold text-violet-300">+{genderDelta?.toFixed(0) ?? '—'}% since FY22</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-text-dim/65">2.1× in 3 years (₹1.53L→₹3.27L Cr)</p>
              </div>
            </div>
          )}
        </HudPanel>

        {/* GST spine */}
        <HudPanel
          title="The GST Spine · FY 2017-18 → FY 2024-25"
          info="Annual GST collections, ₹ lakh-crore. +207% since FY18 (₹6.78L→₹20.56L Cr). Pre-FY22 FYs are NA growth; FY22 had a +31% catch-up after the COVID dip (−7%)."
          infoSource="Ministry of Finance · PIB"
          className="lg:col-span-8"
          right={<Chip tone="amber">FY25 · +10%</Chip>}
        >
          {loading || !gstChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={gstChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* tax mix + gender */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The Tax Mix · FY 2020-21 → FY 2024-25"
          info="Direct tax: corporate vs non-corporate. FY25 mix: 55.6% non-corporate / 44.4% corporate — the mix has shifted decisively toward salaried & professional taxpayers."
          infoSource="Income Tax Dept · OGD"
          className="lg:col-span-7"
          right={<Chip tone="cyan">FY25 · 55.6/44.4</Chip>}
        >
          {loading || !taxMixChart ? (
            <ChartSkeleton height={260} />
          ) : (
            <NeonChart option={taxMixChart} height={260} />
          )}
        </HudPanel>

        <HudPanel
          title="The Gender Budget · FY22 → FY25"
          info="Allocations explicitly ear-marked for women — ₹1.53 L Cr (FY22) → ₹3.27 L Cr (FY25), +113%. Not a sufficient condition for gender parity, but a formal, growing signal."
          infoSource="Ministry of Finance · PIB"
          className="lg:col-span-5"
          right={<Chip tone="amber">FY25 = ₹3.27 L Cr</Chip>}
        >
          {loading || !genderChart ? (
            <ChartSkeleton height={260} />
          ) : (
            <NeonChart option={genderChart} height={260} />
          )}
        </HudPanel>
      </div>

      {/* budget at a glance + disinvestment */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Budget at a glance table */}
        <HudPanel
          title="The Budget at a Glance · FY22 Actuals → FY24 BE"
          info="Union Budget at a Glance. FY22 Actuals → FY23 BE → FY23 RE (revised) → FY24 BE (budget estimate). Revenue Receipts ₹21.70→₹26.32 L Cr; Total expenditure ₹37.94→₹45.03 L Cr."
          infoSource="Union Budget · OGD"
          className="lg:col-span-7"
          pad={false}
        >
          {loading || !data ? <TickerSkeleton /> : (
            <div className="max-h-[420px] overflow-auto">
              <table className="metro-table hud-table w-full min-w-[640px] text-left font-mono text-[10px]">
                <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                  <tr className="hud-title">
                    <th className="px-4 py-2.5 font-medium">PARAMETER</th>
                    <th className="px-4 py-2.5 font-medium text-right">FY22 Actuals ₹ L Cr</th>
                    <th className="px-4 py-2.5 font-medium text-right">FY23 BE</th>
                    <th className="px-4 py-2.5 font-medium text-right">FY23 RE</th>
                    <th className="px-4 py-2.5 font-medium text-right">FY24 BE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.budget.slice(0, 12).map((r) => {
                    const q = (r.parameter || '').trim()
                    const isHeadline = /total|receipts|expenditure/i.test(q)
                    return (
                      <tr key={q} className={isHeadline ? 'bg-indigo-500/10 font-semibold text-indigo-300' : ''}>
                        <td className="px-4 py-2 text-text">{q}</td>
                        <td className="px-4 py-2 text-right text-text-dim">{r.fy22Actuals == null ? '—' : (r.fy22Actuals / 100000).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-text-dim">{r.fy23BE == null ? '—' : (r.fy23BE / 100000).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-text-dim">{r.fy23RE == null ? '—' : (r.fy23RE / 100000).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-indigo-300">{r.fy24BE == null ? '—' : (r.fy24BE / 100000).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </HudPanel>

        {/* disinvestment */}
        <HudPanel
          title="The Disinvestment Ledger · FY18-19 → FY22-23"
          info="Disinvestment receipts as % of total receipts (revenue + capital). The disinvestment engine has stalled: 3.66% (FY19) → 1.88% (FY20) → 0.93% (FY21) → 0.36% (FY22) → 0.74% (FY23). The state now relies on tax growth, not asset sales."
          infoSource="Ministry of Finance · PIB"
          className="lg:col-span-5"
          right={<Chip tone="amber">2022-23 = 0.74%</Chip>}
        >
          {loading || !disinvestmentChart ? (
            <ChartSkeleton height={260} />
          ) : (
            <NeonChart option={disinvestmentChart} height={260} />
          )}
        </HudPanel>
      </div>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (MoF)" className="hover:text-indigo-300" />,
          <span key="mof" className="inline-flex items-center gap-1.5"><Landmark size={11} aria-hidden /> MoF · PIB ANSWERS</span>,
          <span key="bud" className="inline-flex items-center gap-1.5 text-amber/80"><BookOpenText size={11} aria-hidden /> SPEECH STAGE, NOT FINAL ACCOUNTS</span>,
          <span key="note" className="text-text-dim/60">FY26 = Apr–Dec · UNITS: ₹ L Cr (lakh-crore)</span>,
        ]}
      />
    </div>
  )
}

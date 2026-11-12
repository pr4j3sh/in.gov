'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ShieldCheck, BookOpenText, Scale, Landmark } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, TickerSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, ROSE_BAR, GOLD_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import type { CrimeParsed } from '@/lib/crime'

type CrimeResponse = CrimeParsed & {
  source: 'archived'
  fetchedAt: string
  metroCount: number
}

const inr = (n: number | null) => (n == null ? '—' : n.toLocaleString('en-IN'))
const pct = (n: number | null, digits = 1) => (n == null ? '—' : `${n.toFixed(digits)}%`)

export function CrimeDashboard() {
  const [data, setData] = useState<CrimeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/crime/ncrb')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as CrimeResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = syncing || !hasLoaded
  const total24 = data?.totals.combined2024 ?? null
  const trend = data?.nationalTrend ?? []

  const funnelChart = useMemo(() => {
    if (trend.length === 0) return null
    return {
      grid: { left: 0, right: 0, top: 6, bottom: 0, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(13,13,36,0.97)',
        borderColor: 'rgba(251,113,133,0.4)',
        textStyle: { color: '#fecdd3', fontFamily: MONO_FONT, fontSize: 10 },
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0]
          return `<b style="color:#fb7185">${p.name}</b><br/>cognizable crimes: <b>${p.value.toLocaleString('en-IN')}</b>`
        },
      },
      xAxis: {
        type: 'category' as const,
        data: trend.map((r) => String(r.year)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: monoLabel({ color: '#e2e8f0', fontSize: 10 }),
      },
      yAxis: { type: 'value' as const, show: false, min: 0 },
      series: [
        {
          type: 'bar' as const,
          barWidth: 26,
          data: trend.map((r) => ({
            value: r.total,
            itemStyle: r.year === 2024 ? { color: '#fb7185', shadowBlur: 16, shadowColor: 'rgba(251,113,133,0.6)', borderRadius: [3, 3, 0, 0] } : { color: 'rgba(251,113,133,0.35)', borderRadius: [3, 3, 0, 0] },
          })),
        },
      ],
    }
  }, [trend])

  const headsChart = useMemo(() => {
    if (!data) return null
    const top = data.heads.filter((h) => !h.name.toLowerCase().includes('other')).slice(0, 10).reverse()
    return {
      grid: { left: 8, right: 40, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(251,113,133,0.45)', '#fecdd3', { color: 'rgba(251,113,133,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#fb7185">${params[0].name}</b><br/>2024 cases: <b>${params[0].value.toLocaleString('en-IN')}</b>`,
      },
      xAxis: valueAxis({ axisLabel: monoLabel() }),
      yAxis: categoryAxis(top.map((h) => h.name), { width: 168, overflow: 'truncate' as const }),
      series: [
        {
          type: 'bar' as const,
          barWidth: 12,
          data: top.map((h) => h.c2024 ?? 0),
          itemStyle: ROSE_BAR,
        },
      ],
    }
  }, [data])

  const cyberChart = useMemo(() => {
    if (!data) return null
    const top = [...data.cyber].slice(0, 10).reverse()
    return {
      grid: { left: 8, right: 20, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(251,191,36,0.45)', '#fef3c7', { color: 'rgba(251,191,36,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0]
          const row = [...data.cyber].find((r) => r.city === p.name)
          return `<b style="color:#fbbf24">${p.name}</b><br/>2024: <b>${p.value.toLocaleString('en-IN')}</b><br/>growth vs 2022: <b>${row?.growthPct == null ? '—' : '+' + row.growthPct + '%'}</b>`
        },
      },
      xAxis: valueAxis({ axisLabel: monoLabel() }),
      yAxis: categoryAxis(top.map((r) => r.city), { width: 150, overflow: 'truncate' as const }),
      series: [
        {
          type: 'bar' as const,
          barWidth: 11,
          data: top.map((r) => r.c2024 ?? 0),
          itemStyle: GOLD_BAR,
        },
      ],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="The crime dossier could not be parsed and no cached print was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-rose-400/40 bg-rose-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-danger"
        >
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const d24 = data?.totals.combined2024
  const d23 = data?.totals.combined2023
  const deltaPct = data?.totals.combinedDeltaPct

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source="archived" note="OFFICIAL PRINT · NCRB 2024" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.nationalTrend.length} YEARS · ${data.heads.length} CRIME HEADS · ${data.metroCount} METROS` : '—'}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] text-amber/80">
          SOURCE — NCRB · CRIME IN INDIA 2024
        </span>
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* the one number */}
        <HudPanel
          title="The One Number"
          info="Total cognizable crimes registered in India in 2024 — IPC/BNS + Special & Local Laws. Includes IPC→BNS re-codification from July 2024, so 2024 mixes both. Compare within the NCRB series, not against pre-2013 Acts."
          infoSource="NCRB — Crime in India 2024 (Table 1.1, 1.2, 1.3)"
          className="lg:col-span-4"
        >
          {loading || !data ? (
            <div className="space-y-3 py-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-20 w-60" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className="hud-title">COGNIZABLE CRIMES — 2024</p>
              <p className="mt-2 font-mono text-[3.4rem] font-bold leading-none tracking-tighter text-rose-400 glow-text xl:text-6xl">
                {inr(d24 ?? null)}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>≈ {d24 != null ? (d24 / 100000).toFixed(1) : '—'} LAKH · RATE {data.totals.combinedRate2024?.toFixed(1)} / LAKH</span>
                <span
                  className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-emerald-400"
                  title="% change vs 2023"
                >
                  <ArrowDownRight size={10} aria-hidden /> {deltaPct == null ? '—' : `${Math.abs(deltaPct).toFixed(1)}%`} vs 2023
                </span>
              </p>

              <div className="mt-3 border-t border-rose-400/10 pt-3">
                <p className="hud-title">Complaint → FIR Funnel · 2024</p>
                <div className="mt-2 grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <p className="text-lg text-text">{data.complaints.totalComplaints ? (data.complaints.totalComplaints / 100000).toFixed(1) : '—'}<span className="text-[10px] text-text-dim"> M</span></p>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Complaints</p>
                  </div>
                  <div>
                    <p className="text-lg text-text">{data.complaints.firsRegistered ? (data.complaints.firsRegistered / 100000).toFixed(2) : '—'}<span className="text-[10px] text-text-dim"> M</span></p>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">FIRs</p>
                  </div>
                  <div>
                    <p className="text-lg text-amber">{data.complaints.onlineEfiers?.toLocaleString('en-IN') ?? '—'}</p>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">e-FIRs</p>
                  </div>
                </div>
                <p className="mt-1.5 font-mono text-[8.5px] tracking-wide text-text-dim/75">
                  {data.complaints.totalComplaints && data.complaints.firsRegistered
                    ? `${Math.round((data.complaints.firsRegistered / data.complaints.totalComplaints) * 100)}% complaint→FIR conversion`
                    : '—'}
                </p>
              </div>

              {funnelChart && (
                <div className="mt-auto pt-3">
                  <p className="hud-title mb-1">3-year arc</p>
                  <NeonChart option={funnelChart} height={86} />
                </div>
              )}
            </div>
          )}
        </HudPanel>

        {/* most registered */}
        <HudPanel
          title="The Most Registered — Crime Heads"
          info="Top IPC/BNS crime heads by cases registered in 2024, excluding aggregate sub-totals. 'Other BNS/IPC crimes' is the catch-all residual head. Theft + Other Thefts = 9.7 lakh — property crime dominates the register."
          infoSource="NCRB — Table 1.2"
          className="lg:col-span-8"
          right={<Chip tone="cyan">IPC/BNS · 2024</Chip>}
        >
          {loading || !headsChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={headsChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* metro league + cyber */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The Metro League — Cognizable Crimes"
          info="City-wise cognizable crimes (IPC+BNS+SLL), 2022–2024. Rate = crimes per lakh of 2011-census metro population. Chargesheeting rate = % of cases chargesheeted. Sorted by 2024 volume. TOTAL CITIES row aggregates all 19 metros."
          infoSource="NCRB — Table 1B.3"
          className="lg:col-span-7"
          pad={false}
          right={<span className="font-mono text-[9px] tracking-[0.2em] text-text-dim">{data ? `${data.metroCount} METROS · 2022–2024` : '—'}</span>}
        >
          {loading || !data ? <TickerSkeleton /> : (
            <div className="max-h-[440px] overflow-auto">
              <table className="metro-table hud-table w-full min-w-[680px] text-left font-mono text-[10px]">
                <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                  <tr className="hud-title">
                    <th className="px-3 py-2.5 font-medium">#</th>
                    <th className="px-3 py-2.5 font-medium">CITY</th>
                    <th className="px-3 py-2.5 font-medium text-right">2022</th>
                    <th className="px-3 py-2.5 font-medium text-right">2023</th>
                    <th className="px-3 py-2.5 font-medium text-right">2024</th>
                    <th className="px-3 py-2.5 font-medium text-right">RATE / LAKH</th>
                    <th className="px-3 py-2.5 font-medium text-right">CHARGESHEET</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metros.map((m, i) => (
                    <tr key={m.city}>
                      <td className="px-3 py-2 text-text-dim">{i + 1}</td>
                      <td className="px-3 py-2 text-text">{m.city}</td>
                      <td className="px-3 py-2 text-right text-text-dim">{inr(m.c2022)}</td>
                      <td className="px-3 py-2 text-right text-text-dim">{inr(m.c2023)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-400">{inr(m.c2024)}</td>
                      <td className="px-3 py-2 text-right text-text-dim">{m.rate2024?.toLocaleString('en-IN') ?? '—'}</td>
                      <td className={`px-3 py-2 text-right ${m.chargesheeting2024 != null && m.chargesheeting2024 < 50 ? 'text-danger' : 'text-text-dim'}`}>
                        {pct(m.chargesheeting2024, m.chargesheeting2024 != null && m.chargesheeting2024 % 1 !== 0 ? 1 : 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-rose-400/30 bg-rose-400/5 font-semibold">
                    <td className="px-3 py-2 text-rose-400/80">Σ</td>
                    <td className="px-3 py-2 text-rose-300">ALL 19 METROS</td>
                    <td className="px-3 py-2 text-right text-text-dim">8,53,470</td>
                    <td className="px-3 py-2 text-right text-text-dim">9,44,291</td>
                    <td className="px-3 py-2 text-right text-rose-300">8,40,905</td>
                    <td className="px-3 py-2 text-right text-text-dim">737.4</td>
                    <td className="px-3 py-2 text-right text-text-dim">64.2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </HudPanel>

        <HudPanel
          title="Cyber Surge — Metros"
          info="Cyber crime cases by metro, 2022 vs 2024. Bengaluru quintupled from 2021-era levels; growth computed as 2024 vs 2022. Delhi's flat line is an under-reporting signal, not safety."
          infoSource="NCRB — Table 9B.1"
          className="lg:col-span-5"
          right={<Chip tone="amber">2022 → 2024</Chip>}
        >
          {loading || !cyberChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={cyberChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://data.opencity.in" label="SOURCE — NCRB · opencity.in" className="hover:text-rose-400" />,
          <span key="ipc" className="inline-flex items-center gap-1.5"><Scale size={11} aria-hidden /> IPC → BNS TRANSITION (JUL 2024)</span>,
          <span key="pop" className="inline-flex items-center gap-1.5"><Landmark size={11} aria-hidden /> METRO POP — 2011 CENSUS</span>,
          <span key="stale" className="text-amber/90">2024 EDITION — LATEST PUBLISHED</span>,
        ]}
      />
    </div>
  )
}

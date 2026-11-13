"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  ShieldCheck,
  SatelliteDish,
} from "lucide-react";
import { HudPanel } from "@/components/hud/hud-panel";
import { Chip } from "@/components/hud/chip";
import { HudSearch } from "@/components/hud/hud-search";
import { ManifestStrip } from "@/components/hud/manifest-strip";
import { SourceLink } from "@/components/hud/source-link";
import { StatTile } from "@/components/hud/stat-tile";
import { InsightsDesk } from "./insights-desk";
import { StatusPill } from "@/components/hud/status-pill";
import {
  ChartSkeleton,
  StatTileSkeleton,
  SpreadSkeleton,
  TickerSkeleton,
} from "@/components/hud/skeleton";
import { NeonChart } from "@/components/charts/neon-chart";
import { formatCompact, formatINR, isoToHuman, escapeHtml } from "@/lib/format";
import {
  AMBER_BAR,
  GREEN_BAR,
  categoryAxis,
  glowTooltip,
  monoLabel,
  valueAxis,
} from "@/lib/chart-theme";
import type { MandiResponse } from "@/lib/types";

export function AgricultureDashboard() {
  const [state, setState] = useState<string>("");
  const [commodity, setCommodity] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"state" | "market" | "commodity" | "modalPrice">("state");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [data, setData] = useState<MandiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [facetLoading, setFacetLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const facetKeyRef = useRef("");

  const load = useCallback(async (s: string, c: string, q: string) => {
    const key = `${s}|${c}`;
    const facetChanged = key !== facetKeyRef.current;
    facetKeyRef.current = key;
    if (facetChanged) setFacetLoading(true); // full skeleton repaint only when scope changes
    setSyncing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (s) params.set("state", s);
      if (c) params.set("commodity", c);
      if (q) params.set("q", q);
      const res = await fetch(`/api/agriculture/mandi?${params}`);
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`);
      setData((await res.json()) as MandiResponse);
      setHasLoaded(true);
      setFacetLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "UPLINK FAULT");
      setFacetLoading(false);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => { void load(state, commodity, debouncedQ); }, 0);
    return () => clearTimeout(t);
  }, [state, commodity, debouncedQ, load]);

  const loading = facetLoading || (!hasLoaded && !error);

  const visibleTable = useMemo(() => {
    if (!data) return [];
    const rows = [...data.table]; // server already applied state / commodity / query
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return cmp * sortDir;
    });
    return rows;
  }, [data, sortKey, sortDir]);

  const commodityChart = useMemo(() => {
    if (!data) return null;
    const rows = [...data.byCommodity].reverse();
    return {
      grid: { left: 8, right: 12, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip("rgba(52,211,153,0.4)", "#d1fae5", {
          color: "rgba(52,211,153,0.09)",
        }),
        formatter: (params: Array<{ name: string; value: number; dataIndex: number }>) => {
          const p = params[0];
          const row = [...data.byCommodity].reverse()[p.dataIndex];
          return `<b style="color:#34d399">${escapeHtml(p.name)}</b><br/>markets quoting&nbsp;&nbsp;: <b>${p.value}</b><br/>avg modal price&nbsp;: ${formatINR(row.avgModal)}<br/>quote range&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${formatINR(row.min)} – ${formatINR(row.max)}`;
        },
      },
      xAxis: valueAxis(),
      yAxis: categoryAxis(
        rows.map((r) => r.commodity),
        { width: 130, overflow: "truncate" as const },
      ),
      series: [
        {
          type: "bar" as const,
          data: rows.map((r) => r.markets),
          barWidth: 12,
          itemStyle: GREEN_BAR,
        },
      ],
    };
  }, [data]);

  const stateChart = useMemo(() => {
    if (!data) return null;
    const rows = data.byState;
    return {
      grid: { left: 8, right: 8, top: 18, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip("rgba(251,191,36,0.45)", "#fef3c7", {
          color: "rgba(251,191,36,0.1)",
        }),
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0];
          const row = rows.find((r) => r.state === p.name);
          return `<b style="color:#fbbf24">${escapeHtml(p.name)}</b><br/>avg modal price&nbsp;: <b>${formatINR(p.value)}</b> / quintal<br/>markets quoting&nbsp;&nbsp;: <b>${row?.markets ?? 0}</b>`;
        },
      },
      xAxis: categoryAxis(
        rows.map((r) => r.state),
        { rotate: 38, width: 64, overflow: "truncate" as const },
      ),
      yAxis: valueAxis({
        axisLabel: monoLabel({
          formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
        }),
      }),
      series: [
        {
          type: "bar" as const,
          data: rows.map((r) => r.avgModal),
          barMaxWidth: 22,
          itemStyle: AMBER_BAR,
        },
      ],
    };
  }, [data]);

  if (error && !data) {
    return (
      <HudPanel
        title="UPLINK STATUS"
        className="mt-6"
        info="The dashboard could not reach the data.gov.in feed from this machine. Nothing is wrong with the renderer itself — the fault is upstream or in this session's network path."
      >
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-dim">
          The feed could not be reached and no cached snapshot was available. Check the network or
          the
          <code className="mx-1 rounded bg-panel-2 px-1.5 py-0.5 text-[11px] text-hud">
            DATA_GOV_IN_API_KEY
          </code>
          in{" "}
          <code className="rounded bg-panel-2 px-1.5 py-0.5 text-[11px] text-hud">.env.local</code>,
          then retry.
        </p>
        <button
          onClick={() => load(state, commodity, debouncedQ)}
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-hud transition-shadow hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]"
        >
          <RotateCcw size={12} aria-hidden /> RETRY UPLINK
        </button>
      </HudPanel>
    );
  }

  const sortHeader = (label: string, key: typeof sortKey) => (
    <button
      onClick={() => {
        if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
        else {
          setSortKey(key);
          setSortDir(1);
        }
      }}
      className="inline-flex items-center gap-1 transition-colors hover:text-hud"
      aria-label={`Sort by ${label}`}
    >
      {label}
      {sortKey === key ? (
        sortDir === 1 ? (
          <ArrowUp size={10} aria-hidden />
        ) : (
          <ArrowDown size={10} aria-hidden />
        )
      ) : (
        <ArrowUpDown size={9} className="opacity-50" aria-hidden />
      )}
    </button>
  );

  return (
    <div>
      {/* status line */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={syncing ? "connecting" : (data?.source ?? "connecting")} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            AS OF <span className="text-text">{isoToHuman(data?.asOf ?? "")}</span> ·{" "}
            {data ? formatCompact(data.summary.totalRecords) : "—"} PRICE TICKS PROCESSED
          </span>
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] text-text-dim/70">
          <SatelliteDish size={11} className="text-hud/70" aria-hidden />
          {syncing ? "SYNCING WITH FEED…" : "FEED IN SYNC"}
        </span>
      </div>

      {/* headline stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {loading || !data ? (
          <>
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
          </>
        ) : (
          <>
            <StatTile
              label="Markets Reporting"
              value={data.summary.markets}
              hint="Unique APMC mandis quoting today"
            />
            <StatTile
              label="Commodities Tracked"
              value={data.summary.commodities}
              hint="Distinct items on today&rsquo;s ticker"
              tone="amber"
            />
            <StatTile
              label="States / UTs Covered"
              value={data.summary.states}
              hint="Administrative units with quotes"
              tone="magenta"
            />
            <StatTile
              label="Price Ticks Today"
              value={data.summary.totalRecords}
              format={(n) => formatCompact(Math.round(n))}
              hint="Raw rows ingested & normalized"
              tone="amber"
            />
          </>
        )}
      </div>

      {/* data-derived insights */}
      <InsightsDesk />

      {/* filter deck */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-indigo-300/15 bg-panel-2/70 p-3 shadow-[inset_0_1px_0_rgba(199,210,254,0.08)] backdrop-blur-sm">
        <label className="filter-label">
          <span className="hud-title">
            State / UT <span className="filter-hint">— filters every panel</span>
          </span>
          <select
            className="hud-select min-w-44"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCommodity("");
            }}
            aria-label="Filter by state or union territory"
          >
            <option value="">ALL STATES + UTs</option>
            {data?.filterOptions.states.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-label">
          <span className="hud-title">
            Commodity <span className="filter-hint">— drives modal & spread charts</span>
          </span>
          <select
            className="hud-select min-w-44"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            aria-label="Filter by commodity"
          >
            <option value="">ALL COMMODITIES (TOP 12)</option>
            {data?.filterOptions.commodities.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="Commodity Coverage — # Markets Quoting"
          info="How many unique APMC mandis in the selected scope published a price for each commodity today. Longer bar = deeper price discovery; compare commodities before comparing prices."
          infoSource="data.gov.in mandi feed"
          className="lg:col-span-7"
          right={<Chip tone="emerald">{state ? state.toUpperCase() : "ALL INDIA"}</Chip>}
        >
          {loading || !commodityChart ? (
            <ChartSkeleton height={300} />
          ) : (
            <NeonChart option={commodityChart} height={300} />
          )}
        </HudPanel>

        <HudPanel
          title={`Modal ₹ / Quintal — ${data?.focusCommodity || "—"}`}
          info="The modal price is the most-traded price for the day (not min, not max) — the closest thing to a 'real' mandi rate. Bars compare the average modal price across states; a wide gap between neighbors flags arbitrage headroom or supply shocks."
          infoSource="data.gov.in mandi feed"
          className="lg:col-span-5"
          right={<Chip tone="amber">₹ · STATE WISE</Chip>}
        >
          {loading || !stateChart || !data?.byState.length ? (
            <ChartSkeleton height={300} />
          ) : (
            <NeonChart option={stateChart} height={300} />
          )}
        </HudPanel>
      </div>

      {/* dispersion + ticker */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="Price Dispersion — Max–Min"
          info="Within one market on one day, the gap between the highest and lowest quote for the focus commodity. Wide gaps mean inconsistent grades/varieties being lumped together, or thin mandis quoting wildly — treat single prints with caution."
          infoSource="data.gov.in mandi feed"
          className="lg:col-span-4"
          pad={false}
        >
          {loading || !data ? (
            <SpreadSkeleton />
          ) : (
            <ul className="divide-y divide-indigo-300/8">
              {data.marketSpread.length === 0 && (
                <li className="px-4 py-6 text-center font-mono text-[10px] text-text-dim">
                  NO SPREADS ON RECORD — TRY ANOTHER COMMODITY
                </li>
              )}
              {data.marketSpread.map((m) => {
                const intensity = Math.min(1, m.spread / 4000);
                return (
                  <li
                    key={`${m.state}|${m.market}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className="h-8 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: `linear-gradient(180deg, rgba(251,191,36,${0.35 + intensity * 0.65}), rgba(251,113,133,${0.35 + intensity * 0.65}))`,
                          boxShadow: "0 0 8px rgba(251,191,36,0.35)",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] text-text">{m.market}</p>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-text-dim">
                          {m.state}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[11px] font-semibold text-amber">
                        Δ {formatINR(m.spread)}
                      </p>
                      <p className="font-mono text-[8px] text-text-dim">
                        {formatINR(m.modalPrice)} MODAL
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </HudPanel>

        <HudPanel
          title="Mandi Ticker"
          info="Raw, normalized price prints — one row per market × commodity × variety. Sort any column, or search. The search scans every row in the current scope, not just the 150 shown. MODAL ₹ is the reference rate most mandis converge on; MIN/MAX bound the day's quotes. Rows returned are capped at 150."
          infoSource="data.gov.in mandi feed"
          className="lg:col-span-8"
          pad={false}
          right={
            <span className="font-mono text-[9px] tracking-[0.2em] text-text-dim">
              {loading || !data ? "—" : `${visibleTable.length} / ${data.tableCount} ROWS`}
            </span>
          }
        >
          {loading || !data ? (
            <TickerSkeleton />
          ) : (
            <>
              <div className="flex items-center gap-2 justify-between border-b border-indigo-300/10 px-4 py-2.5 w-full">
                <HudSearch
                  value={query}
                  onChange={setQuery}
                  placeholder="market / district / variety"
                  ariaLabel="Search ticker rows"
                  width="flex-1 min-w-0"
                />
                <button
                  onClick={() => setQuery("")}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-indigo-300/25 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-text-dim transition-colors hover:border-cyan-400/50 hover:text-hud"
                >
                  <RotateCcw size={11} aria-hidden /> RESET
                </button>
                {query && (
                  <span className="shrink-0 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-hud/80">
                    filtering on “{query}”
                  </span>
                )}
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="hud-table w-full min-w-[720px] text-left font-mono text-[10.5px]">
                  <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                    <tr className="hud-title">
                      <th className="px-3 py-2.5 font-medium">{sortHeader("STATE", "state")}</th>
                      <th className="px-3 py-2.5 font-medium">{sortHeader("MARKET", "market")}</th>
                      <th className="px-3 py-2.5 font-medium">
                        {sortHeader("COMMODITY", "commodity")}
                      </th>
                      <th className="px-3 py-2.5 font-medium text-right">MIN ₹</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-medium text-right">
                        {sortHeader("MODAL ₹", "modalPrice")}
                      </th>
                      <th className="px-3 py-2.5 font-medium text-right">MAX ₹</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTable.map((r, i) => (
                      <tr key={`${r.state}|${r.market}|${r.commodity}|${r.variety}|${i}`}>
                        <td className="px-3 py-2 text-text-dim">{r.state}</td>
                        <td className="px-3 py-2 text-text">{r.market}</td>
                        <td className="px-3 py-2">
                          <span className="text-leaf">{r.commodity}</span>
                          {r.variety && r.variety !== "Other" && (
                            <span className="text-text-dim"> · {r.variety}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-text-dim">
                          {formatINR(r.minPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-amber">
                          {formatINR(r.modalPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-text-dim">
                          {formatINR(r.maxPrice)}
                        </td>
                      </tr>
                    ))}
                    {visibleTable.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-text-dim">
                          <p className="font-mono text-[11px] tracking-widest">
                            NO TICKERS MATCH “{query.toUpperCase()}”
                          </p>
                          <p className="mt-2 text-[11px] text-text-dim/70">
                            Try a broader term, or clear the state filter.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </HudPanel>
      </div>

      {/* methodology strip */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80">
            <ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE
          </span>,
          <SourceLink
            key="src"
            href="https://www.data.gov.in"
            label="SOURCE — data.gov.in"
            className="hover:text-leaf"
          />,
          "MINISTRY OF AGRICULTURE & FARMERS WELFARE",
          "UNIT — ₹ / QUINTAL",
          "MODAL = MOST-TRADED PRICE",
          <span key="disc" className="text-text-dim/60">
            INDICATIVE QUOTES — NOT MSP, NOT AUCTION RESULTS
          </span>,
        ]}
      />
    </div>
  );
}

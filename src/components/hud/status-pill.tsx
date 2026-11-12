export function StatusPill({ source, note }: { source: 'live' | 'snapshot' | 'connecting' | 'archived'; note?: string }) {
  const config = {
    live: { label: 'LIVE · data.gov.in', cls: 'text-leaf border-emerald-400/30 bg-emerald-400/10', dot: 'text-leaf' },
    snapshot: { label: 'SNAPSHOT · cached feed', cls: 'text-amber border-amber-400/30 bg-amber-400/10', dot: 'text-amber' },
    connecting: { label: 'ESTABLISHING UPLINK…', cls: 'text-hud border-cyan-400/30 bg-cyan-400/10', dot: 'text-hud' },
    archived: { label: 'ARCHIVED · OFFICIAL PRINT', cls: 'text-amber border-amber-400/40 bg-amber-400/10', dot: 'text-amber' },
  }[source]

  return (
    <span className={`inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] ${config.cls}`}>
      <span className={`status-dot inline-block h-1.5 w-1.5 rounded-full bg-current ${config.dot}`} />
      {note ?? config.label}
    </span>
  )
}

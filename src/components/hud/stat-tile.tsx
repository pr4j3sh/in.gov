'use client'

import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'

export function StatTile({
  label,
  value,
  suffix,
  hint,
  format = (n: number) => Math.round(n).toLocaleString('en-IN'),
  tone = 'accent',
}: {
  label: string
  value: number
  suffix?: string
  hint?: string
  format?: (n: number) => string
  tone?: 'accent' | 'amber' | 'danger' | 'magenta'
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const toneClass =
    tone === 'amber'
      ? 'text-amber'
      : tone === 'danger'
        ? 'text-danger'
        : tone === 'magenta'
          ? 'text-magenta'
          : 'text-accent'

  return (
    <div className="hud-panel stat-sweep relative overflow-hidden px-4 py-4">
      <span className="hud-corners" aria-hidden />
      <p className="hud-title">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold leading-none tracking-tight md:text-[1.75rem] ${toneClass} glow-text`}>
        {format(display)}
        {suffix && <span className="ml-1.5 text-[10px] font-normal text-text-dim">{suffix}</span>}
      </p>
      {hint && <p className="mt-2 font-mono text-[8.5px] uppercase leading-3 tracking-[0.14em] text-text-dim/80">{hint}</p>}
    </div>
  )
}

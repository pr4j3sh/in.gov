import type { ReactNode } from 'react'
import { InfoTip } from './info-tip'

export function HudPanel({
  title,
  right,
  info,
  infoSource,
  children,
  className = '',
  pad = true,
}: {
  title?: string
  right?: ReactNode
  /** Plain-language "what this panel shows + how to read it" copy. */
  info?: string
  infoSource?: string
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <section className={`hud-panel overflow-visible ${className}`}>
      <span className="hud-corners" aria-hidden />
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-indigo-300/10 px-4 py-2.5">
          <h2 className="hud-title flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--accent)] shadow-[0_0_6px_var(--accent-glow)]" />
            {title}
            {info && <InfoTip text={info} source={infoSource} />}
          </h2>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

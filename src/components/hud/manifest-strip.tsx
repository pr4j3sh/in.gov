import type { ReactNode } from 'react'

/**
 * Bordered methodology/license strip shared by the home and sector pages.
 * Items compose freely — each page supplies its own icon + lines.
 */
export function ManifestStrip({ items }: { items: ReactNode[] }) {
  return (
    <div className="mt-4 flex flex-col items-start gap-1.5 rounded-md border border-indigo-300/12 border-l-2 border-l-[var(--accent)] bg-panel/60 px-4 py-3 font-mono text-[8px] leading-4 tracking-[0.08em] text-text-dim/85 shadow-[inset_0_1px_0_rgba(199,210,254,0.07)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:border-l sm:border-l-indigo-300/12 sm:text-[8.5px] sm:tracking-[0.12em]">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {item}
        </span>
      ))}
    </div>
  )
}

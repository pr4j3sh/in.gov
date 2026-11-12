import type { ReactNode } from 'react'

export type ChipTone = 'emerald' | 'amber' | 'cyan' | 'indigo'

/** Small bordered mono badge — scope markers, units, filter context. */
export function Chip({ tone = 'cyan', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>
}

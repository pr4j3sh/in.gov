import type { LucideIcon } from 'lucide-react'

/**
 * Right-aligned scene-setting block — icon + codename + labelled lines.
 * Used on the home hero and sector page headers so they read as one system.
 */
export function MetaRail({
  icon: Icon,
  title,
  lines,
  className = '',
}: {
  icon: LucideIcon
  title: string
  lines: string[]
  className?: string
}) {
  return (
    <div aria-hidden className={`hidden select-none lg:block ${className}`}>
      <Icon size={40} strokeWidth={1.1} className="mb-3 ml-auto text-hud/70" />
      <p className="text-right font-mono text-[9px] tracking-[0.3em] text-text-dim">{title}</p>
      <p className="mt-1 text-right font-mono text-[10px] leading-5 text-hud/80">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  )
}

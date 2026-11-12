import { Search, type LucideIcon } from 'lucide-react'

/** Compact search input with leading icon — used above HUD tables. */
export function HudSearch({
  value,
  onChange,
  placeholder = 'search…',
  ariaLabel = 'Search',
  icon: Icon = Search,
  width = 'w-44',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  ariaLabel?: string
  icon?: LucideIcon
  width?: string
}) {
  return (
    <label className={`relative inline-flex items-center ${width}`}>
      <Icon size={14} aria-hidden className="hud-search-icon" />
      <input
        className="hud-search-input"
        placeholder={placeholder}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

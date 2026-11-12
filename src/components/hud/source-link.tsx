import { BookOpenText, type LucideIcon } from 'lucide-react'

/**
 * Attribution link used in manifest strips — icon + SOURCE label + plain base URL.
 * Opens in a new tab. Keep icons consistent per sector.
 */
export function SourceLink({
  href,
  label,
  icon: Icon = BookOpenText,
  className = 'hover:text-hud',
}: {
  href: string
  label: string
  icon?: LucideIcon
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 underline decoration-dotted underline-offset-2 transition-colors ${className}`}
    >
      <Icon size={11} aria-hidden />
      {label}
    </a>
  )
}

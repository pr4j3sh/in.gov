/**
 * Ghosted oversized index numeral used as decorative background text.
 * Uses the card's --card-accent when active, else cool indigo.
 */
export function GhostNumeral({ value, active = false }: { value: string; active?: boolean }) {
  return (
    <span
      aria-hidden
      className="ghost-numeral"
      style={{
        WebkitTextStroke: active
          ? '1px color-mix(in srgb, var(--card-accent, #34d399) 45%, transparent)'
          : '1px rgba(165,180,252,0.22)',
      }}
    >
      {value}
    </span>
  )
}

/** Escape text for safe interpolation into ECharts tooltip HTML. */
export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatIN(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/** ISO yyyy-mm-dd -> '12 Nov 2026' */
export function isoToHuman(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** DD/MM/YYYY -> '12 Nov 2026' */
export function ddmmyyyyToHuman(s: string): string {
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
  if (!m) return s
  return isoToHuman(`${m[3]}-${m[2]}-${m[1]}`)
}

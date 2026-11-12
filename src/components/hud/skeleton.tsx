/** Layout-stable shimmer placeholders for every data region. */

export function StatTileSkeleton() {
  return (
    <div className="hud-panel p-4">
      <div className="skeleton h-2.5 w-24" />
      <div className="skeleton mt-3 h-8 w-32" />
      <div className="skeleton mt-2 h-2 w-36 opacity-70" />
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex flex-col justify-end gap-2.5 px-2" style={{ height }}>
      {[70, 92, 55, 84, 63, 100, 48, 76, 90, 58, 81, 66].map((w, i) => (
        <div key={i} className="skeleton h-[13px]" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr>
      {[90, 140, 150, 60, 70, 60].map((w, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="skeleton h-3" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export function TickerSkeleton() {
  return (
    <div className="max-h-[420px] overflow-hidden">
      <table className="w-full text-left">
        <tbody>
          {Array.from({ length: 12 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SpreadSkeleton() {
  return (
    <ul className="divide-y divide-line">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="skeleton h-3 w-40" />
            <div className="skeleton mt-1.5 h-2 w-20 opacity-70" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-2 w-20 opacity-70" />
          </div>
        </li>
      ))}
    </ul>
  )
}

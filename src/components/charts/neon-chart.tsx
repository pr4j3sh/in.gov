'use client'

import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

/** Thin client wrapper around echarts with HUD defaults + resize handling. */
export function NeonChart({
  option,
  height = 280,
  className = '',
}: {
  option: echarts.EChartsCoreOption
  height?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const optionRef = useRef(option)
  optionRef.current = option

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    chart.setOption(optionRef.current, true)
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(option)])

  return <div ref={ref} style={{ height }} className={`w-full ${className}`} role="img" />
}

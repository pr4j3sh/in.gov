/**
 * Shared echarts theme fragments — palette, fonts, axis & tooltip factories,
 * gradient bars. Dashboard chart builders compose these; keep every chart
 * visually identical by construction.
 */
export const MONO_FONT = 'JetBrains Mono, monospace'

export const COLORS = {
  leaf: '#34d399',
  leafDeep: '#10b981',
  amber: '#fbbf24',
  amberPale: '#fde68a',
  cyan: '#22d3ee',
  text: '#e2e8f0',
  textDim: '#8b8bb0',
  split: 'rgba(165,180,252,0.1)',
} as const

export const dashedSplit = {
  lineStyle: { color: COLORS.split, type: 'dashed' as const },
}

export const monoLabel = (extra: Record<string, unknown> = {}) =>
  ({
    color: COLORS.textDim,
    fontFamily: MONO_FONT,
    fontSize: 10,
    ...extra,
  }) as Record<string, unknown>

export const categoryAxis = (data: string[], extra: Record<string, unknown> = {}) => ({
  type: 'category' as const,
  data,
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: monoLabel({ color: COLORS.text, fontSize: 9, interval: 0, ...extra }),
})

export const valueAxis = (extra: Record<string, unknown> = {}) => ({
  type: 'value' as const,
  axisLine: { show: false },
  splitLine: dashedSplit,
  axisLabel: monoLabel(),
  ...extra,
})

export const glowTooltip = (
  borderColor: string,
  textColor: string,
  shadowStyle: Record<string, unknown>,
) => ({
  trigger: 'axis' as const,
  axisPointer: { type: 'shadow' as const, shadowStyle },
  backgroundColor: 'rgba(13,13,36,0.97)',
  borderColor,
  borderWidth: 1,
  textStyle: { color: textColor, fontFamily: MONO_FONT, fontSize: 11 },
})

type Stop = { offset: number; color: string }

export const linearGradient = (horizontal: boolean, stops: Stop[]) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: horizontal ? 1 : 0,
  y2: horizontal ? 0 : 1,
  colorStops: stops,
})

export const GREEN_BAR = {
  borderRadius: [0, 3, 3, 0] as const,
  color: linearGradient(true, [
    { offset: 0, color: 'rgba(52,211,153,0.08)' },
    { offset: 0.55, color: COLORS.leafDeep },
    { offset: 1, color: COLORS.leaf },
  ]),
  shadowBlur: 18,
  shadowColor: 'rgba(52,211,153,0.55)',
}

export const AMBER_BAR = {
  borderRadius: [3, 3, 0, 0] as const,
  color: linearGradient(false, [
    { offset: 0, color: COLORS.amberPale },
    { offset: 0.45, color: COLORS.amber },
    { offset: 1, color: 'rgba(251,191,36,0.06)' },
  ]),
  shadowBlur: 16,
  shadowColor: 'rgba(251,191,36,0.5)',
}

export const GOLD_BAR = {
  borderRadius: [0, 3, 3, 0] as const,
  color: linearGradient(true, [
    { offset: 0, color: 'rgba(245,193,92,0.07)' },
    { offset: 0.6, color: 'rgba(245,193,92,0.65)' },
    { offset: 1, color: '#f5c15c' },
  ]),
  shadowBlur: 18,
  shadowColor: 'rgba(245,193,92,0.45)',
}

export const ROSE_BAR = {
  borderRadius: [0, 3, 3, 0] as const,
  color: linearGradient(true, [
    { offset: 0, color: 'rgba(225,29,72,0.07)' },
    { offset: 0.6, color: 'rgba(225,29,72,0.55)' },
    { offset: 1, color: '#fb7185' },
  ]),
  shadowBlur: 18,
  shadowColor: 'rgba(225,29,72,0.45)',
}

export const SKY_BAR = {
  borderRadius: [3, 3, 0, 0] as const,
  color: linearGradient(false, [
    { offset: 0, color: 'rgba(56,189,248,0.1)' },
    { offset: 0.55, color: '#0ea5e9' },
    { offset: 1, color: '#38bdf8' },
  ]),
  shadowBlur: 16,
  shadowColor: 'rgba(56,189,248,0.5)',
}

export const TEAL_BAR = {
  borderRadius: [3, 3, 0, 0] as const,
  color: linearGradient(false, [
    { offset: 0, color: 'rgba(45,212,191,0.09)' },
    { offset: 0.55, color: '#0d9488' },
    { offset: 1, color: '#2dd4bf' },
  ]),
  shadowBlur: 14,
  shadowColor: 'rgba(45,212,191,0.45)',
}

export const INDIGO_BAR = {
  borderRadius: [3, 3, 0, 0] as const,
  color: linearGradient(false, [
    { offset: 0, color: 'rgba(129,140,248,0.09)' },
    { offset: 0.55, color: '#4f46e5' },
    { offset: 1, color: '#818cf8' },
  ]),
  shadowBlur: 14,
  shadowColor: 'rgba(129,140,248,0.4)',
}

export const MOVING_AVG_LINE = {
  name: '10-yr avg',
  type: 'line' as const,
  smooth: 0.5,
  symbol: 'none',
  lineStyle: { width: 1.6, type: 'dashed' as const, color: '#2dd4bf' },
  itemStyle: { color: '#2dd4bf' },
  emphasis: { focus: 'series' as const },
}

import { describe, expect, it, vi } from 'vitest'
import { ttlCache, ogdNum, ogdNumPlain, ogdStr } from './ogd'

describe('ttlCache', () => {
  it('returns null when empty and serves values within the TTL', () => {
    const c = ttlCache<string>(1000)
    expect(c.get()).toBeNull()
    c.set('hello')
    expect(c.get()).toBe('hello')
  })

  it('expires entries after the TTL', () => {
    vi.useFakeTimers()
    try {
      const c = ttlCache<string>(1000)
      c.set('hello')
      vi.advanceTimersByTime(1001)
      expect(c.get()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clear() drops the entry', () => {
    const c = ttlCache<number>(10000)
    c.set(42)
    c.clear()
    expect(c.get()).toBeNull()
  })
})

describe('ogdNum', () => {
  it('parses comma-separated numbers and NA/blank as missing', () => {
    expect(ogdNum('1,23,456')).toBe(123456)
    expect(ogdNum('NA')).toBeNull()
    expect(ogdNum('')).toBeNull()
    expect(ogdNum(null)).toBeNull()
    expect(ogdNum('12.5')).toBe(12.5)
  })
})

describe('ogdNumPlain', () => {
  it('parses plain numbers', () => {
    expect(ogdNumPlain(' 42 ')).toBe(42)
    expect(ogdNumPlain('abc')).toBeNull()
  })
})

describe('ogdStr', () => {
  it('trims and tolerates nullish', () => {
    expect(ogdStr('  wheat ')).toBe('wheat')
    expect(ogdStr(null)).toBe('')
    expect(ogdStr(undefined)).toBe('')
  })
})

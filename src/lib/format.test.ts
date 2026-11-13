import { describe, expect, it } from 'vitest'
import { escapeHtml } from './format'

describe('escapeHtml', () => {
  it('escapes markup-significant characters', () => {
    expect(escapeHtml('<b>Agri & "Co"\'s</b>')).toBe('&lt;b&gt;Agri &amp; &quot;Co&quot;&#39;s&lt;/b&gt;')
  })

  it('passes plain text through unchanged', () => {
    expect(escapeHtml('Onion (Nashik)')).toBe('Onion (Nashik)')
  })

  it('handles null/undefined/non-string input', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(42)).toBe('42')
  })
})

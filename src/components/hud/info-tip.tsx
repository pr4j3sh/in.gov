'use client'

import { Info } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const POP_WIDTH = 280

/**
 * Info tooltip rendered in a portal with viewport-clamped FIXED positioning.
 * It overlaps the page as an overlay — it never affects layout.
 */
export function InfoTip({ text, source }: { text: string; source?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const place = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const margin = 10
    let left = rect.right - POP_WIDTH // right-align to button
    if (left < margin) left = margin
    if (left + POP_WIDTH > window.innerWidth - margin) left = window.innerWidth - POP_WIDTH - margin
    // prefer below the button; flip above if it would overflow the bottom
    const estimatedHeight = 120
    let top = rect.bottom + 10
    if (top + estimatedHeight > window.innerHeight - margin && rect.top - estimatedHeight - 10 > margin) {
      top = rect.top - estimatedHeight - 10
    }
    setPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!buttonRef.current?.contains(e.target as Node) && !popRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onScrollOrResize = () => setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="info-tip"
        aria-label="About this section"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={11} strokeWidth={2.2} aria-hidden />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            role="tooltip"
            id={id}
            className="info-pop info-pop-fixed"
            style={{ top: pos.top, left: pos.left, width: POP_WIDTH }}
          >
            {text}
            {source && <em>SOURCE — {source}</em>}
          </div>,
          document.body,
        )}
    </>
  )
}

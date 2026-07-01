'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'

const MAX_TILT = 12 // degrees
const SCALE = 1.04

/**
 * Tracks cursor position over a card and applies:
 *   - An inline 3D tilt transform (rotateX/rotateY + scale)
 *   - CSS variables --mouse-x / --mouse-y for a glare overlay
 *
 * @param withPerspective  When true (default), includes perspective(900px) in
 *   the inline transform. Pass false when a parent already sets CSS perspective.
 */
export function useCardTilt(withPerspective = true) {
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      const el = ref.current
      if (!el) return
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const { clientX, clientY } = e
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const dx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
        const dy = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
        const rotX = -(dy * MAX_TILT)
        const rotY = dx * MAX_TILT
        const mouseX = ((clientX - rect.left) / rect.width) * 100
        const mouseY = ((clientY - rect.top) / rect.height) * 100
        const perspStr = withPerspective ? 'perspective(900px) ' : ''
        el.style.transition = ''
        el.style.transform = `${perspStr}rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${SCALE},${SCALE},${SCALE})`
        el.style.setProperty('--mouse-x', `${mouseX}%`)
        el.style.setProperty('--mouse-y', `${mouseY}%`)
      })
    },
    [withPerspective],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    el.style.transition = 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)'
    el.style.transform = ''
    el.style.setProperty('--mouse-x', '50%')
    el.style.setProperty('--mouse-y', '50%')
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}

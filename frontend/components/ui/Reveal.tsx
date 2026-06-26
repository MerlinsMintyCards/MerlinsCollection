'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'

/**
 * Fades + rises its children into view as they enter the viewport, using
 * IntersectionObserver (the same approach as FlipCard's peek). Falls back to
 * fully visible when reduced motion is requested or IntersectionObserver is
 * unavailable (SSR / jsdom), so content is never stuck hidden.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  /** ms of stagger delay before the reveal transition starts */
  delay?: number
  /** element tag to render (default 'div') */
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const classes = `reveal${shown ? ' reveal-in' : ''}${className ? ' ' + className : ''}`
  return createElement(
    Tag,
    {
      ref,
      className: classes,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

const MAX_TILT = 10 // degrees of cursor-tracked tilt
const SCALE = 1.04 // lift on hover
const FLIP_MS = 800 // flip duration
const RETURN_MS = 600 // tilt snap-back duration

/**
 * A flip card with a cursor-tracked 3D tilt + holographic glare.
 *
 * The flip rotation and the tilt rotation are composed onto ONE element
 * (.flip-inner) as a single transform: `rotateX(tilt) rotateY(flipBase + tilt)
 * scale(...)`. Keeping both on a single 3D element means there is exactly one
 * rotation context, so the two effects compose predictably instead of fighting
 * each other across nested preserve-3d layers. When flipped, the back face nets
 * out to a natural tilt automatically.
 */
export default function FlipCard({
  front,
  back,
  label = 'Flip card',
  className = '',
}: {
  front: ReactNode
  back: ReactNode
  label?: string
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const rafRef = useRef(0)
  const flippedRef = useRef(false) // mirrors state for use inside handlers
  const hoveringRef = useRef(false)
  const flippingRef = useRef(false) // true while a flip animation owns the transform
  const flipTimer = useRef<ReturnType<typeof setTimeout>>()

  const reduceMotion = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // Compose the flip base angle with the cursor tilt into one transform.
  const writeTransform = (tiltX: number, tiltY: number, scale: number) => {
    const el = innerRef.current
    if (!el) return
    const base = flippedRef.current ? 180 : 0
    el.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${(base + tiltY).toFixed(2)}deg) scale(${scale})`
  }

  const animateFlip = (next: boolean) => {
    setFlipped(next)
    flippedRef.current = next
    const el = innerRef.current
    if (!el) return
    if (reduceMotion()) {
      el.style.transition = 'none'
      writeTransform(0, 0, 1)
      return
    }
    // Let the flip animation fully own the transform for its duration so an
    // active mousemove can't snap the tilt mid-flip.
    flippingRef.current = true
    el.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
    writeTransform(0, 0, hoveringRef.current ? SCALE : 1)
    clearTimeout(flipTimer.current)
    flipTimer.current = setTimeout(() => {
      flippingRef.current = false
      if (!hoveringRef.current) {
        el.style.transition = `transform ${RETURN_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        writeTransform(0, 0, 1)
      }
    }, FLIP_MS)
  }

  // One-time "peek" when the card first enters view, unless reduced motion.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    if (reduceMotion() || typeof IntersectionObserver === 'undefined') return

    let done = false
    let inner: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !done) {
            done = true
            inner = setTimeout(() => {
              animateFlip(true)
              inner = setTimeout(() => animateFlip(false), 1000)
            }, 600)
          }
        })
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (inner) clearTimeout(inner)
      clearTimeout(flipTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion()) return
    hoveringRef.current = true
    const stage = stageRef.current
    const el = innerRef.current
    if (!stage || !el) return
    const { clientX, clientY } = e
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      // Measure the stable (untransformed) stage so the tilt can't feed back
      // into its own bounding box and jitter.
      const rect = stage.getBoundingClientRect()
      const px = (clientX - rect.left) / rect.width
      const py = (clientY - rect.top) / rect.height
      el.style.setProperty('--mouse-x', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--mouse-y', `${(py * 100).toFixed(1)}%`)
      // While a flip is playing, only the glare follows the cursor; the flip
      // owns the transform until it finishes.
      if (flippingRef.current) return
      const dx = px * 2 - 1
      const dy = py * 2 - 1
      el.style.transition = 'transform 0.1s ease-out'
      writeTransform(-(dy * MAX_TILT), dx * MAX_TILT, SCALE)
    })
  }

  const onMouseLeave = () => {
    hoveringRef.current = false
    const el = innerRef.current
    if (!el) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    // Snap the tilt back to rest but keep whichever face is showing.
    el.style.transition = `transform ${RETURN_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
    writeTransform(0, 0, 1)
    el.style.setProperty('--mouse-x', '50%')
    el.style.setProperty('--mouse-y', '50%')
  }

  const toggle = () => animateFlip(!flippedRef.current)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div
      ref={stageRef}
      className={`flip-stage ${className}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={flipped}
      data-flipped={flipped}
      onClick={toggle}
      onKeyDown={onKeyDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Single 3D element: the flip and the tilt are composed into one
          transform here so they move as one object. */}
      <div ref={innerRef} className="flip-inner">
        <div className="flip-face flip-front">
          {front}
          <div className="card-glare-overlay" aria-hidden />
        </div>
        <div className="flip-face flip-back">
          {back}
          <div className="card-glare-overlay" aria-hidden />
        </div>
      </div>
    </div>
  )
}

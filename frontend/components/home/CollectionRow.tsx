'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { focusScale } from '@/lib/collectionFocus'
import { useCardTilt } from '@/hooks/useCardTilt'

type Card = { src: string; alt: string }

const FOCUS = { min: 0.92, max: 1.06 }

// Extracted so useCardTilt can be called at the top level (hooks can't be used in map callbacks).
function CollectionCard({ card }: { card: Card }) {
  const { ref, onMouseMove, onMouseLeave } = useCardTilt()
  return (
    <div
      ref={ref}
      className="collection-card relative shrink-0 basis-[44%] sm:basis-auto aspect-[5/7] rounded-xl overflow-hidden shadow-card bg-cream"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <Image
        src={card.src}
        alt={card.alt}
        fill
        sizes="(max-width: 640px) 44vw, 18vw"
        className="object-cover"
      />
      <div className="card-glare-overlay" aria-hidden />
    </div>
  )
}

export default function CollectionRow({ cards }: { cards: Card[] }) {
  const rowRef = useRef<HTMLDivElement>(null)

  // Mobile only: as the row is side-scrolled, the card nearest the centre
  // grows and the rest shrink. On desktop the row isn't scrollable, so this
  // stays inert and the tilt hook owns the interaction instead.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0

    const paint = () => {
      frame = 0
      const cardEls = Array.from(row.children) as HTMLElement[]
      const scrollable = row.scrollWidth - row.clientWidth > 4

      if (!scrollable) {
        cardEls.forEach((el) => {
          el.style.transform = ''
        })
        return
      }

      const rowRect = row.getBoundingClientRect()
      const center = rowRect.left + rowRect.width / 2
      const radius = rowRect.width / 2

      cardEls.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const scale = focusScale(cardCenter - center, radius, FOCUS)
        el.style.transform = `scale(${scale})`
      })
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(paint)
    }

    paint()
    row.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      row.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={rowRef}
      className="collection-row flex sm:grid sm:grid-cols-5 gap-4 overflow-x-auto sm:overflow-visible py-3 sm:py-0"
    >
      {cards.map((card, i) => (
        <CollectionCard key={i} card={card} />
      ))}
    </div>
  )
}

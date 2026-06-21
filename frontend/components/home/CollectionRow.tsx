'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { focusScale } from '@/lib/collectionFocus'

type Card = { src: string; alt: string }

// How far (in scale units) the centre card grows and the edge cards shrink.
const FOCUS = { min: 0.92, max: 1.06 }

export default function CollectionRow({ cards }: { cards: Card[] }) {
  const rowRef = useRef<HTMLDivElement>(null)

  // Mobile only: as the row is side-scrolled, the card nearest the centre
  // grows and the rest shrink. On desktop the row isn't scrollable, so this
  // stays inert and CSS :hover owns the interaction instead.
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
        // Desktop grid — hand the interaction back to CSS hover.
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
        <div
          key={i}
          className="collection-card relative shrink-0 basis-[44%] sm:basis-auto aspect-[5/7] rounded-xl overflow-hidden shadow-card bg-cream"
        >
          <Image
            src={card.src}
            alt={card.alt}
            fill
            sizes="(max-width: 640px) 44vw, 18vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}

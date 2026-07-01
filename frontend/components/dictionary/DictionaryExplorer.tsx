'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

type Term = { term: string; definition: string }

const TERMS: Term[] = [
  { term: 'Raw', definition: 'A card that has not been professionally graded.' },
  {
    term: 'Slab',
    definition: 'A graded card encased in a sealed, tamper-evident plastic holder.',
  },
  {
    term: 'Holo',
    definition: 'Short for holographic: a card with a shiny, reflective foil image.',
  },
  {
    term: 'Reverse holo',
    definition: 'A card where the border and background are foil, but the artwork is not.',
  },
  {
    term: 'Grading',
    definition: "A professional assessment of a card's condition on a numeric scale.",
  },
  {
    term: 'PSA',
    definition: 'Professional Sports Authenticator, a popular third-party grading company.',
  },
  {
    term: 'Mint',
    definition: 'A card in near-perfect condition, with sharp corners and clean edges.',
  },
  {
    term: 'First edition',
    definition: "A card from a set's first print run, marked with a special stamp.",
  },
  {
    term: 'Pull rate',
    definition: 'How often a specific card appears when opening booster packs.',
  },
  {
    term: 'Sealed',
    definition: 'A product still in its original factory packaging, never opened.',
  },
]

export default function DictionaryExplorer() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TERMS
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div>
      <div className="relative max-w-md">
        <Search
          size={18}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest"
        />
        <input
          type="text"
          aria-label="Search terms"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms…"
          className="w-full rounded-xl border border-line bg-cream py-3 pl-10 pr-3 text-forest-deep placeholder:text-muted focus:border-forest focus:outline-none focus:ring-2 focus:ring-mint"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-[#4a4339]">No terms match “{query}”. Try a different word.</p>
      ) : (
        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <div
              key={t.term}
              className="rounded-2xl border border-line bg-cream p-5 transition-colors hover-lift hover:border-mint"
            >
              <dt className="font-serif text-[19px] font-semibold text-forest-deep">{t.term}</dt>
              <dd className="mt-1.5 text-[15px] text-[#4a4339]">{t.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

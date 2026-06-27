'use client'

import { useRef, useState } from 'react'
import { Search } from 'lucide-react'
import CardGrid from './CardGrid'
import {
  searchInventory,
  type CardSearchResponse,
  type InventoryFilters,
} from '@/lib/inventory'

type Status = 'idle' | 'loading' | 'success' | 'error'

// Curated option sets (backend maps these to the pokemontcg.io query).
const SETS = [
  'Base',
  'Jungle',
  'Fossil',
  'Team Rocket',
  'Neo Genesis',
  'Expedition',
  'Ruby & Sapphire',
  'Diamond & Pearl',
  'Black & White',
  'XY Evolutions',
  'Sword & Shield',
  'Brilliant Stars',
  'Scarlet & Violet',
  '151',
]
const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Ultra',
  'Rare Secret',
  'Rare Rainbow',
  'Promo',
]
const TYPES = [
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Fairy',
  'Dragon',
  'Colorless',
]

// Guard against an inverted price range reaching the API — swap if min > max.
function normalizePriceRange(filters: InventoryFilters): InventoryFilters {
  const out: InventoryFilters = { ...filters }
  const min = parseFloat(out.minPrice ?? '')
  const max = parseFloat(out.maxPrice ?? '')
  if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
    out.minPrice = String(max)
    out.maxPrice = String(min)
  }
  return out
}

const fieldClass = 'vault-field w-full rounded-lg px-3 py-2.5 text-sm'
const labelClass =
  'mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-pine-300'

export default function FilterPanel() {
  const [filters, setFilters] = useState<InventoryFilters>({})
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CardSearchResponse | null>(null)
  // Monotonic id so a slow earlier request can't overwrite a newer one.
  const requestId = useRef(0)

  function update<K extends keyof InventoryFilters>(key: K, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const id = ++requestId.current
    setStatus('loading')
    try {
      const res = await searchInventory(normalizePriceRange(filters))
      if (id !== requestId.current) return
      setResult(res)
      setStatus('success')
    } catch {
      if (id !== requestId.current) return
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl vault-panel p-4 sm:p-5"
        aria-label="Filter the inventory"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="flt-name" className={labelClass}>
              Card name
            </label>
            <input
              id="flt-name"
              type="text"
              value={filters.name ?? ''}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Charizard"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="flt-set" className={labelClass}>
              Set
            </label>
            <select
              id="flt-set"
              value={filters.set ?? ''}
              onChange={(e) => update('set', e.target.value)}
              className={fieldClass}
            >
              <option value="">Any set</option>
              {SETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="flt-rarity" className={labelClass}>
              Rarity
            </label>
            <select
              id="flt-rarity"
              value={filters.rarity ?? ''}
              onChange={(e) => update('rarity', e.target.value)}
              className={fieldClass}
            >
              <option value="">Any rarity</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="flt-type" className={labelClass}>
              Type
            </label>
            <select
              id="flt-type"
              value={filters.type ?? ''}
              onChange={(e) => update('type', e.target.value)}
              className={fieldClass}
            >
              <option value="">Any type</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="flt-min" className={labelClass}>
              Min price ($)
            </label>
            <input
              id="flt-min"
              type="number"
              min={0}
              value={filters.minPrice ?? ''}
              onChange={(e) => update('minPrice', e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="flt-max" className={labelClass}>
              Max price ($)
            </label>
            <input
              id="flt-max"
              type="number"
              min={0}
              value={filters.maxPrice ?? ''}
              onChange={(e) => update('maxPrice', e.target.value)}
              placeholder="Any"
              className={fieldClass}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              aria-busy={status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-semibold text-pine-950 transition-colors hover:bg-mint-soft"
            >
              <Search size={16} aria-hidden />
              {status === 'loading' ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      <div aria-live="polite">
        <Results status={status} result={result} />
      </div>
    </div>
  )
}

function Results({
  status,
  result,
}: {
  status: Status
  result: CardSearchResponse | null
}) {
  if (status === 'idle') {
    return (
      <p className="py-10 text-center text-sm text-pine-300">
        Set your filters and run a search to browse the collection.
      </p>
    )
  }
  if (status === 'loading') {
    return (
      <p className="py-10 text-center font-mono text-sm text-mint">Searching the vault…</p>
    )
  }
  if (status === 'error') {
    return (
      <p className="py-10 text-center text-sm text-red-300">
        Something went wrong. Check your connection and try again.
      </p>
    )
  }
  if (!result || result.data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-pine-300">
        No cards found. Try widening your filters.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-pine-300">
        {result.totalCount} result{result.totalCount === 1 ? '' : 's'}
      </p>
      <CardGrid cards={result.data} />
    </div>
  )
}

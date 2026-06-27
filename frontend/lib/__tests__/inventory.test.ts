import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api'
import {
  pickMarketPrice,
  formatPrice,
  buildSearchQuery,
  searchInventory,
  sendChat,
  type PokemonCard,
} from '@/lib/inventory'

const mockedApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

function makeCard(overrides: Partial<PokemonCard> = {}): PokemonCard {
  return {
    id: 'base1-4',
    name: 'Charizard',
    supertype: 'Pokémon',
    number: '4',
    set: {
      id: 'base1',
      name: 'Base',
      series: 'Base',
      releaseDate: '1999/01/09',
      images: { symbol: '', logo: '' },
    },
    images: { small: 'https://img/small.png', large: 'https://img/large.png' },
    ...overrides,
  }
}

describe('pickMarketPrice', () => {
  it('returns null when the card has no tcgplayer data', () => {
    expect(pickMarketPrice(makeCard())).toBeNull()
  })

  it('returns null when the prices object is empty', () => {
    expect(pickMarketPrice(makeCard({ tcgplayer: { url: 'u', prices: {} } }))).toBeNull()
  })

  it('prefers the holofoil market price over other variants', () => {
    const card = makeCard({
      tcgplayer: {
        url: 'u',
        prices: {
          normal: { low: 1, mid: 2, high: 3, market: 5, directLow: null },
          holofoil: { low: 10, mid: 20, high: 30, market: 25, directLow: null },
        },
      },
    })
    expect(pickMarketPrice(card)).toBe(25)
  })

  it('skips a variant whose market is null and uses the next valued one', () => {
    const card = makeCard({
      tcgplayer: {
        url: 'u',
        prices: {
          holofoil: { low: 10, mid: 20, high: 30, market: null, directLow: null },
          normal: { low: 1, mid: 2, high: 3, market: 4, directLow: null },
        },
      },
    })
    expect(pickMarketPrice(card)).toBe(4)
  })
})

describe('formatPrice', () => {
  it('formats a number as USD currency with two decimals', () => {
    expect(formatPrice(250.4)).toBe('$250.40')
    expect(formatPrice(12.5)).toBe('$12.50')
  })

  it('returns a friendly fallback for a null price', () => {
    expect(formatPrice(null)).toBe('Price N/A')
  })
})

describe('buildSearchQuery', () => {
  it('omits empty / undefined fields', () => {
    expect(buildSearchQuery({ name: 'Charizard', set: '', rarity: undefined })).toBe(
      'name=Charizard',
    )
  })

  it('URL-encodes special characters', () => {
    expect(buildSearchQuery({ name: "Farfetch'd & Mr. Mime" })).toContain(
      'name=Farfetch%27d+%26+Mr.+Mime',
    )
  })

  it('includes every provided filter', () => {
    const params = new URLSearchParams(
      buildSearchQuery({
        name: 'Pikachu',
        set: 'Base',
        rarity: 'Rare Holo',
        type: 'Lightning',
        minPrice: '5',
        maxPrice: '50',
      }),
    )
    expect(params.get('name')).toBe('Pikachu')
    expect(params.get('set')).toBe('Base')
    expect(params.get('rarity')).toBe('Rare Holo')
    expect(params.get('type')).toBe('Lightning')
    expect(params.get('minPrice')).toBe('5')
    expect(params.get('maxPrice')).toBe('50')
  })
})

describe('searchInventory', () => {
  it('calls GET /inventory/search with the built query string', async () => {
    mockedApiFetch.mockResolvedValue({ data: [], page: 1, pageSize: 0, count: 0, totalCount: 0 })
    await searchInventory({ name: 'Charizard' })
    expect(mockedApiFetch).toHaveBeenCalledWith('/inventory/search?name=Charizard')
  })

  it('hits the bare path when there are no filters', async () => {
    mockedApiFetch.mockResolvedValue({ data: [], page: 1, pageSize: 0, count: 0, totalCount: 0 })
    await searchInventory({})
    expect(mockedApiFetch).toHaveBeenCalledWith('/inventory/search')
  })
})

describe('sendChat', () => {
  it('POSTs the message and history to /chat as JSON', async () => {
    mockedApiFetch.mockResolvedValue({ reply: 'hi' })
    await sendChat('How much is Charizard?', [])
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: 'How much is Charizard?', history: [] }),
      }),
    )
  })
})

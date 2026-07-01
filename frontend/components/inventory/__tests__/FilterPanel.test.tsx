import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api'
import FilterPanel from '@/components/inventory/FilterPanel'
import type { CardSearchResponse, PokemonCard } from '@/lib/inventory'

const mockedApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

const charizard: PokemonCard = {
  id: 'base1-4',
  name: 'Charizard',
  supertype: 'Pokémon',
  number: '4',
  rarity: 'Rare Holo',
  set: { id: 'base1', name: 'Base', series: 'Base', releaseDate: '1999', images: { symbol: '', logo: '' } },
  images: { small: 'https://img/charizard.png', large: '' },
  tcgplayer: { url: 'u', prices: { holofoil: { low: 1, mid: 2, high: 3, market: 250.42, directLow: null } } },
}

function response(cards: PokemonCard[]): CardSearchResponse {
  return { data: cards, page: 1, pageSize: cards.length, count: cards.length, totalCount: cards.length }
}

describe('FilterPanel', () => {
  it('searches on submit and renders matching cards with prices', async () => {
    mockedApiFetch.mockResolvedValue(response([charizard]))
    render(<FilterPanel />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Charizard')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(mockedApiFetch).toHaveBeenCalledWith('/inventory/search?name=Charizard')
    expect(await screen.findByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('$250.42')).toBeInTheDocument()
  })

  it('submits on Enter from the name field', async () => {
    mockedApiFetch.mockResolvedValue(response([charizard]))
    render(<FilterPanel />)
    await userEvent.type(screen.getByLabelText(/name/i), 'Charizard{Enter}')
    expect(mockedApiFetch).toHaveBeenCalledWith('/inventory/search?name=Charizard')
  })

  it('swaps an inverted price range before searching', async () => {
    mockedApiFetch.mockResolvedValue(response([]))
    render(<FilterPanel />)
    await userEvent.type(screen.getByLabelText(/min price/i), '50')
    await userEvent.type(screen.getByLabelText(/max price/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(mockedApiFetch).toHaveBeenCalledWith('/inventory/search?minPrice=10&maxPrice=50')
  })

  it('shows an empty state when nothing matches', async () => {
    mockedApiFetch.mockResolvedValue(response([]))
    render(<FilterPanel />)
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(await screen.findByText(/no cards/i)).toBeInTheDocument()
  })

  it('shows an error state when the request fails', async () => {
    mockedApiFetch.mockRejectedValue(new Error('boom'))
    render(<FilterPanel />)
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('ignores a stale response when a newer search resolves first', async () => {
    let resolveFirst: (value: CardSearchResponse) => void = () => {}
    const firstPending = new Promise<CardSearchResponse>((res) => {
      resolveFirst = res
    })
    const blastoise: PokemonCard = { ...charizard, id: 'base1-2', name: 'Blastoise' }
    mockedApiFetch
      .mockImplementationOnce(() => firstPending)
      .mockImplementationOnce(() => Promise.resolve(response([blastoise])))

    render(<FilterPanel />)
    const search = screen.getByRole('button', { name: /search/i })
    await userEvent.click(search) // first request — stays pending
    await userEvent.click(search) // second request — resolves immediately

    expect(await screen.findByText('Blastoise')).toBeInTheDocument()

    // The stale first request now resolves; it must not overwrite the newer result.
    resolveFirst(response([charizard]))
    await waitFor(() => expect(screen.queryByText('Charizard')).not.toBeInTheDocument())
    expect(screen.getByText('Blastoise')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}))

import CardGrid from '@/components/inventory/CardGrid'
import type { PokemonCard } from '@/lib/inventory'

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

const pikachu: PokemonCard = {
  id: 'jungle-60',
  name: 'Pikachu',
  supertype: 'Pokémon',
  number: '60',
  rarity: 'Common',
  set: { id: 'jungle', name: 'Jungle', series: 'Base', releaseDate: '1999', images: { symbol: '', logo: '' } },
  images: { small: 'https://img/pikachu.png', large: '' },
}

describe('CardGrid', () => {
  it('renders a tile per card with name, set, rarity and market price', () => {
    render(<CardGrid cards={[charizard, pikachu]} />)
    expect(screen.getByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('Rare Holo')).toBeInTheDocument()
    expect(screen.getByText('$250.42')).toBeInTheDocument()
    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('Jungle')).toBeInTheDocument()
  })

  it('shows a price fallback when the market price is missing', () => {
    render(<CardGrid cards={[pikachu]} />)
    expect(screen.getByText('Price N/A')).toBeInTheDocument()
  })

  it('uses the card name as the image alt text', () => {
    render(<CardGrid cards={[charizard]} />)
    expect(screen.getByRole('img', { name: /charizard/i })).toBeInTheDocument()
  })
})

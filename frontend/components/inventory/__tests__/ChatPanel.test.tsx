import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}))

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api'
import ChatPanel from '@/components/inventory/ChatPanel'
import type { PokemonCard } from '@/lib/inventory'

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

describe('ChatPanel', () => {
  it('sends a message and renders both the user message and the assistant reply', async () => {
    mockedApiFetch.mockResolvedValue({ reply: 'Charizard is about $250.' })
    render(<ChatPanel />)

    await userEvent.type(screen.getByRole('textbox'), 'How much is Charizard?')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText('How much is Charizard?')).toBeInTheDocument()
    expect(await screen.findByText('Charizard is about $250.')).toBeInTheDocument()
    expect(mockedApiFetch).toHaveBeenCalledWith('/chat', expect.objectContaining({ method: 'POST' }))
  })

  it('includes prior turns in the history on a follow-up message', async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ reply: 'First answer.' })
      .mockResolvedValueOnce({ reply: 'Second answer.' })
    render(<ChatPanel />)
    const box = screen.getByRole('textbox')

    await userEvent.type(box, 'first question')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText('First answer.')).toBeInTheDocument()

    await userEvent.type(box, 'second question')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText('Second answer.')).toBeInTheDocument()

    expect(mockedApiFetch).toHaveBeenLastCalledWith(
      '/chat',
      expect.objectContaining({
        body: JSON.stringify({
          message: 'second question',
          history: [
            { role: 'user', content: 'first question' },
            { role: 'assistant', content: 'First answer.' },
          ],
        }),
      }),
    )
  })

  it('does not send an empty message', async () => {
    render(<ChatPanel />)
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(mockedApiFetch).not.toHaveBeenCalled()
  })

  it('renders any cards returned with the reply', async () => {
    mockedApiFetch.mockResolvedValue({ reply: 'Here is one:', cards: [charizard] })
    render(<ChatPanel />)
    await userEvent.type(screen.getByRole('textbox'), 'show me charizard')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('$250.42')).toBeInTheDocument()
  })

  it('shows an error bubble when the request fails', async () => {
    mockedApiFetch.mockRejectedValue(new Error('boom'))
    render(<ChatPanel />)
    await userEvent.type(screen.getByRole('textbox'), 'hi')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })
})

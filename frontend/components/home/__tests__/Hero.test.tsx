import { render, screen } from '@testing-library/react'
import Hero from '@/components/home/Hero'

describe('Hero', () => {
  it('renders the headline and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('handled with care')
    expect(screen.getByRole('link', { name: 'Read our story' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'See upcoming shows' })).toHaveAttribute('href', '/shows')
  })

  it('renders the flippable card', () => {
    render(<Hero />)
    expect(screen.getByRole('button', { name: /tap to flip/i })).toBeInTheDocument()
  })
})

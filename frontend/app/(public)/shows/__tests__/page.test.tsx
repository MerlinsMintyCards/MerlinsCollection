import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}))

import ShowsPage from '@/app/(public)/shows/page'

describe('Shows page', () => {
  it('renders the page heading', () => {
    render(<ShowsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/show/i)
  })

  it('separates upcoming and past shows', () => {
    render(<ShowsPage />)
    expect(screen.getByRole('heading', { name: /upcoming shows/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /past shows/i })).toBeInTheDocument()
  })

  it('lists a sample upcoming show', () => {
    render(<ShowsPage />)
    expect(screen.getByText('Twin Oaks Portland')).toBeInTheDocument()
  })

  it('links to the contact section for bookings', () => {
    render(<ShowsPage />)
    expect(screen.getByRole('link', { name: /get in touch/i })).toHaveAttribute(
      'href',
      '/about#contact',
    )
  })
})

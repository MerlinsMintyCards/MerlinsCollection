import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}))

import AboutPage from '@/app/(public)/about/page'

describe('About page', () => {
  it('renders the page heading', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/about/i)
  })

  it('tells the brand story (friends + Merlin)', () => {
    render(<AboutPage />)
    expect(screen.getAllByText(/Merlin/).length).toBeGreaterThan(0)
  })

  it('has a contact section the footer can anchor to', () => {
    const { container } = render(<AboutPage />)
    expect(container.querySelector('#contact')).toBeTruthy()
  })

  it('exposes the business email as a mailto link', () => {
    render(<AboutPage />)
    expect(
      screen.getByRole('link', { name: /merlinsmintycardsllc@gmail.com/i }),
    ).toHaveAttribute('href', 'mailto:merlinsmintycardsllc@gmail.com')
  })
})

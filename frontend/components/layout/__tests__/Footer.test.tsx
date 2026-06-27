import { render, screen } from '@testing-library/react'

import Footer from '@/components/layout/Footer'

describe('Footer', () => {
  it('renders the three column headings', () => {
    render(<Footer />)
    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Collect')).toBeInTheDocument()
    expect(screen.getByText('Follow')).toBeInTheDocument()
  })

  it('renders an external Instagram link', () => {
    render(<Footer />)
    const ig = screen.getByRole('link', { name: 'Instagram' })
    expect(ig).toHaveAttribute('href', expect.stringContaining('instagram.com'))
  })

  it('renders the copyright line', () => {
    render(<Footer />)
    expect(screen.getByText(/Merlin's Minty Cards LLC/)).toBeInTheDocument()
  })
})

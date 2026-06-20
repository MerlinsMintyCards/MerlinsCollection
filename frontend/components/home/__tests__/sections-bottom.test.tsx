import { render, screen } from '@testing-library/react'
import FeaturedFinds from '@/components/home/FeaturedFinds'
import ShowsPreview from '@/components/home/ShowsPreview'
import LearnHub from '@/components/home/LearnHub'
import FinalCTA from '@/components/home/FinalCTA'

describe('bottom Home sections', () => {
  it('FeaturedFinds links to the inventory', () => {
    render(<FeaturedFinds />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'A peek at the collection.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore the inventory/ })).toHaveAttribute(
      'href',
      '/inventory',
    )
  })

  it('ShowsPreview links to the shows page', () => {
    render(<ShowsPreview />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Catch us at a card show.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All shows' })).toHaveAttribute('href', '/shows')
  })

  it('LearnHub links to articles and dictionary', () => {
    render(<LearnHub />)
    expect(screen.getByRole('link', { name: /Articles & guides/ })).toHaveAttribute(
      'href',
      '/articles',
    )
    expect(screen.getByRole('link', { name: /Collectors Dictionary/ })).toHaveAttribute(
      'href',
      '/dictionary',
    )
  })

  it('FinalCTA renders the closing call to action', () => {
    render(<FinalCTA />)
    expect(
      screen.getByRole('heading', { level: 2, name: "Let's find your card." }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/about#contact')
  })
})

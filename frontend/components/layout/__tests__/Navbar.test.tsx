import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Navbar from '@/components/layout/Navbar'

describe('Navbar', () => {
  it('renders the primary nav links with correct hrefs', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Shows' })).toHaveAttribute('href', '/shows')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Dictionary' })).toHaveAttribute('href', '/dictionary')
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/articles')
  })

  it('renders Inventory CTAs pointing to /inventory', () => {
    render(<Navbar />)
    // One CTA lives in the desktop bar, one inside the mobile dropdown menu.
    const inventoryLinks = screen.getAllByRole('link', { name: 'Inventory' })
    expect(inventoryLinks.length).toBeGreaterThan(0)
    inventoryLinks.forEach((link) => expect(link).toHaveAttribute('href', '/inventory'))
  })

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const btn = screen.getByRole('button', { name: 'Menu' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})

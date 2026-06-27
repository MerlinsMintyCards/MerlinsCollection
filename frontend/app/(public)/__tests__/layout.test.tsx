import { render, screen } from '@testing-library/react'

import PublicLayout from '@/app/(public)/layout'

describe('public layout', () => {
  it('wraps children with the Navbar (Inventory CTA) and Footer', () => {
    render(
      <PublicLayout>
        <div>PAGE BODY</div>
      </PublicLayout>,
    )
    expect(screen.getByText('PAGE BODY')).toBeInTheDocument()
    // "Inventory" appears in BOTH Navbar and Footer, so assert each region uniquely:
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument() // Navbar (mobile toggle)
    expect(screen.getByText('Explore')).toBeInTheDocument() // Footer column heading
  })
})

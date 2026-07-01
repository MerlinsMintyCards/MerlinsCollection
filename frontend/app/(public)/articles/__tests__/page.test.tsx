import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import ArticlesPage from '@/app/(public)/articles/page'

describe('Articles page', () => {
  it('renders the page heading', () => {
    render(<ArticlesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/articles|guides/i)
  })

  it('lists article previews that link to their pages', () => {
    render(<ArticlesPage />)
    const link = screen.getByRole('link', { name: /How to spot a fake/i })
    expect(link).toHaveAttribute('href', '/articles/spotting-fakes')
  })
})

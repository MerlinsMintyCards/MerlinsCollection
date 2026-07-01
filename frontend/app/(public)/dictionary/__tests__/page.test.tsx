import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import DictionaryPage from '@/app/(public)/dictionary/page'

describe('Dictionary page', () => {
  it('renders the page heading', () => {
    render(<DictionaryPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/dictionary/i)
  })

  it('lists collector terms', () => {
    render(<DictionaryPage />)
    expect(screen.getByText('Holo')).toBeInTheDocument()
    expect(screen.getByText('Sealed')).toBeInTheDocument()
  })

  it('filters the list as you type', async () => {
    render(<DictionaryPage />)
    await userEvent.type(screen.getByRole('textbox'), 'sealed')
    expect(screen.getByText('Sealed')).toBeInTheDocument()
    expect(screen.queryByText('Holo')).not.toBeInTheDocument()
  })
})

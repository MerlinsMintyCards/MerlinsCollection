import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ModeToggle from '@/components/inventory/ModeToggle'

describe('ModeToggle', () => {
  it('renders both modes and marks the active one as selected', () => {
    render(<ModeToggle mode="filter" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /filter/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the chosen mode when the inactive tab is clicked', async () => {
    const onChange = vi.fn()
    render(<ModeToggle mode="filter" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: /chat/i }))
    expect(onChange).toHaveBeenCalledWith('chat')
  })

  it('moves between tabs with the arrow keys', async () => {
    const onChange = vi.fn()
    render(<ModeToggle mode="filter" onChange={onChange} />)
    screen.getByRole('tab', { name: /filter/i }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('chat')
  })

  it('wires each tab to its panel via aria-controls', () => {
    render(<ModeToggle mode="filter" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /filter/i })).toHaveAttribute(
      'aria-controls',
      'panel-filter',
    )
    expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute(
      'aria-controls',
      'panel-chat',
    )
  })
})

'use client'

import { useRef } from 'react'
import { Filter, MessageSquare } from 'lucide-react'

export type SearchMode = 'filter' | 'chat'

const tabs: { id: SearchMode; label: string; icon: typeof Filter }[] = [
  { id: 'filter', label: 'Filter', icon: Filter },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
]

/**
 * Segmented "brushed-metal" switch between the two inventory search modes.
 * Implements the WAI-ARIA tabs pattern: roving tabindex + arrow-key nav, with
 * each tab wired to its panel via aria-controls. The page owns the active mode.
 */
export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: SearchMode
  onChange: (mode: SearchMode) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return

    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Search mode"
      className="inline-flex rounded-xl border border-pine-700 bg-pine-900 p-1"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const active = mode === id
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-gradient-to-b from-pine-700 to-pine-800 text-mint shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-pine-300 hover:text-pine-100'
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}

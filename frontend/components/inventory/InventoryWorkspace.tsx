'use client'

import { useState } from 'react'
import ModeToggle, { type SearchMode } from './ModeToggle'
import FilterPanel from './FilterPanel'
import ChatPanel from './ChatPanel'

/**
 * Client shell for the inventory tool: owns the active search mode and shows
 * exactly one panel at a time (structured filters vs. natural-language chat).
 */
export default function InventoryWorkspace() {
  const [mode, setMode] = useState<SearchMode>('filter')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-pine-300">
          {mode === 'filter' ? 'Structured search' : 'AI assistant · Bedrock'}
        </p>
      </div>

      <div
        role="tabpanel"
        id={`panel-${mode}`}
        aria-labelledby={`tab-${mode}`}
        tabIndex={0}
        className="focus:outline-none"
      >
        {mode === 'filter' ? <FilterPanel /> : <ChatPanel />}
      </div>
    </div>
  )
}

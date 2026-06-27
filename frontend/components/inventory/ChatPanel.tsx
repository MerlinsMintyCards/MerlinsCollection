'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import CardGrid from './CardGrid'
import { sendChat, type ChatMessage, type PokemonCard } from '@/lib/inventory'

type Bubble = {
  role: 'user' | 'assistant' | 'error'
  content: string
  cards?: PokemonCard[]
}

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Bubble[]>([])
  const [sending, setSending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const history: ChatMessage[] = messages
      .filter((m): m is Bubble & { role: 'user' | 'assistant' } => m.role !== 'error')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const res = await sendChat(text, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply, cards: res.cards },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: 'Something went wrong. Try asking again.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl vault-panel">
      <div
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-pine-100">Ask Merlin about the collection</p>
            <p className="mt-1 max-w-[42ch] text-sm text-pine-300">
              Try “What Charizards do you have under $300?” or “Show me holo cards from Base
              set.”
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <ChatBubble key={i} bubble={m} />
        ))}

        {sending && (
          <p className="font-mono text-xs text-mint" aria-live="polite">
            Merlin is thinking…
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-pine-700 p-3"
      >
        <input
          type="text"
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a card, set, or price…"
          disabled={sending}
          className="vault-field flex-1 rounded-lg px-3 py-2.5 text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-pine-950 transition-colors hover:bg-mint-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={16} aria-hidden />
          Send
        </button>
      </form>
    </div>
  )
}

function ChatBubble({ bubble }: { bubble: Bubble }) {
  if (bubble.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-mint px-4 py-2.5 text-sm text-pine-950">
          {bubble.content}
        </p>
      </div>
    )
  }
  const isError = bubble.role === 'error'
  return (
    <div className="space-y-3">
      <p
        className={`max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm ${
          isError
            ? 'bg-red-500/10 text-red-300'
            : 'bg-pine-800 text-pine-100'
        }`}
      >
        {bubble.content}
      </p>
      {bubble.cards && bubble.cards.length > 0 && <CardGrid cards={bubble.cards} />}
    </div>
  )
}

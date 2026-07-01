// Inventory data layer — modeled on the pokemontcg.io v2 card schema.
// Implemented via TDD. The FastAPI backend exposes flat query params on
// GET /inventory/search and a JSON chat endpoint at POST /chat.
import { apiFetch } from './api'

/** A single TCGplayer price variant (USD). Any field may be null. */
export interface TcgPrice {
  low: number | null
  mid: number | null
  high: number | null
  market: number | null
  directLow: number | null
}

/** pokemontcg.io v2 card object (the subset the UI uses). */
export interface PokemonCard {
  id: string
  name: string
  supertype: string
  subtypes?: string[]
  hp?: string
  types?: string[]
  number: string
  rarity?: string
  artist?: string
  flavorText?: string
  set: {
    id: string
    name: string
    series: string
    releaseDate: string
    images: { symbol: string; logo: string }
  }
  images: { small: string; large: string }
  tcgplayer?: {
    url: string
    updatedAt?: string
    prices?: Record<string, TcgPrice>
  }
}

/** pokemontcg.io v2 list response wrapper. */
export interface CardSearchResponse {
  data: PokemonCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

/** Flat filter params the FastAPI `/inventory/search` endpoint accepts. */
export interface InventoryFilters {
  name?: string
  set?: string
  rarity?: string
  type?: string
  minPrice?: string
  maxPrice?: string
  page?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  cards?: PokemonCard[]
}

// TCGplayer keys a card's prices by printing variant. Pick the most
// representative one deterministically rather than relying on key order.
const VARIANT_PRECEDENCE = [
  'holofoil',
  'reverseHolofoil',
  'normal',
  '1stEditionHolofoil',
  '1stEditionNormal',
  'unlimited',
  'unlimitedHolofoil',
]

/** The single market price we show for a card, or null when unknown. */
export function pickMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices
  if (!prices) return null
  for (const variant of VARIANT_PRECEDENCE) {
    const market = prices[variant]?.market
    if (typeof market === 'number') return market
  }
  // Unknown variant key — fall back to the first one with a real market price.
  for (const price of Object.values(prices)) {
    if (typeof price.market === 'number') return price.market
  }
  return null
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Format a USD price, or a friendly fallback when the price is unknown. */
export function formatPrice(value: number | null): string {
  return value === null ? 'Price N/A' : usd.format(value)
}

const FILTER_KEYS: (keyof InventoryFilters)[] = [
  'name',
  'set',
  'rarity',
  'type',
  'minPrice',
  'maxPrice',
  'page',
]

/** Build a flat, URL-encoded query string from filters, omitting empty fields. */
export function buildSearchQuery(filters: InventoryFilters): string {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value))
    }
  }
  return params.toString()
}

/** Search the inventory via the FastAPI backend (filter mode). */
export async function searchInventory(filters: InventoryFilters): Promise<CardSearchResponse> {
  const query = buildSearchQuery(filters)
  return apiFetch<CardSearchResponse>(
    query ? `/inventory/search?${query}` : '/inventory/search',
  )
}

/** Send a chat message (with prior turns) to the Bedrock-backed endpoint. */
export async function sendChat(message: string, history: ChatMessage[]): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
}

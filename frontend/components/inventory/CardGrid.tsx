import CardTile from './CardTile'
import type { PokemonCard } from '@/lib/inventory'

/** Responsive grid of card result tiles. */
export default function CardGrid({ cards }: { cards: PokemonCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  )
}

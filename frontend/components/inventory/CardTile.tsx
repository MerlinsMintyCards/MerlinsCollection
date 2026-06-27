import Image from 'next/image'
import { pickMarketPrice, formatPrice, type PokemonCard } from '@/lib/inventory'

/** A single result card in the steel results grid. */
export default function CardTile({ card }: { card: PokemonCard }) {
  const price = formatPrice(pickMarketPrice(card))

  return (
    <article className="group overflow-hidden rounded-xl vault-panel transition-colors hover:border-mint/50">
      <div className="relative aspect-[245/342] bg-pine-950">
        {card.images?.small ? (
          <Image
            src={card.images.small}
            alt={card.name}
            width={245}
            height={342}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
            className="h-full w-full object-contain"
          />
        ) : (
          <div
            role="img"
            aria-label={card.name}
            className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-semibold text-pine-400"
          >
            {card.name}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <h3 className="truncate font-semibold text-pine-100" title={card.name}>
          {card.name}
        </h3>
        <div className="flex items-center justify-between gap-2 font-mono text-[12px] text-pine-300">
          <span className="truncate">{card.set?.name ?? 'Unknown set'}</span>
          <span className="shrink-0">#{card.number}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          {card.rarity ? (
            <span className="rounded-full border border-pine-600 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-pine-200">
              {card.rarity}
            </span>
          ) : (
            <span />
          )}
          <span className="font-mono text-sm font-semibold text-mint">{price}</span>
        </div>
      </div>
    </article>
  )
}

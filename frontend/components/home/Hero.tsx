import Image from 'next/image'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Eyebrow from '@/components/ui/Eyebrow'
import FlipCard from '@/components/ui/FlipCard'

export default function Hero() {
  return (
    <section className="py-[60px]">
      <Container>
        <div className="grid wide:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <Eyebrow>Buy · Sell · Trade</Eyebrow>
            <h1 className="font-serif font-semibold text-forest-deep leading-[1.1] tracking-[-0.01em] text-[clamp(34px,6.4vw,46px)] my-4">
              Pokémon cards,
              <br />
              and a cat named Merlin.
            </h1>
            <p className="text-muted text-[clamp(16px,2.4vw,19px)] max-w-[42ch] mb-7">
              We&apos;re a few college friends who rediscovered our love of Pokémon. You&apos;ll
              often find us set up at card shows around the area, buying, selling, and trading cards.
              Merlin is our cat. He thinks he&apos;s in charge, but doesn&apos;t really do much.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5">
              <Button href="/about">Read our story</Button>
              <Button href="/shows" variant="ghost">
                See upcoming shows
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center order-first wide:order-none">
            <FlipCard
              label="Merlin the cat — tap to flip"
              front={
                <Image
                  src="/images/cards/Merlin_card.webp"
                  alt="Merlin the cat as a custom Pokémon-style card"
                  fill
                  sizes="(max-width: 900px) 72vw, 262px"
                  className="object-cover"
                  priority
                />
              }
              back={
                <Image
                  src="/images/cards/pokemon_card_backside.webp"
                  alt="Classic Pokémon card back"
                  fill
                  sizes="(max-width: 900px) 72vw, 262px"
                  className="object-cover"
                />
              }
            />
            <p className="text-center text-[12px] text-muted mt-3.5">
              <span className="hidden nav:inline">↕ Hover or tap to flip</span>
              <span className="inline nav:hidden">👆 Tap to flip</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}

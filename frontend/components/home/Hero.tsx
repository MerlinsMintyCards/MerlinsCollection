import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Eyebrow from '@/components/ui/Eyebrow'
import ImagePlaceholder from '@/components/ui/ImagePlaceholder'
import FlipCard from '@/components/ui/FlipCard'

export default function Hero() {
  return (
    <section className="py-[60px]">
      <Container>
        <div className="grid wide:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <Eyebrow>Buy · Sell · Trade</Eyebrow>
            <h1 className="font-serif font-semibold text-forest-deep leading-[1.1] tracking-[-0.01em] text-[clamp(34px,6.4vw,54px)] my-4">
              Pokémon cards,
              <br />
              handled with care.
            </h1>
            <p className="text-muted text-[clamp(16px,2.4vw,19px)] max-w-[42ch] mb-7">
              Merlin&apos;s Minty Cards is a collector-run shop built on 25 years in the hobby — fair
              grading, honest pricing, and a friendly face at every card show.
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
              label="Lapras card — tap to flip"
              front={
                <ImagePlaceholder
                  label="Front: real graded card photo (e.g. laprassouthern.webp)"
                  className="w-full h-full"
                />
              }
              back={
                <ImagePlaceholder
                  label="Card back: classic Pokémon back image"
                  className="w-full h-full bg-gradient-to-br from-[#3457b0] to-[#1d2f6b]"
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

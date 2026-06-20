import Image from 'next/image'
import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Button from '@/components/ui/Button'

export default function StoryTeaser() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <div className="grid wide:grid-cols-[0.95fr_1.05fr] gap-7 wide:gap-12 items-center">
          <Image
            src="/images/about-us/childhood-card-collection.webp"
            alt="Merlin's childhood Pokémon card collection laid out on the floor"
            width={560}
            height={360}
            className="w-full h-auto rounded-[18px] shadow-card object-cover"
          />
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-3.5">
              It started with one binder.
            </h2>
            <p className="text-[#4a4339] mb-3.5">
              What began as a kid laying every card out on the living-room floor turned into a
              quarter-century of collecting, trading, and helping other people find the cards
              they&apos;ve been chasing.
            </p>
            <p className="text-[#4a4339] mb-3.5">
              Today it&apos;s about the same thing it always was: the joy of the find, treated with
              honesty and care.
            </p>
            <Button href="/about" variant="ghost">
              More about Merlin
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

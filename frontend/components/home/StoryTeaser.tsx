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
            alt="A childhood Pokémon card collection spread out on the floor"
            width={560}
            height={360}
            className="w-full h-auto rounded-[18px] shadow-card object-cover"
          />
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-3.5">
              A few friends, a lot of cards, and a cat.
            </h2>
            <p className="text-[#4a4339] mb-3.5">
              We&apos;re a group of college friends who grew up cracking packs and never quit. Now we
              pool our collections and set up at card shows to buy, sell, and trade with people who
              love this stuff as much as we do.
            </p>
            <p className="text-[#4a4339] mb-3.5">
              The name comes from Merlin, one of our cats. He&apos;s never sorted a single card in his
              life, but he made a great mascot, so he got the logo.
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

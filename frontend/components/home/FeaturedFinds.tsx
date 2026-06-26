import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Button from '@/components/ui/Button'
import CollectionRow from '@/components/home/CollectionRow'
import Reveal from '@/components/ui/Reveal'

const featured: { src: string; alt: string }[] = [
  { src: '/images/cards/laprassouthern.webp', alt: 'Lapras — Southern Islands' },
  { src: '/images/cards/Lugia.webp', alt: 'Lugia' },
  { src: '/images/cards/M_Metagross.webp', alt: 'Mega Metagross' },
  { src: '/images/cards/slowking.webp', alt: 'Slowking' },
]

// Show five cards, cycling the source images.
const cards = Array.from({ length: 5 }, (_, i) => featured[i % featured.length])

export default function FeaturedFinds() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="From the case"
            title="A peek at the collection."
            subtitle="Some of our favorites. Sign in to search the full inventory by set, condition, and price!"
          />
        </Reveal>
        <Reveal delay={80}>
          <CollectionRow cards={cards} />
        </Reveal>
        <Reveal delay={140} className="mt-[22px]">
          <Button href="/inventory">Explore the inventory →</Button>
        </Reveal>
      </Container>
    </section>
  )
}

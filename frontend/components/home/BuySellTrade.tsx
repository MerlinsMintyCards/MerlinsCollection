import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Badge from '@/components/ui/Badge'

const cards: { badge: string; title: string; body: string }[] = [
  {
    badge: 'Buy',
    title: 'Find your next card',
    body: 'Browse a curated, fairly-priced inventory — beginner singles to graded vintage.',
  },
  {
    badge: 'Sell',
    title: 'Cash in your collection',
    body: 'An honest valuation. No lowballs, no pressure — just a fair offer.',
  },
  {
    badge: 'Trade',
    title: 'Swap toward a grail',
    body: "Bring what you've got and trade up toward the card you actually want.",
  },
]

export default function BuySellTrade() {
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="What we do"
          title="Three ways to work with us."
          subtitle="Whether you're starting out, cashing in, or hunting a grail, there's a friendly way in."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div
              key={c.badge}
              className="bg-cream border border-line rounded-2xl p-[26px] transition-transform hover:-translate-y-0.5 hover:shadow-card"
            >
              <Badge>{c.badge}</Badge>
              <h3 className="font-serif font-semibold text-forest-deep text-[21px] mt-3.5 mb-2">
                {c.title}
              </h3>
              <p className="text-muted text-[15px]">{c.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

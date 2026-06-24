import Link from 'next/link'
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'

export default function LearnHub() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="New to collecting?"
          title="Let us help you"
          subtitle="We've written articles for you to learn from, based on information we have accumulated over the years. This is information we would have wanted when we first started collecting."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/articles"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card transition-transform hover:-translate-y-0.5"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Articles &amp; guides
            </h3>
            <p className="text-white/80 text-[15px]">
              Beginner-friendly guides on smart collecting, especially for parents with kids becoming interested in Pokemon Cards.
            </p>
          </Link>
          <Link
            href="/dictionary"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card transition-transform hover:-translate-y-0.5"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Collectors Dictionary
            </h3>
            <p className="text-white/80 text-[15px]">
              Commonly used vocabulary words at card shows.
            </p>
          </Link>
        </div>
      </Container>
    </section>
  )
}

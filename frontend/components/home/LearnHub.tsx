import Link from 'next/link'
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'

export default function LearnHub() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="New to collecting?"
            title="Let us help you"
            subtitle="We've written articles for you to learn from, based on information we have accumulated over the years. This is information we would have wanted when we first started collecting."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Reveal>
            <Link
              href="/articles"
              className="group h-full rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card hover-lift"
            >
              <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
                Articles &amp; guides
              </h3>
              <p className="text-white/80 text-[15px]">
                Beginner-friendly guides on smart collecting, especially for parents with kids becoming interested in Pokemon Cards.
              </p>
              <span
                aria-hidden
                className="mt-3 inline-flex items-center text-mint font-semibold text-[14px]"
              >
                <span className="transition-transform group-hover:translate-x-1">Explore →</span>
              </span>
            </Link>
          </Reveal>
          <Reveal delay={90}>
            <Link
              href="/dictionary"
              className="group h-full rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card hover-lift"
            >
              <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
                Collectors Dictionary
              </h3>
              <p className="text-white/80 text-[15px]">
                Commonly used vocabulary words at card shows.
              </p>
              <span
                aria-hidden
                className="mt-3 inline-flex items-center text-mint font-semibold text-[14px]"
              >
                <span className="transition-transform group-hover:translate-x-1">Explore →</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

import Link from 'next/link'
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'

export default function LearnHub() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="New to collecting?"
          title="Start with the basics."
          subtitle="No gatekeeping. Plain-English guides and a glossary to get you confident fast."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/articles"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end text-white shadow-card bg-gradient-to-br from-forest-mid to-forest-deep"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Articles &amp; guides
            </h3>
            <p className="text-[#dceede] text-[15px]">
              Beginner-friendly reads on grading, sets, and smart collecting.
            </p>
          </Link>
          <Link
            href="/dictionary"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end text-white shadow-card bg-gradient-to-br from-[#3a6b46] to-[#1c3a26]"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Collectors Dictionary
            </h3>
            <p className="text-[#dceede] text-[15px]">
              Every term — slab, PSA, holo, reverse — explained simply.
            </p>
          </Link>
        </div>
      </Container>
    </section>
  )
}

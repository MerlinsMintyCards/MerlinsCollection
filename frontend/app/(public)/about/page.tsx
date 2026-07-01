import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Badge from '@/components/ui/Badge'
import Reveal from '@/components/ui/Reveal'

export const metadata: Metadata = { title: 'About' }

const values: { badge: string; title: string; body: string }[] = [
  {
    badge: 'Honest',
    title: 'Fair, every time',
    body: 'We price to recent real sales and explain how we got there. No lowball offers, no mystery markups.',
  },
  {
    badge: 'Genuine',
    title: 'We collect too',
    body: 'This started as our hobby and it still is. We buy the cards we love, so we get why you do.',
  },
  {
    badge: 'Friendly',
    title: 'Beginners welcome',
    body: 'Bring your kids, bring your shoebox of cards. There are no dumb questions at our table.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-[clamp(48px,8vw,84px)]">
        <Container>
          <div className="grid items-center gap-10 wide:grid-cols-[1.05fr_0.95fr]">
            <Reveal>
              <Eyebrow>Our story</Eyebrow>
              <h1 className="mt-3 font-serif text-[clamp(34px,6.4vw,52px)] font-semibold leading-[1.05] tracking-[-0.01em] text-forest-deep">
                About us
              </h1>
              <p className="mt-4 max-w-[48ch] text-[clamp(16px,2.4vw,19px)] text-[#4a4339]">
                We&apos;re a few college friends who rediscovered Pokémon together and never really
                put the cards down. What started as late-night pack openings turned into a table at
                card shows all over the region.
              </p>
              <p className="mt-3 max-w-[48ch] text-[#4a4339]">
                And then there&apos;s Merlin — our cat, our mascot, and the self-appointed manager
                who supervises every sort, every grade, and every nap break.
              </p>
            </Reveal>

            <Reveal delay={90}>
              <Image
                src="/images/about-us/childhood-card-collection.webp"
                alt="A well-loved childhood Pokémon card collection"
                width={720}
                height={540}
                className="h-auto w-full rounded-[18px] object-cover shadow-card"
              />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Story */}
      <section className="bg-paper py-[clamp(44px,7vw,74px)]">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-[68ch]">
              <h2 className="font-serif text-[clamp(26px,4.4vw,34px)] font-semibold leading-[1.1] text-forest-deep">
                Three friends, a lot of cards, and a cat.
              </h2>
              <p className="mt-4 text-[#4a4339]">
                None of us set out to start a business. We just kept finding cards we couldn&apos;t
                pass up, and pretty soon the collection outgrew the apartment. Selling at shows let us
                keep doing what we love and meet other collectors along the way.
              </p>
              <p className="mt-3 text-[#4a4339]">
                These days you&apos;ll find us behind a table most weekends — raw singles, graded
                slabs, sealed product, and a binder of personal grails we&apos;ll probably never sell.
                Merlin stays home, but he&apos;s on the logo, so he&apos;s technically always working.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Values */}
      <section className="py-[clamp(44px,7vw,74px)]">
        <Container>
          <Reveal>
            <Eyebrow>What we stand for</Eyebrow>
            <h2 className="mb-6 mt-2.5 font-serif text-[clamp(26px,4.4vw,34px)] font-semibold leading-[1.1] text-forest-deep">
              How we do business.
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-line bg-cream p-[26px] hover-lift hover:border-mint hover:shadow-card-lg">
                  <Badge>{v.badge}</Badge>
                  <h3 className="mt-3.5 font-serif text-[21px] font-semibold text-forest-deep">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-[#4a4339]">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-24 bg-forest-deep text-white">
        <Container className="py-[clamp(44px,7vw,76px)]">
          <Reveal className="mx-auto max-w-[60ch] text-center">
            <span className="font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-mint">
              Say hello
            </span>
            <h2 className="mt-2 font-serif text-[clamp(26px,4.4vw,36px)] font-semibold text-white">
              Get in touch
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[#eaf6ec]">
              Buying, selling, trading, or just want to talk cards? Email us or catch us at the next
              show.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="mailto:merlinsmintycardsllc@gmail.com"
                className="rounded-full bg-white px-6 py-3 font-semibold text-forest transition-transform hover:-translate-y-0.5"
              >
                merlinsmintycardsllc@gmail.com
              </Link>
              <a
                href="https://instagram.com/merlinsmintycards"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-[1.5px] border-mint/60 px-6 py-3 font-semibold text-mint transition-colors hover:bg-white/10"
              >
                @merlinsmintycards
              </a>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}

import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Button from '@/components/ui/Button'

export default function FinalCTA() {
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <div className="bg-mint-soft rounded-3xl p-[clamp(34px,5vw,54px)] text-center">
          <Eyebrow>Looking for something?</Eyebrow>
          <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-2.5">
            Let&apos;s find your card.
          </h2>
          <p className="text-[#3f5a45] max-w-[50ch] mx-auto mb-[22px]">
            Tell us what you&apos;re chasing, or come say hi at the next show. We&apos;re always happy
            to talk Pokémon.
          </p>
          <Button href="/about#contact">Get in touch</Button>
        </div>
      </Container>
    </section>
  )
}

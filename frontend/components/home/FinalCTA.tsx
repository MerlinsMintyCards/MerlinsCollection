import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Button from '@/components/ui/Button'

export default function FinalCTA() {
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <div className="bg-cream rounded-3xl p-[clamp(34px,5vw,54px)] text-center">
          <Eyebrow>Have a question?</Eyebrow>
          <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-2.5">
            We have an answer!
          </h2>
          <p className="text-[#3f5a45] max-w-[50ch] mx-auto mb-[22px]">
            Message us, or catch us at the next show, we&apos;re always down to talk Pokémon.
          </p>
          <Button href="/about#contact">Get in touch</Button>
        </div>
      </Container>
    </section>
  )
}

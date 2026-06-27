import type { Metadata } from 'next'
import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Reveal from '@/components/ui/Reveal'
import DictionaryExplorer from '@/components/dictionary/DictionaryExplorer'

export const metadata: Metadata = { title: 'Collectors Dictionary' }

export default function DictionaryPage() {
  return (
    <section className="py-[clamp(48px,8vw,84px)]">
      <Container>
        <Reveal>
          <Eyebrow>New to collecting?</Eyebrow>
          <h1 className="mt-3 max-w-[18ch] font-serif text-[clamp(34px,6.4vw,52px)] font-semibold leading-[1.05] tracking-[-0.01em] text-forest-deep">
            Collectors dictionary
          </h1>
          <p className="mt-4 max-w-[54ch] text-[clamp(16px,2.4vw,19px)] text-[#4a4339]">
            The words you&apos;ll hear thrown around at card shows, explained in plain English.
            Search for a term or just browse.
          </p>
        </Reveal>
        <div className="mt-8">
          <Reveal delay={90}>
            <DictionaryExplorer />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

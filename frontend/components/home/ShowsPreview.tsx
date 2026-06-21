import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Button from '@/components/ui/Button'

export default function ShowsPreview() {
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="In person"
          title="Catch us at a card show."
          subtitle="Card shows are our whole thing — it's where you'll actually meet us. Here's where we're headed next."
        />
        <div className="flex flex-wrap gap-5 items-center bg-cream border border-line rounded-2xl px-6 py-5">
          <div className="flex flex-col items-center justify-center w-[74px] h-[74px] rounded-[14px] bg-forest text-white shrink-0">
            <b className="font-serif text-[23px] leading-none">JUL</b>
            <span className="text-[12px] uppercase tracking-[0.08em]">12</span>
          </div>
          <div className="flex-1 min-w-[160px]">
            <h3 className="font-serif font-semibold text-forest-deep text-[20px] mb-1">
              Regional Collectors Expo
            </h3>
            <div className="text-muted text-[15px]">Community Center · 9am–4pm · Table 14</div>
          </div>
          <Button href="/shows" variant="ghost">
            All shows
          </Button>
        </div>
        <p className="text-[11px] text-[#9a8f7d] italic mt-3.5">
          Sample listing for now — we keep real dates on the Shows page.
        </p>
      </Container>
    </section>
  )
}

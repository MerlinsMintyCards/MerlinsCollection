import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Button from '@/components/ui/Button'
import ImagePlaceholder from '@/components/ui/ImagePlaceholder'

export default function FeaturedFinds() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="From the case"
          title="A peek at the collection."
          subtitle="A few recent finds. Sign in to search the full inventory by set, condition, and price — or just ask in plain English."
        />
        <div className="flex sm:grid sm:grid-cols-5 gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <ImagePlaceholder
              key={i}
              label="Card"
              className="shrink-0 basis-[44%] sm:basis-auto aspect-[5/7] rounded-xl"
            />
          ))}
        </div>
        <p className="text-[11px] text-[#9a8f7d] italic mt-3.5">
          Placeholders for featured inventory images (served via CloudFront). Inventory search is
          login-gated.
        </p>
        <div className="mt-[22px]">
          <Button href="/inventory">Explore the inventory →</Button>
        </div>
      </Container>
    </section>
  )
}

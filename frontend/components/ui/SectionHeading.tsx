import Eyebrow from './Eyebrow'

/** Standard section header: an {@link Eyebrow} kicker, an `h2` title, and an optional subtitle. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="max-w-[60ch] mb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-serif font-semibold text-forest-deep leading-[1.1] text-[clamp(26px,4.6vw,36px)] mt-2.5 mb-2.5">
        {title}
      </h2>
      {subtitle && <p className="text-muted text-[clamp(15px,2.2vw,17px)] m-0">{subtitle}</p>}
    </div>
  )
}

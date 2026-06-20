import Container from '@/components/ui/Container'
import { Search, Tag, User, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const items: { Icon: LucideIcon; title: string; sub: string }[] = [
  { Icon: Search, title: 'Honest grading', sub: 'Accurate, no surprises — PSA-referenced.' },
  { Icon: Tag, title: 'Fair pricing', sub: 'Priced to the real market.' },
  { Icon: User, title: 'Collector-run', sub: 'A real person who loves the hobby.' },
  { Icon: MapPin, title: 'At the shows', sub: 'Meet us in person.' },
]

export default function TrustStrip() {
  return (
    <div className="bg-forest-deep text-[#eaf6ec]">
      <Container>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-[18px] sm:gap-[22px] px-4 py-[26px]">
          {items.map(({ Icon, title, sub }) => (
            <div key={title} className="flex gap-3 items-start justify-center">
              <span className="shrink-0 flex items-center justify-center">
                <Icon className="w-6 h-6 text-mint" strokeWidth={1.8} />
              </span>
              <div className="grow-0 shrink basis-[170px]">
                <h4 className="font-sans font-bold text-[15px] text-white">{title}</h4>
                <p className="text-[13px] text-[#aecbb4]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

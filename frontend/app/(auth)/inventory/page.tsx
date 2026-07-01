import type { Metadata } from 'next'
import Container from '@/components/ui/Container'
import InventoryWorkspace from '@/components/inventory/InventoryWorkspace'

export const metadata: Metadata = { title: 'Inventory Search' }

// Sample summary — wired to get_inventory_summary on the backend later.
const stats = [
  { label: 'Cards in vault', value: '4,820' },
  { label: 'Est. value', value: '$612k' },
  { label: 'Sets tracked', value: '148' },
]

export default function InventoryPage() {
  return (
    <div className="vault-scope min-h-screen font-sans text-pine-200">
      <Container className="py-[clamp(36px,6vw,64px)]">
        <header className="relative overflow-hidden rounded-3xl vault-panel px-6 py-8 sm:px-9 sm:py-10">
          <div className="relative">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mint">
              Inventory · The vault
            </span>
            <h1 className="mt-3 max-w-[18ch] font-serif text-[clamp(30px,5vw,46px)] font-semibold leading-[1.05] tracking-[-0.01em] text-pine-100">
              Search the inventory
            </h1>
            <p className="mt-3 max-w-[52ch] text-pine-300">
              Query Merlin&apos;s full collection by set, rarity, type, and price — or just ask in
              plain English. Live pricing from the market.
            </p>

            <dl className="mt-7 grid max-w-md grid-cols-3 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-pine-700 bg-pine-950/60 px-3 py-3"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-pine-300">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-pine-100">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <div className="mt-8">
          <InventoryWorkspace />
        </div>
      </Container>
    </div>
  )
}

# Home Page Motion & Interactivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home page below the hero feel alive — gentle scroll-reveal entrances and tasteful hover states — reusing the existing card-interaction language, without redesigning anything.

**Architecture:** Add one reusable client component, `<Reveal>`, that fades + rises its children into view via `IntersectionObserver` (the same approach `FlipCard` already uses), backed by a few CSS classes in `globals.css`. Wrap the static home sections in `<Reveal>` and upgrade a handful of hover states to a shared `.hover-lift` treatment. No new dependencies.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS 3, Vitest + Testing Library (jsdom).

## Global Constraints

- **No new dependencies.** Animations stay hand-rolled (CSS + small hooks/components). No Framer Motion.
- **No layout, copy, or color changes.** Only additive wrappers and hover classes.
- **Every effect gated behind `prefers-reduced-motion: reduce`** — reveals show instantly, hover transforms disabled. Enforced in `globals.css`.
- **Degrade safely with no `IntersectionObserver`** (SSR / jsdom): content renders fully visible, never stuck hidden.
- **Existing tests stay green:** `frontend/components/home/__tests__/Hero.test.tsx`, `sections-mid.test.tsx`, `sections-bottom.test.tsx`, `frontend/app/(public)/__tests__/page.test.tsx`.
- **Outside-in TDD** per `CLAUDE.md`: RED (write failing test, confirm it fails) → GREEN (minimal code) → REFACTOR. Never combine phases.
- **Test env facts** (from `frontend/vitest.setup.ts`): `IntersectionObserver` is stubbed as a no-op that **never fires**; `window.matchMedia` returns `{ matches: false }` by default. So in tests a `<Reveal>` stays in its hidden (`reveal`, not `reveal-in`) state unless a test deletes the IO stub or forces reduced motion — but Testing Library presence queries (`getByText`, `getByRole`, `toBeInTheDocument`) don't care about CSS visibility, so existing assertions keep passing.
- **Commands** run from `frontend/`: tests `npm test`, single file `npx vitest run <path>`, lint `npm run lint`.
- **Commit message trailer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `frontend/components/ui/Reveal.tsx` | **New.** Client scroll-reveal wrapper. | 1 |
| `frontend/components/ui/__tests__/Reveal.test.tsx` | **New.** Reveal unit tests. | 1 |
| `frontend/app/globals.css` | Add `.reveal`/`.reveal-in`, `.hover-lift`, reduced-motion guards. | 1 |
| `frontend/components/ui/Button.tsx` | Add hover lift (primary) / fill (ghost). | 2 |
| `frontend/components/ui/__tests__/Button.test.tsx` | **New.** Button hover tests. | 2 |
| `frontend/components/home/Hero.tsx` | Reveal-wrap the intro copy column. | 3 |
| `frontend/components/home/StoryTeaser.tsx` | Reveal-wrap image + text (stagger). | 3 |
| `frontend/components/home/FinalCTA.tsx` | Reveal-wrap the panel. | 3 |
| `frontend/components/home/__tests__/Hero.test.tsx` | Add reveal-wrapper assertion. | 3 |
| `frontend/components/home/FeaturedFinds.tsx` | Reveal-wrap heading / row / button. | 4 |
| `frontend/components/home/ShowsPreview.tsx` | Reveal-wrap heading + listing; `.hover-lift` row. | 4 |
| `frontend/components/home/TrustStrip.tsx` | Stagger-reveal the 4 items; icon hover scale. | 5 |
| `frontend/components/home/BuySellTrade.tsx` | Stagger-reveal cards; `.hover-lift` cards. | 6 |
| `frontend/components/home/LearnHub.tsx` | Stagger-reveal panels; `.hover-lift` + arrow. | 7 |
| `frontend/components/home/__tests__/sections-mid.test.tsx` | Add reveal assertions (TrustStrip/BuySellTrade). | 5, 6 |
| `frontend/components/home/__tests__/sections-bottom.test.tsx` | Add reveal assertions (FeaturedFinds/Shows/LearnHub). | 4, 7 |

---

## Task 1: Motion foundation — `<Reveal>` + CSS

**Files:**
- Create: `frontend/components/ui/Reveal.tsx`
- Create: `frontend/components/ui/__tests__/Reveal.test.tsx`
- Modify: `frontend/app/globals.css` (append new rules)

**Interfaces:**
- Produces: `export default function Reveal(props: { children: ReactNode; delay?: number; as?: ElementType; className?: string }): JSX.Element`. Renders an element (tag = `as`, default `'div'`) carrying class `reveal` plus `reveal-in` once visible; `delay` becomes inline `transition-delay`; `className` is appended. Used by Tasks 3–7.
- Produces (CSS): classes `.reveal`, `.reveal-in`, `.hover-lift`.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/ui/__tests__/Reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Reveal from '@/components/ui/Reveal'

describe('Reveal', () => {
  it('renders its children', () => {
    render(<Reveal>hello world</Reveal>)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('renders the tag from the `as` prop and merges className', () => {
    const { container } = render(
      <Reveal as="section" className="custom">
        child
      </Reveal>,
    )
    const el = container.querySelector('section')
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass('reveal', 'custom')
  })

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    const saved = (globalThis as Record<string, unknown>).IntersectionObserver
    delete (globalThis as Record<string, unknown>).IntersectionObserver
    delete (window as unknown as Record<string, unknown>).IntersectionObserver
    try {
      const { container } = render(<Reveal>x</Reveal>)
      expect(container.firstElementChild).toHaveClass('reveal-in')
    } finally {
      ;(globalThis as Record<string, unknown>).IntersectionObserver = saved
      ;(window as unknown as Record<string, unknown>).IntersectionObserver = saved
    }
  })

  it('reveals immediately under prefers-reduced-motion', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    try {
      const { container } = render(<Reveal>x</Reveal>)
      expect(container.firstElementChild).toHaveClass('reveal-in')
    } finally {
      window.matchMedia = original
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/ui/__tests__/Reveal.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ui/Reveal'`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/components/ui/Reveal.tsx`:

```tsx
'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'

/**
 * Fades + rises its children into view as they enter the viewport, using
 * IntersectionObserver (the same approach as FlipCard's peek). Falls back to
 * fully visible when reduced motion is requested or IntersectionObserver is
 * unavailable (SSR / jsdom), so content is never stuck hidden.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  /** ms of stagger delay before the reveal transition starts */
  delay?: number
  /** element tag to render (default 'div') */
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const classes = `reveal${shown ? ' reveal-in' : ''}${className ? ' ' + className : ''}`
  return createElement(
    Tag,
    {
      ref,
      className: classes,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  )
}
```

Append to `frontend/app/globals.css`:

```css
/* ---- Scroll reveal: fade + rise as content enters view ---- */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.6s ease,
    transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.reveal-in {
  opacity: 1;
  transform: none;
}

/* ---- Hover lift: gentle rise for cards/panels, matching the card language ---- */
@media (hover: hover) and (pointer: fine) {
  .hover-lift {
    transition:
      transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      border-color 0.3s ease;
  }
  .hover-lift:hover {
    transform: translateY(-4px);
  }
}

/* ---- Reduced motion: neutralize the new motion + any utility transitions ---- */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .hover-lift,
  .hover-lift:hover {
    transform: none;
    transition: none;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/ui/__tests__/Reveal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ui/Reveal.tsx frontend/components/ui/__tests__/Reveal.test.tsx frontend/app/globals.css
git commit -m "feat: add Reveal scroll-in primitive and motion styles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Button hover polish

**Files:**
- Modify: `frontend/components/ui/Button.tsx`
- Create: `frontend/components/ui/__tests__/Button.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Button` unchanged in API; primary variant className now matches `/hover:-translate-y/`, ghost matches `/hover:bg-forest/`.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/ui/__tests__/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('still renders a primary link with its href, label, and variant', () => {
    render(<Button href="/about">Read our story</Button>)
    const link = screen.getByRole('link', { name: 'Read our story' })
    expect(link).toHaveAttribute('href', '/about')
    expect(link).toHaveAttribute('data-variant', 'primary')
  })

  it('gives the primary variant a hover lift', () => {
    render(<Button href="/x">Go</Button>)
    expect(screen.getByRole('link', { name: 'Go' }).className).toMatch(/hover:-translate-y/)
  })

  it('gives the ghost variant a hover fill', () => {
    render(
      <Button href="/x" variant="ghost">
        Go
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Go' }).className).toMatch(/hover:bg-forest/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/ui/__tests__/Button.test.tsx`
Expected: FAIL — the two hover assertions fail (no hover classes yet).

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/ui/Button.tsx`, replace the `base` and `variantClasses` declarations (lines 6–12) with:

```tsx
const base =
  'inline-block rounded-full text-center font-semibold text-[15px] px-6 py-3 transition-all duration-200 active:translate-y-px'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-forest text-white shadow-[0_8px_20px_rgba(31,110,50,0.25)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,110,50,0.35)]',
  ghost: 'border-[1.5px] border-forest text-forest hover:bg-forest/[0.06]',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/ui/__tests__/Button.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ui/Button.tsx frontend/components/ui/__tests__/Button.test.tsx
git commit -m "feat: add hover lift and fill to buttons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Reveal-wrap the simple fade-up sections (Hero, StoryTeaser, FinalCTA)

These three only need a fade-up wrapper (no per-child stagger, no hover transform), so `<Reveal>` is the element itself or a thin wrapper.

**Files:**
- Modify: `frontend/components/home/Hero.tsx`
- Modify: `frontend/components/home/StoryTeaser.tsx`
- Modify: `frontend/components/home/FinalCTA.tsx`
- Modify: `frontend/components/home/__tests__/Hero.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1.

- [ ] **Step 1: Write the failing test**

Append to `frontend/components/home/__tests__/Hero.test.tsx` (inside the existing `describe('Hero', ...)` block):

```tsx
  it('wraps the intro copy in a reveal wrapper', () => {
    const { container } = render(<Hero />)
    expect(container.querySelector('.reveal')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/__tests__/Hero.test.tsx`
Expected: FAIL — new test: no `.reveal` element found.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/home/Hero.tsx`, add the import and wrap the left copy column. Add after the existing imports:

```tsx
import Reveal from '@/components/ui/Reveal'
```

Replace the opening/closing of the left column `<div>` (the one starting at line 12 containing `<Eyebrow>…</Button>`) so it reads:

```tsx
          <Reveal>
            <Eyebrow>Buy · Sell · Trade</Eyebrow>
            <h1 className="font-serif font-semibold text-forest-deep leading-[1.1] tracking-[-0.01em] text-[clamp(34px,6.4vw,46px)] my-4">
              Pokémon cards,
              <br />
              and a cat named Merlin.
            </h1>
            <p className="text-muted text-[clamp(16px,2.4vw,19px)] max-w-[42ch] mb-7">
              We&apos;re a few college friends who rediscovered our love of Pokémon. You&apos;ll
              often find us set up at card shows around the area, buying, selling, and trading cards.
              Merlin is our cat. He thinks he&apos;s in charge, but doesn&apos;t really do much.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5">
              <Button href="/about">Read our story</Button>
              <Button href="/shows" variant="ghost">
                See upcoming shows
              </Button>
            </div>
          </Reveal>
```

In `frontend/components/home/StoryTeaser.tsx`, add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then wrap the two grid children. Replace the `<Image … />` element with:

```tsx
          <Reveal>
            <Image
              src="/images/about-us/childhood-card-collection.webp"
              alt="A childhood Pokémon card collection spread out on the floor"
              width={560}
              height={360}
              className="w-full h-auto rounded-[18px] shadow-card object-cover"
            />
          </Reveal>
```

and wrap the text `<div>` (the sibling containing `<Eyebrow>…</Button>`) in `<Reveal delay={90}>…</Reveal>`:

```tsx
          <Reveal delay={90}>
            <div>
              <Eyebrow>Our story</Eyebrow>
              <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-3.5">
                Three friends, a lot of cards, and a cat.
              </h2>
              <p className="text-[#4a4339] mb-3.5">
                We&apos;re a group of college friends who grew up ripping packs and never quit. Now we
                set up at card shows to buy, sell, and trade with people who love this stuff as much as
                we do.
              </p>
              <p className="text-[#4a4339] mb-3.5">
                Our name comes from one of our cats. He&apos;s never sorted a single card in his life.
                He&apos;s a great mascot but an awful CEO, and we still aren&apos;t sure how he got the job&hellip;
              </p>
              <Button href="/about" variant="ghost">
                Find out more about Merlin
              </Button>
            </div>
          </Reveal>
```

In `frontend/components/home/FinalCTA.tsx`, add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then turn the inner panel `<div className="bg-cream rounded-3xl …">` into a `<Reveal as="div" className="…">` carrying the same classes:

```tsx
        <Reveal className="bg-cream rounded-3xl p-[clamp(34px,5vw,54px)] text-center">
          <Eyebrow>Have a question?</Eyebrow>
          <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-2.5">
            We have an answer!
          </h2>
          <p className="text-[#3f5a45] max-w-[50ch] mx-auto mb-[22px]">
            Message us, or catch us at the next show, we&apos;re always down to talk Pokémon.
          </p>
          <Button href="/about#contact">Get in touch</Button>
        </Reveal>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/home/__tests__/Hero.test.tsx components/home/__tests__/sections-mid.test.tsx components/home/__tests__/sections-bottom.test.tsx`
Expected: PASS — new Hero reveal test passes; StoryTeaser and FinalCTA existing assertions unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/Hero.tsx frontend/components/home/StoryTeaser.tsx frontend/components/home/FinalCTA.tsx frontend/components/home/__tests__/Hero.test.tsx
git commit -m "feat: fade-up reveal for hero, story, and final CTA

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: FeaturedFinds + ShowsPreview reveals (+ Shows hover-lift)

**Files:**
- Modify: `frontend/components/home/FeaturedFinds.tsx`
- Modify: `frontend/components/home/ShowsPreview.tsx`
- Modify: `frontend/components/home/__tests__/sections-bottom.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1; `.hover-lift` CSS from Task 1.
- Note: `FeaturedFinds` must keep `<CollectionRow>` intact so the existing `.collection-row` / 5×`.collection-card` assertions still pass — only wrap *around* it.

- [ ] **Step 1: Write the failing test**

Append to `frontend/components/home/__tests__/sections-bottom.test.tsx` a new describe block:

```tsx
describe('bottom sections reveal on scroll', () => {
  it('FeaturedFinds wraps content in reveal wrappers and keeps the collection row', () => {
    const { container } = render(<FeaturedFinds />)
    expect(container.querySelector('.reveal')).toBeInTheDocument()
    expect(container.querySelector('.collection-row')).toBeInTheDocument()
    expect(container.querySelectorAll('.collection-card')).toHaveLength(5)
  })

  it('ShowsPreview wraps its listing in a reveal wrapper with a hover lift', () => {
    const { container } = render(<ShowsPreview />)
    expect(container.querySelector('.reveal')).toBeInTheDocument()
    expect(container.querySelector('.hover-lift')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-bottom.test.tsx`
Expected: FAIL — `.reveal` / `.hover-lift` not found.

- [ ] **Step 3: Write minimal implementation**

Replace `frontend/components/home/FeaturedFinds.tsx` body (the `return (...)`) — add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then:

```tsx
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="From the case"
            title="A peek at the collection."
            subtitle="Some of our favorites. Sign in to search the full inventory by set, condition, and price!"
          />
        </Reveal>
        <Reveal delay={80}>
          <CollectionRow cards={cards} />
        </Reveal>
        <Reveal delay={140} className="mt-[22px]">
          <Button href="/inventory">Explore the inventory →</Button>
        </Reveal>
      </Container>
    </section>
  )
```

Replace `frontend/components/home/ShowsPreview.tsx` body — add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then:

```tsx
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="In person"
            title="Catch us at a card show."
            subtitle="Come find us in person at a show. Here is where we are headed to next:"
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="flex flex-wrap gap-5 items-center bg-cream border border-line rounded-2xl px-6 py-5 hover-lift">
            <div className="flex flex-col items-center justify-center w-[74px] h-[74px] rounded-[14px] bg-forest text-white shrink-0">
              <b className="font-serif text-[23px] leading-none">JUN</b>
              <span className="text-[12px] uppercase tracking-[0.08em]">27</span>
            </div>
            <div className="flex-1 min-w-[160px]">
              <h3 className="font-serif font-semibold text-forest-deep text-[20px] mb-1">
                Twin Oaks Portland
              </h3>
              <div className="text-muted text-[15px]">Lloyd Center · 10am–4pm · Address here</div>
            </div>
            <Button href="/shows" variant="ghost">
              All shows
            </Button>
          </div>
        </Reveal>
        <Reveal delay={140}>
          <p className="text-[11px] text-[#9a8f7d] italic mt-3.5">
            Sample listing for now — we keep real dates on the Shows page.
          </p>
        </Reveal>
      </Container>
    </section>
  )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-bottom.test.tsx`
Expected: PASS — new reveal block passes; existing FeaturedFinds/ShowsPreview/LearnHub/FinalCTA assertions unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/FeaturedFinds.tsx frontend/components/home/ShowsPreview.tsx frontend/components/home/__tests__/sections-bottom.test.tsx
git commit -m "feat: reveal featured finds and shows preview, lift the show listing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: TrustStrip staggered reveal + icon hover scale

**Files:**
- Modify: `frontend/components/home/TrustStrip.tsx`
- Modify: `frontend/components/home/__tests__/sections-mid.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1.

- [ ] **Step 1: Write the failing test**

Append to `frontend/components/home/__tests__/sections-mid.test.tsx` (inside `describe('mid Home sections', ...)`):

```tsx
  it('TrustStrip staggers its four items into view', () => {
    const { container } = render(<TrustStrip />)
    expect(container.querySelectorAll('.reveal').length).toBeGreaterThanOrEqual(4)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-mid.test.tsx`
Expected: FAIL — fewer than 4 `.reveal` elements.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/home/TrustStrip.tsx`, add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then replace the `.map(...)` so each item is a staggered `<Reveal>` with `group`, and the icon scales on hover:

```tsx
          {items.map(({ Icon, title, sub }, i) => (
            <Reveal
              key={title}
              delay={i * 70}
              className="flex gap-3 items-start justify-center group"
            >
              <span className="shrink-0 flex items-center justify-center">
                <Icon
                  className="w-6 h-6 text-mint transition-transform group-hover:scale-110"
                  strokeWidth={1.8}
                />
              </span>
              <div className="grow-0 shrink basis-[170px]">
                <h4 className="font-sans font-bold text-[15px] text-white">{title}</h4>
                <p className="text-[13px] text-[#aecbb4]">{sub}</p>
              </div>
            </Reveal>
          ))}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-mid.test.tsx`
Expected: PASS — new stagger test passes; existing TrustStrip title assertions unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/TrustStrip.tsx frontend/components/home/__tests__/sections-mid.test.tsx
git commit -m "feat: stagger trust strip items in, scale icons on hover

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: BuySellTrade staggered cards + hover-lift

**Files:**
- Modify: `frontend/components/home/BuySellTrade.tsx`
- Modify: `frontend/components/home/__tests__/sections-mid.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1; `.hover-lift` CSS. The reveal goes on the wrapper, the hover-lift on the inner card, so the two transforms never share an element.

- [ ] **Step 1: Write the failing test**

Append to `frontend/components/home/__tests__/sections-mid.test.tsx` (inside `describe('mid Home sections', ...)`):

```tsx
  it('BuySellTrade staggers the three cards and gives each a hover lift', () => {
    const { container } = render(<BuySellTrade />)
    expect(container.querySelectorAll('.reveal').length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.hover-lift').length).toBeGreaterThanOrEqual(3)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-mid.test.tsx`
Expected: FAIL — `.reveal` / `.hover-lift` counts below 3.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/home/BuySellTrade.tsx`, add `import Reveal from '@/components/ui/Reveal'` after the existing imports, then replace the cards grid `.map(...)`:

```tsx
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <Reveal key={c.badge} delay={i * 80}>
              <div className="h-full bg-cream border border-line rounded-2xl p-[26px] hover-lift hover:border-mint hover:shadow-card-lg">
                <Badge>{c.badge}</Badge>
                <h3 className="font-serif font-semibold text-forest-deep text-[21px] mt-3.5 mb-2">
                  {c.title}
                </h3>
                <p className="text-muted text-[15px]">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-mid.test.tsx`
Expected: PASS — new test passes; existing BuySellTrade card-title assertions unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/BuySellTrade.tsx frontend/components/home/__tests__/sections-mid.test.tsx
git commit -m "feat: stagger buy/sell/trade cards in with a hover lift

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: LearnHub staggered panels + hover-lift + sliding arrow

**Files:**
- Modify: `frontend/components/home/LearnHub.tsx`
- Modify: `frontend/components/home/__tests__/sections-bottom.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1; `.hover-lift` CSS. The arrow is `aria-hidden`, so the existing `getByRole('link', { name: /…/ })` assertions are unaffected.

- [ ] **Step 1: Write the failing test**

Append to `frontend/components/home/__tests__/sections-bottom.test.tsx`'s `describe('bottom sections reveal on scroll', ...)` block (created in Task 4):

```tsx
  it('LearnHub staggers its two panels and lifts them on hover', () => {
    const { container } = render(<LearnHub />)
    expect(container.querySelectorAll('.reveal').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('.hover-lift').length).toBeGreaterThanOrEqual(2)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-bottom.test.tsx`
Expected: FAIL — `.reveal` / `.hover-lift` counts below 2.

- [ ] **Step 3: Write minimal implementation**

Replace `frontend/components/home/LearnHub.tsx` entirely:

```tsx
import Link from 'next/link'
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'

export default function LearnHub() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="New to collecting?"
            title="Let us help you"
            subtitle="We've written articles for you to learn from, based on information we have accumulated over the years. This is information we would have wanted when we first started collecting."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Reveal>
            <Link
              href="/articles"
              className="group h-full rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card hover-lift"
            >
              <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
                Articles &amp; guides
              </h3>
              <p className="text-white/80 text-[15px]">
                Beginner-friendly guides on smart collecting, especially for parents with kids becoming interested in Pokemon Cards.
              </p>
              <span
                aria-hidden
                className="mt-3 inline-flex items-center text-mint font-semibold text-[14px]"
              >
                <span className="transition-transform group-hover:translate-x-1">Explore →</span>
              </span>
            </Link>
          </Reveal>
          <Reveal delay={90}>
            <Link
              href="/dictionary"
              className="group h-full rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end bg-forest text-white shadow-card hover-lift"
            >
              <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
                Collectors Dictionary
              </h3>
              <p className="text-white/80 text-[15px]">
                Commonly used vocabulary words at card shows.
              </p>
              <span
                aria-hidden
                className="mt-3 inline-flex items-center text-mint font-semibold text-[14px]"
              >
                <span className="transition-transform group-hover:translate-x-1">Explore →</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/home/__tests__/sections-bottom.test.tsx`
Expected: PASS — new LearnHub test passes; existing LearnHub link assertions (`/articles`, `/dictionary`) unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/LearnHub.tsx frontend/components/home/__tests__/sections-bottom.test.tsx
git commit -m "feat: stagger learn hub panels with hover lift and sliding arrow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: PASS — all suites green, including the four pre-existing home/page tests and the new Reveal/Button tests.

- [ ] **Step 2: Lint**

Run: `cd frontend && npm run lint`
Expected: no errors. (If lint flags an unused import or the `createElement` usage, fix and re-run.)

- [ ] **Step 3: Manual visual check (dev server)**

Run: `cd frontend && npm run dev`, open `http://localhost:3000/`. Confirm:
- Sections fade + rise as you scroll down; nothing stays invisible.
- Buy/Sell/Trade cards, the show listing, and Learn Hub panels lift on hover; Learn Hub arrows slide.
- Buttons lift slightly on hover.
- In OS "reduce motion" mode, everything appears immediately with no transitions and hover lifts are flat.

- [ ] **Step 4: Commit (only if Step 2 required a fix)**

```bash
git add -A
git commit -m "chore: lint fixes for home page motion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Reveal primitive + CSS + reduced-motion + no-IO fallback → Task 1. ✓
- Scroll-reveal on all seven static sections → Hero/StoryTeaser/FinalCTA (T3), FeaturedFinds/ShowsPreview (T4), TrustStrip (T5), BuySellTrade (T6), LearnHub (T7). ✓
- Hover upgrades: BuySellTrade cards (T6), LearnHub panels + arrow (T7), ShowsPreview row (T4), TrustStrip icons (T5), Button (T2). ✓
- Hero FlipCard untouched; FeaturedFinds card tilt untouched (wrapped only) → T3/T4. ✓
- Constraints (no deps, no copy/layout change, reduced-motion gating, existing tests green) → Global Constraints + Task 8. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `Reveal` props `{ children, delay?, as?, className? }` are used consistently across T3–T7 (`delay` numbers, `as`/`className` only where needed). `.reveal` / `.reveal-in` / `.hover-lift` class names match between Task 1 CSS and all consumers. ✓

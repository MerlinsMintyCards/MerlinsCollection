# Frontend Design Foundation & Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable design foundation (tokens, fonts, UI primitives), the shared Navbar + Footer, and the brand-story Home page for Merlin's Minty Cards, all test-first.

**Architecture:** Next.js 15 App Router (no `src/`). Tailwind tokens + `next/font` provide the design system. Small single-responsibility React components compose into Home sections, then into the Home page. The `(public)` layout supplies Navbar/Footer. One signature client component — `FlipCard` — owns the hover/tap flip interaction; everything else is a server component except `Navbar` (mobile menu state).

**Tech Stack:** Next.js 15.3, React 18, TypeScript (strict), Tailwind CSS 3.4, `next/font/google` (Fraunces + Inter), `lucide-react` icons, Vitest + jsdom + Testing Library.

## Global Constraints

- **Framework versions (do not change):** Next.js `^15.3.0`, React `^18.3.0`, Tailwind `^3.4.0`. New deps only: `lucide-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- **Design direction:** "Editorial Warmth" — cream canvas, Fraunces serif headings, Inter body. Not flashy.
- **Color tokens (semantic, exact hex):** `forest #1f6e32`, `forest-deep #103b1c`, `forest-mid #2d8f44`, `mint #a9e0b3`, `mint-soft #d4f0d9`, `cream #f5f0e8`, `paper #fffdf8`, `ink #241f1b`, `muted #6f6457`, `line #e6ddcc`. Built on the existing `spriggatito` scale.
- **Type:** headings (`h1`–`h3`) use `font-serif` (Fraunces). Body, UI, and eyebrows use `font-sans` (Inter).
- **Custom breakpoints (Tailwind screens):** `xs 380px`, `sm 640px` (default), `wide 900px`, `nav 860px`. Behavior: nav→hamburger below `nav`; hero/story stack below `wide`; single-column + full-width CTAs below `sm`; trust strip → 1 col below `xs`.
- **No emoji in UI** — except the single intentional `👆` in the mobile "Tap to flip" hint.
- **Accessibility:** maintain WCAG AA contrast; all non-essential motion is disabled under `prefers-reduced-motion: reduce`; interactive elements are keyboard-operable.
- **FlipCard anti-shake rule:** hover/pointer binds to the stable, non-transformed wrapper — never the rotating element. Desktop hover gated by `@media (hover:hover) and (pointer:fine)`.
- **Images:** use `next/image`. Real assets where present; otherwise an `ImagePlaceholder` labeled with the needed image.
- **Tests live in** `**/__tests__/**/*.test.{ts,tsx}` (existing Vitest `include`). Import via the `@/` alias (root = `frontend/`). Commit test + implementation together per task.

---

### Task 1: Test harness & dependencies

**Files:**
- Modify: `frontend/package.json` (dependencies)
- Create: `frontend/vitest.setup.ts`
- Modify: `frontend/vitest.config.ts:12-20`
- Test: `frontend/components/ui/__tests__/harness.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Testing Library + jsdom harness with `matchMedia` and `IntersectionObserver` stubs, so all later component tests can `render()` and use `jest-dom` matchers.

- [ ] **Step 1: Install dependencies**

Run (from `frontend/`):
```bash
npm install lucide-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: `package.json` gains `lucide-react` under dependencies and the three `@testing-library/*` packages under devDependencies.

- [ ] **Step 2: Create the Vitest setup file**

Create `frontend/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// jsdom lacks matchMedia — stub it (default: feature off, e.g. not reduced-motion)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// jsdom lacks IntersectionObserver — stub a no-op (never fires, keeps tests deterministic).
// No constructor: the runtime simply ignores the callback/options args passed by consumers.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  IntersectionObserverStub
;(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  IntersectionObserverStub
```

- [ ] **Step 3: Register the setup file in Vitest**

Modify `frontend/vitest.config.ts` — add `setupFiles` inside the `test` block:
```ts
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
```

- [ ] **Step 3b: Keep tests out of the production typecheck**

Vitest (esbuild) runs tests with `globals: true` and no full typecheck, but `next build` typechecks every file in the tsconfig `include`. Exclude tests + setup so the build doesn't choke on Vitest/jest-dom globals. Modify `frontend/tsconfig.json` — replace the `exclude` array:
```json
  "exclude": [
    "node_modules",
    "**/__tests__/**",
    "vitest.setup.ts"
  ]
```
(Path aliases still resolve in tests because Vitest maps `@` itself and the ESLint import resolver reads `compilerOptions.paths`, which is independent of `include`/`exclude`.)

- [ ] **Step 4: Write the harness verification test**

Create `frontend/components/ui/__tests__/harness.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

describe('test harness', () => {
  it('renders DOM and exposes jest-dom matchers', () => {
    render(<button>Hello</button>)
    expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument()
  })

  it('provides matchMedia and IntersectionObserver stubs', () => {
    expect(typeof window.matchMedia).toBe('function')
    expect(typeof window.IntersectionObserver).toBe('function')
  })
})
```

- [ ] **Step 5: Run the test to verify it passes**

Run (from `frontend/`): `npm test`
Expected: PASS, 2 tests in `harness.test.tsx`. (If `matchMedia`/`IntersectionObserver` assertions fail, the setup file is not loading — recheck `setupFiles` path.)

- [ ] **Step 6: Commit**
```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/vitest.setup.ts frontend/tsconfig.json frontend/components/ui/__tests__/harness.test.tsx
git commit -m "test: set up Testing Library harness with jsdom stubs"
```

---

### Task 2: Design tokens, fonts & global styles

Non-behavioral configuration (no RED/GREEN cycle — verified by a successful build). Folds in tokens, fonts, custom screens, the flip-card CSS, and base globals that every later task depends on.

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utilities `bg-forest`, `bg-forest-deep`, `bg-forest-mid`, `bg-mint`, `bg-mint-soft`, `bg-cream`, `bg-paper`, `text-ink`, `text-muted`, `border-line`, `font-serif`, `font-sans`, `shadow-card`, `shadow-card-lg`; custom screens `xs`, `wide`, `nav`; and CSS classes `flip-stage`, `flip-inner`, `is-flipped`, `flip-face`, `flip-back`.

- [ ] **Step 1: Extend the Tailwind config**

Replace the contents of `frontend/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '380px',
        nav: '860px',
        wide: '900px',
      },
      colors: {
        spriggatito: {
          50: '#f2faf3', 100: '#d4f0d9', 200: '#a9e0b3', 300: '#72c882',
          400: '#4aae5e', 500: '#2d8f44', 600: '#1f6e32', 700: '#175427',
          800: '#103b1c', 900: '#082110',
        },
        forest: { DEFAULT: '#1f6e32', deep: '#103b1c', mid: '#2d8f44' },
        mint: { DEFAULT: '#a9e0b3', soft: '#d4f0d9' },
        cream: '#f5f0e8',
        paper: '#fffdf8',
        ink: '#241f1b',
        muted: '#6f6457',
        line: '#e6ddcc',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 14px 30px rgba(16,59,28,0.12)',
        'card-lg': '0 22px 44px rgba(16,59,28,0.30)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Add token vars, base defaults, and flip-card CSS to globals**

Replace the contents of `frontend/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --forest: #1f6e32;
  --forest-deep: #103b1c;
  --forest-mid: #2d8f44;
  --mint: #a9e0b3;
  --mint-soft: #d4f0d9;
  --cream: #f5f0e8;
  --paper: #fffdf8;
  --ink: #241f1b;
  --muted: #6f6457;
  --line: #e6ddcc;
}

body {
  background: var(--cream);
  color: var(--ink);
}

/* ---- FlipCard: 3D flip with anti-shake (hover binds to the stable wrapper) ---- */
.flip-stage {
  perspective: 1500px;
  width: min(262px, 72vw);
  height: calc(min(262px, 72vw) * 1.4);
  cursor: pointer;
}
.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.flip-inner.is-flipped {
  transform: rotateY(180deg);
}
@media (hover: hover) and (pointer: fine) {
  .flip-stage:hover .flip-inner {
    transform: rotateY(180deg);
  }
}
.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 22px 44px rgba(16, 59, 28, 0.3);
}
.flip-back {
  transform: rotateY(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .flip-inner {
    transition: none;
  }
}
```

- [ ] **Step 3: Load fonts in the root layout**

Replace the contents of `frontend/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "Merlin's Minty Cards",
    template: "%s | Merlin's Minty Cards",
  },
  description: "Pokemon card inventory and collector resources from Merlin's Minty Cards.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-cream text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Verify the app still builds**

Run (from `frontend/`): `npm run build`
Expected: build completes with no TypeScript or CSS errors. (Network access is needed once for `next/font` to fetch Fraunces/Inter.)

- [ ] **Step 5: Commit**
```bash
git add frontend/tailwind.config.ts frontend/app/globals.css frontend/app/layout.tsx
git commit -m "feat: add design tokens, fonts, custom breakpoints, and flip-card styles"
```

---

### Task 3: Button primitive

**Files:**
- Create: `frontend/components/ui/Button.tsx`
- Test: `frontend/components/ui/__tests__/Button.test.tsx`

**Interfaces:**
- Produces: `Button({ href?: string; variant?: 'primary' | 'ghost'; className?: string; children: ReactNode })`. Renders a Next `Link` when `href` is set, else a `<button type="button">`. Exposes `data-variant`.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/ui/__tests__/Button.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('renders a link with the given href', () => {
    render(<Button href="/about">Read our story</Button>)
    expect(screen.getByRole('link', { name: 'Read our story' })).toHaveAttribute('href', '/about')
  })

  it('renders a button element when no href is given', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('exposes the variant via data-variant', () => {
    render(<Button href="/x" variant="ghost">Ghost</Button>)
    expect(screen.getByRole('link', { name: 'Ghost' })).toHaveAttribute('data-variant', 'ghost')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- Button`
Expected: FAIL — cannot resolve `@/components/ui/Button`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/components/ui/Button.tsx`:
```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

const base =
  'inline-block rounded-full text-center font-semibold text-[15px] px-6 py-3 transition-transform active:translate-y-px'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-forest text-white shadow-[0_8px_20px_rgba(31,110,50,0.25)]',
  ghost: 'border-[1.5px] border-forest text-forest',
}

export default function Button({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href?: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  const classes = `${base} ${variantClasses[variant]} ${className}`
  if (href) {
    return (
      <Link href={href} data-variant={variant} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" data-variant={variant} className={classes}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- Button`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/ui/Button.tsx frontend/components/ui/__tests__/Button.test.tsx
git commit -m "feat: add Button primitive (link/button + variants)"
```

---

### Task 4: Display primitives (Container, Eyebrow, SectionHeading, Badge, ImagePlaceholder)

Small presentational primitives grouped into one task; each gets a test.

**Files:**
- Create: `frontend/components/ui/Container.tsx`, `Eyebrow.tsx`, `SectionHeading.tsx`, `Badge.tsx`, `ImagePlaceholder.tsx`
- Test: `frontend/components/ui/__tests__/primitives.test.tsx`

**Interfaces:**
- Produces:
  - `Container({ children, className? })` → centered max-w wrapper.
  - `Eyebrow({ children, className? })` → uppercase tracked label.
  - `SectionHeading({ eyebrow: string; title: string; subtitle?: string })` → Eyebrow + `<h2>` + optional `<p>`.
  - `Badge({ children, className? })` → pill.
  - `ImagePlaceholder({ label: string; className? })` → block with `role="img"` and `aria-label={label}`.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/ui/__tests__/primitives.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import SectionHeading from '@/components/ui/SectionHeading'
import Badge from '@/components/ui/Badge'
import ImagePlaceholder from '@/components/ui/ImagePlaceholder'

describe('display primitives', () => {
  it('Container renders its children', () => {
    render(<Container>inside</Container>)
    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  it('Eyebrow renders its text', () => {
    render(<Eyebrow>Our story</Eyebrow>)
    expect(screen.getByText('Our story')).toBeInTheDocument()
  })

  it('SectionHeading renders the title as a level-2 heading plus eyebrow', () => {
    render(<SectionHeading eyebrow="What we do" title="Three ways to work with us" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Three ways to work with us' })).toBeInTheDocument()
    expect(screen.getByText('What we do')).toBeInTheDocument()
  })

  it('SectionHeading renders the subtitle only when provided', () => {
    const { rerender } = render(<SectionHeading eyebrow="E" title="T" />)
    expect(screen.queryByText('Sub copy')).not.toBeInTheDocument()
    rerender(<SectionHeading eyebrow="E" title="T" subtitle="Sub copy" />)
    expect(screen.getByText('Sub copy')).toBeInTheDocument()
  })

  it('Badge renders its label', () => {
    render(<Badge>Buy</Badge>)
    expect(screen.getByText('Buy')).toBeInTheDocument()
  })

  it('ImagePlaceholder exposes its label as an accessible image', () => {
    render(<ImagePlaceholder label="Photo: Merlin at a show" />)
    expect(screen.getByRole('img', { name: 'Photo: Merlin at a show' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- primitives`
Expected: FAIL — cannot resolve `@/components/ui/Container`.

- [ ] **Step 3: Write minimal implementations**

Create `frontend/components/ui/Container.tsx`:
```tsx
import type { ReactNode } from 'react'

export default function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mx-auto w-full max-w-[1140px] px-5 sm:px-7 ${className}`}>{children}</div>
}
```

Create `frontend/components/ui/Eyebrow.tsx`:
```tsx
import type { ReactNode } from 'react'

export default function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`font-sans font-bold text-[13px] uppercase tracking-[0.16em] text-forest ${className}`}
    >
      {children}
    </span>
  )
}
```

Create `frontend/components/ui/SectionHeading.tsx`:
```tsx
import Eyebrow from './Eyebrow'

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
```

Create `frontend/components/ui/Badge.tsx`:
```tsx
import type { ReactNode } from 'react'

export default function Badge({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-full bg-mint-soft text-forest font-bold text-[12px] uppercase tracking-[0.08em] px-3 py-[5px] ${className}`}
    >
      {children}
    </span>
  )
}
```

Create `frontend/components/ui/ImagePlaceholder.tsx`:
```tsx
export default function ImagePlaceholder({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center text-center text-white text-[12px] font-semibold p-3 bg-gradient-to-br from-forest-mid to-forest-deep ${className}`}
    >
      <span aria-hidden="true">{label}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- primitives`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/ui/Container.tsx frontend/components/ui/Eyebrow.tsx frontend/components/ui/SectionHeading.tsx frontend/components/ui/Badge.tsx frontend/components/ui/ImagePlaceholder.tsx frontend/components/ui/__tests__/primitives.test.tsx
git commit -m "feat: add Container, Eyebrow, SectionHeading, Badge, ImagePlaceholder primitives"
```

---

### Task 5: FlipCard (signature interaction)

**Files:**
- Create: `frontend/components/ui/FlipCard.tsx`
- Test: `frontend/components/ui/__tests__/FlipCard.test.tsx`

**Interfaces:**
- Consumes: flip CSS classes from Task 2 (`flip-stage`, `flip-inner`, `is-flipped`, `flip-face`, `flip-back`).
- Produces: `FlipCard({ front: ReactNode; back: ReactNode; label?: string; className? })`. Renders a wrapper with `role="button"`, `tabIndex=0`, `aria-label={label}`, `aria-pressed={flipped}`, `data-flipped`. Toggles on click and Enter/Space. One-time scroll "peek" via IntersectionObserver unless reduced motion.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/ui/__tests__/FlipCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlipCard from '@/components/ui/FlipCard'

describe('FlipCard', () => {
  it('renders both faces', () => {
    render(<FlipCard front={<span>FRONT</span>} back={<span>BACK</span>} />)
    expect(screen.getByText('FRONT')).toBeInTheDocument()
    expect(screen.getByText('BACK')).toBeInTheDocument()
  })

  it('exposes an accessible toggle button with the given label', () => {
    render(<FlipCard front={<span>F</span>} back={<span>B</span>} label="Lapras card" />)
    const stage = screen.getByRole('button', { name: 'Lapras card' })
    expect(stage).toHaveAttribute('data-flipped', 'false')
  })

  it('toggles flipped state on click', async () => {
    const user = userEvent.setup()
    render(<FlipCard front={<span>F</span>} back={<span>B</span>} label="card" />)
    const stage = screen.getByRole('button', { name: 'card' })
    await user.click(stage)
    expect(stage).toHaveAttribute('data-flipped', 'true')
    await user.click(stage)
    expect(stage).toHaveAttribute('data-flipped', 'false')
  })

  it('toggles flipped state on Enter key', async () => {
    const user = userEvent.setup()
    render(<FlipCard front={<span>F</span>} back={<span>B</span>} label="card" />)
    const stage = screen.getByRole('button', { name: 'card' })
    stage.focus()
    await user.keyboard('{Enter}')
    expect(stage).toHaveAttribute('data-flipped', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- FlipCard`
Expected: FAIL — cannot resolve `@/components/ui/FlipCard`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/components/ui/FlipCard.tsx`:
```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export default function FlipCard({
  front,
  back,
  label = 'Flip card',
  className = '',
}: {
  front: ReactNode
  back: ReactNode
  label?: string
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  // One-time "peek" when the card first enters view, unless reduced motion.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') return

    let done = false
    let inner: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !done) {
            done = true
            inner = setTimeout(() => {
              setFlipped(true)
              inner = setTimeout(() => setFlipped(false), 1000)
            }, 600)
          }
        })
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (inner) clearTimeout(inner)
    }
  }, [])

  const toggle = () => setFlipped((f) => !f)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div
      ref={stageRef}
      className={`flip-stage ${className}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={flipped}
      data-flipped={flipped}
      onClick={toggle}
      onKeyDown={onKeyDown}
    >
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-face flip-front">{front}</div>
        <div className="flip-face flip-back">{back}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- FlipCard`
Expected: PASS, 4 tests. (The IntersectionObserver stub never fires, so `data-flipped` starts `false` deterministically.)

- [ ] **Step 5: Commit**
```bash
git add frontend/components/ui/FlipCard.tsx frontend/components/ui/__tests__/FlipCard.test.tsx
git commit -m "feat: add FlipCard with anti-shake wrapper, keyboard, and scroll-peek"
```

---

### Task 6: Navbar

**Files:**
- Create: `frontend/components/layout/Navbar.tsx`
- Test: `frontend/components/layout/__tests__/Navbar.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 3), `Container` (Task 4), `next/image`, `lucide-react`.
- Produces: `Navbar()` — sticky header. Brand link → `/`; nav links → `/shows`, `/about`, `/dictionary`, `/articles`; Inventory CTA → `/inventory`; a menu `<button>` (`aria-label="Menu"`, `aria-expanded`, `aria-controls="primary-menu"`) toggling the mobile menu; Escape closes it.

- [ ] **Step 1: Provide a clean logo filename**

The real transparent-cat logo has spaces and a curly apostrophe in its name, which is fragile as an image `src`. Copy it to a clean filename (Navbar and Footer both use it). Run (from repo root) — the glob avoids typing the odd characters:
```bash
cp frontend/public/images/logo/*"Just the Cat Transparent"* frontend/public/images/logo/cat-logo.png
```
Expected: `frontend/public/images/logo/cat-logo.png` now exists. (If the source is missing, the file was not added yet — ask the owner for the transparent-cat logo.)

- [ ] **Step 2: Write the failing test**

Create `frontend/components/layout/__tests__/Navbar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// next/image needs no Next runtime in tests — render a plain img
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

import Navbar from '@/components/layout/Navbar'

describe('Navbar', () => {
  it('renders the primary nav links with correct hrefs', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Shows' })).toHaveAttribute('href', '/shows')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Dictionary' })).toHaveAttribute('href', '/dictionary')
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/articles')
  })

  it('renders the Inventory CTA pointing to /inventory', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/inventory')
  })

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const btn = screen.getByRole('button', { name: 'Menu' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run (from `frontend/`): `npm test -- Navbar`
Expected: FAIL — cannot resolve `@/components/layout/Navbar`.

- [ ] **Step 4: Write minimal implementation**

Create `frontend/components/layout/Navbar.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'

const links = [
  { href: '/shows', label: 'Shows' },
  { href: '/about', label: 'About' },
  { href: '/dictionary', label: 'Dictionary' },
  { href: '/articles', label: 'Articles' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-line">
      <Container>
        <nav className="relative flex items-center gap-4 h-[66px]">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/images/logo/cat-logo.png"
              alt="Merlin's Minty Cards"
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
            <span className="font-serif font-semibold text-[16px] nav:text-[19px] text-forest-deep whitespace-nowrap">
              Merlin&apos;s Minty Cards
            </span>
          </Link>

          <ul
            id="primary-menu"
            className={`${
              open ? 'flex' : 'hidden'
            } nav:flex flex-col nav:flex-row gap-0 nav:gap-[22px] absolute nav:static top-[66px] left-0 right-0 nav:top-auto bg-cream nav:bg-transparent border-b border-line nav:border-0 py-2 nav:py-0 shadow-lg nav:shadow-none ml-0 nav:ml-2.5 text-[17px] nav:text-[15px] font-medium`}
          >
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-7 py-3.5 nav:p-0 text-[#4a4339] hover:text-forest"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <span className="flex-1" />

          <Button href="/inventory" className="px-4 nav:px-5 py-2.5 text-[13px] nav:text-sm">
            Inventory
          </Button>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="primary-menu"
            onClick={() => setOpen((o) => !o)}
            className="nav:hidden flex items-center justify-center w-10 h-10 rounded-[10px] border-[1.5px] border-line text-forest-deep"
          >
            <Menu size={18} />
          </button>
        </nav>
      </Container>
    </header>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run (from `frontend/`): `npm test -- Navbar`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**
```bash
git add frontend/public/images/logo/cat-logo.png frontend/components/layout/Navbar.tsx frontend/components/layout/__tests__/Navbar.test.tsx
git commit -m "feat: add Navbar with hamburger menu and Escape-to-close"
```

---

### Task 7: Footer

**Files:**
- Create: `frontend/components/layout/Footer.tsx`
- Test: `frontend/components/layout/__tests__/Footer.test.tsx`

**Interfaces:**
- Consumes: `Container` (Task 4), `next/image`, `next/link`.
- Produces: `Footer()` — deep-green footer with brand blurb, three column groups (Explore / Collect / Follow), an external Instagram link, and a copyright line.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/layout/__tests__/Footer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

import Footer from '@/components/layout/Footer'

describe('Footer', () => {
  it('renders the three column headings', () => {
    render(<Footer />)
    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Collect')).toBeInTheDocument()
    expect(screen.getByText('Follow')).toBeInTheDocument()
  })

  it('renders an external Instagram link', () => {
    render(<Footer />)
    const ig = screen.getByRole('link', { name: 'Instagram' })
    expect(ig).toHaveAttribute('href', expect.stringContaining('instagram.com'))
  })

  it('renders the copyright line', () => {
    render(<Footer />)
    expect(screen.getByText(/Merlin's Minty Cards LLC/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- Footer`
Expected: FAIL — cannot resolve `@/components/layout/Footer`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/components/layout/Footer.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import Container from '@/components/ui/Container'

type Item = { label: string; href: string }
const columns: { heading: string; items: Item[] }[] = [
  {
    heading: 'Explore',
    items: [
      { label: 'Shows', href: '/shows' },
      { label: 'About', href: '/about' },
      { label: 'Articles', href: '/articles' },
      { label: 'Dictionary', href: '/dictionary' },
    ],
  },
  {
    heading: 'Collect',
    items: [
      { label: 'Inventory', href: '/inventory' },
      { label: 'Sign in', href: '/inventory' },
      { label: 'Sell to us', href: '/about' },
    ],
  },
  {
    heading: 'Follow',
    items: [
      { label: 'Instagram', href: 'https://instagram.com/merlinsmintycards' },
      { label: 'Contact', href: '/about#contact' },
    ],
  },
]

function FooterLink({ item }: { item: Item }) {
  const className = 'block text-[14px] text-[#bcd6c4] py-1 hover:text-mint'
  if (/^https?:/.test(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        {item.label}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  )
}

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-[#bcd6c4] pt-[54px] pb-[30px]">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 nav:grid-cols-[2fr_1fr_1fr_1fr] gap-[30px]">
          <div>
            <div className="flex items-center gap-2.5 mb-3 text-white">
              <Image
                src="/images/logo/cat-logo.png"
                alt="Merlin's Minty Cards"
                width={32}
                height={32}
                className="rounded-full shrink-0"
              />
              <span className="font-serif font-semibold text-[19px]">Merlin&apos;s Minty Cards</span>
            </div>
            <p className="text-[14px] text-[#9fbfa8] max-w-[34ch]">
              Buy. Sell. Trade. A collector-run Pokémon card shop built on honesty and 25 years of
              love for the hobby.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h5 className="font-sans text-[14px] uppercase tracking-[0.06em] text-white mb-3.5">
                {col.heading}
              </h5>
              {col.items.map((item) => (
                <FooterLink key={item.label + item.href} item={item} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3.5 justify-between border-t border-white/10 mt-[34px] pt-[18px] text-[13px] text-[#8fae98]">
          <span>© 2026 Merlin&apos;s Minty Cards LLC</span>
          <span>Privacy · Terms</span>
        </div>
      </Container>
    </footer>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- Footer`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/layout/Footer.tsx frontend/components/layout/__tests__/Footer.test.tsx
git commit -m "feat: add Footer with column nav and social links"
```

---

### Task 8: Hero section (with FlipCard)

**Files:**
- Create: `frontend/components/home/Hero.tsx`
- Test: `frontend/components/home/__tests__/Hero.test.tsx`

**Interfaces:**
- Consumes: `Container`, `Button`, `Eyebrow`, `ImagePlaceholder`, `FlipCard`.
- Produces: `Hero()` — `<section>` with an `<h1>`, lead paragraph, two CTAs (`/about`, `/shows`), and a `FlipCard` whose front/back are placeholders.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/__tests__/Hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Hero from '@/components/home/Hero'

describe('Hero', () => {
  it('renders the headline and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('handled with care')
    expect(screen.getByRole('link', { name: 'Read our story' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'See upcoming shows' })).toHaveAttribute('href', '/shows')
  })

  it('renders the flippable card', () => {
    render(<Hero />)
    expect(screen.getByRole('button', { name: /tap to flip/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- Hero`
Expected: FAIL — cannot resolve `@/components/home/Hero`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/components/home/Hero.tsx`:
```tsx
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Eyebrow from '@/components/ui/Eyebrow'
import ImagePlaceholder from '@/components/ui/ImagePlaceholder'
import FlipCard from '@/components/ui/FlipCard'

export default function Hero() {
  return (
    <section className="py-[60px]">
      <Container>
        <div className="grid wide:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <Eyebrow>Buy · Sell · Trade</Eyebrow>
            <h1 className="font-serif font-semibold text-forest-deep leading-[1.1] tracking-[-0.01em] text-[clamp(34px,6.4vw,54px)] my-4">
              Pokémon cards,
              <br />
              handled with care.
            </h1>
            <p className="text-muted text-[clamp(16px,2.4vw,19px)] max-w-[42ch] mb-7">
              Merlin&apos;s Minty Cards is a collector-run shop built on 25 years in the hobby — fair
              grading, honest pricing, and a friendly face at every card show.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5">
              <Button href="/about">Read our story</Button>
              <Button href="/shows" variant="ghost">
                See upcoming shows
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center order-first wide:order-none">
            <FlipCard
              label="Lapras card — tap to flip"
              front={
                <ImagePlaceholder
                  label="Front: real graded card photo (e.g. laprassouthern.webp)"
                  className="w-full h-full"
                />
              }
              back={
                <ImagePlaceholder
                  label="Card back: classic Pokémon back image"
                  className="w-full h-full bg-gradient-to-br from-[#3457b0] to-[#1d2f6b]"
                />
              }
            />
            <p className="text-center text-[12px] text-muted mt-3.5">
              <span className="hidden nav:inline">↕ Hover or tap to flip</span>
              <span className="inline nav:hidden">👆 Tap to flip</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- Hero`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/home/Hero.tsx frontend/components/home/__tests__/Hero.test.tsx
git commit -m "feat: add Hero section with flippable card"
```

---

### Task 9: TrustStrip, StoryTeaser, BuySellTrade sections

**Files:**
- Create: `frontend/components/home/TrustStrip.tsx`, `StoryTeaser.tsx`, `BuySellTrade.tsx`
- Test: `frontend/components/home/__tests__/sections-mid.test.tsx`

**Interfaces:**
- Consumes: `Container`, `Eyebrow`, `Button`, `SectionHeading`, `Badge`, `next/image`, `lucide-react`.
- Produces: `TrustStrip()`, `StoryTeaser()`, `BuySellTrade()` — each a section/band exporting default.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/__tests__/sections-mid.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

import TrustStrip from '@/components/home/TrustStrip'
import StoryTeaser from '@/components/home/StoryTeaser'
import BuySellTrade from '@/components/home/BuySellTrade'

describe('mid Home sections', () => {
  it('TrustStrip renders all four trust items', () => {
    render(<TrustStrip />)
    ;['Honest grading', 'Fair pricing', 'Collector-run', 'At the shows'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument(),
    )
  })

  it('StoryTeaser renders the heading and link to About', () => {
    render(<StoryTeaser />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'It started with one binder.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'More about Merlin' })).toHaveAttribute('href', '/about')
  })

  it('BuySellTrade renders the three offer cards', () => {
    render(<BuySellTrade />)
    expect(screen.getByText('Find your next card')).toBeInTheDocument()
    expect(screen.getByText('Cash in your collection')).toBeInTheDocument()
    expect(screen.getByText('Swap toward a grail')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- sections-mid`
Expected: FAIL — cannot resolve `@/components/home/TrustStrip`.

- [ ] **Step 3: Write minimal implementations**

Create `frontend/components/home/TrustStrip.tsx`:
```tsx
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
```

Create `frontend/components/home/StoryTeaser.tsx`:
```tsx
import Image from 'next/image'
import Container from '@/components/ui/Container'
import Eyebrow from '@/components/ui/Eyebrow'
import Button from '@/components/ui/Button'

export default function StoryTeaser() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <div className="grid wide:grid-cols-[0.95fr_1.05fr] gap-7 wide:gap-12 items-center">
          <Image
            src="/images/about-us/childhood-card-collection.webp"
            alt="Merlin's childhood Pokémon card collection laid out on the floor"
            width={560}
            height={360}
            className="w-full h-auto rounded-[18px] shadow-card object-cover"
          />
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-serif font-semibold text-forest-deep text-[clamp(26px,4.4vw,34px)] leading-[1.1] mt-2.5 mb-3.5">
              It started with one binder.
            </h2>
            <p className="text-[#4a4339] mb-3.5">
              What began as a kid laying every card out on the living-room floor turned into a
              quarter-century of collecting, trading, and helping other people find the cards
              they&apos;ve been chasing.
            </p>
            <p className="text-[#4a4339] mb-3.5">
              Today it&apos;s about the same thing it always was: the joy of the find, treated with
              honesty and care.
            </p>
            <Button href="/about" variant="ghost">
              More about Merlin
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
```

Create `frontend/components/home/BuySellTrade.tsx`:
```tsx
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import Badge from '@/components/ui/Badge'

const cards: { badge: string; title: string; body: string }[] = [
  {
    badge: 'Buy',
    title: 'Find your next card',
    body: 'Browse a curated, fairly-priced inventory — beginner singles to graded vintage.',
  },
  {
    badge: 'Sell',
    title: 'Cash in your collection',
    body: 'An honest valuation. No lowballs, no pressure — just a fair offer.',
  },
  {
    badge: 'Trade',
    title: 'Swap toward a grail',
    body: "Bring what you've got and trade up toward the card you actually want.",
  },
]

export default function BuySellTrade() {
  return (
    <section className="bg-paper py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="What we do"
          title="Three ways to work with us."
          subtitle="Whether you're starting out, cashing in, or hunting a grail, there's a friendly way in."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div
              key={c.badge}
              className="bg-cream border border-line rounded-2xl p-[26px] transition-transform hover:-translate-y-0.5 hover:shadow-card"
            >
              <Badge>{c.badge}</Badge>
              <h3 className="font-serif font-semibold text-forest-deep text-[21px] mt-3.5 mb-2">
                {c.title}
              </h3>
              <p className="text-muted text-[15px]">{c.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- sections-mid`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/home/TrustStrip.tsx frontend/components/home/StoryTeaser.tsx frontend/components/home/BuySellTrade.tsx frontend/components/home/__tests__/sections-mid.test.tsx
git commit -m "feat: add TrustStrip, StoryTeaser, and BuySellTrade sections"
```

---

### Task 10: FeaturedFinds, ShowsPreview, LearnHub, FinalCTA sections

**Files:**
- Create: `frontend/components/home/FeaturedFinds.tsx`, `ShowsPreview.tsx`, `LearnHub.tsx`, `FinalCTA.tsx`
- Test: `frontend/components/home/__tests__/sections-bottom.test.tsx`

**Interfaces:**
- Consumes: `Container`, `SectionHeading`, `Eyebrow`, `Button`, `ImagePlaceholder`, `next/link`.
- Produces: `FeaturedFinds()`, `ShowsPreview()`, `LearnHub()`, `FinalCTA()` — each exports default.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/__tests__/sections-bottom.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import FeaturedFinds from '@/components/home/FeaturedFinds'
import ShowsPreview from '@/components/home/ShowsPreview'
import LearnHub from '@/components/home/LearnHub'
import FinalCTA from '@/components/home/FinalCTA'

describe('bottom Home sections', () => {
  it('FeaturedFinds links to the inventory', () => {
    render(<FeaturedFinds />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'A peek at the collection.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore the inventory/ })).toHaveAttribute(
      'href',
      '/inventory',
    )
  })

  it('ShowsPreview links to the shows page', () => {
    render(<ShowsPreview />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Catch us at a card show.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All shows' })).toHaveAttribute('href', '/shows')
  })

  it('LearnHub links to articles and dictionary', () => {
    render(<LearnHub />)
    expect(screen.getByRole('link', { name: /Articles & guides/ })).toHaveAttribute(
      'href',
      '/articles',
    )
    expect(screen.getByRole('link', { name: /Collectors Dictionary/ })).toHaveAttribute(
      'href',
      '/dictionary',
    )
  })

  it('FinalCTA renders the closing call to action', () => {
    render(<FinalCTA />)
    expect(
      screen.getByRole('heading', { level: 2, name: "Let's find your card." }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/about#contact')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm test -- sections-bottom`
Expected: FAIL — cannot resolve `@/components/home/FeaturedFinds`.

- [ ] **Step 3: Write minimal implementations**

Create `frontend/components/home/FeaturedFinds.tsx`:
```tsx
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
```

Create `frontend/components/home/ShowsPreview.tsx`:
```tsx
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
          subtitle="Half the fun is meeting collectors face to face. Here's where we'll be next."
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
          Placeholder show — real upcoming events come from the Shows page later.
        </p>
      </Container>
    </section>
  )
}
```

Create `frontend/components/home/LearnHub.tsx`:
```tsx
import Link from 'next/link'
import Container from '@/components/ui/Container'
import SectionHeading from '@/components/ui/SectionHeading'

export default function LearnHub() {
  return (
    <section className="py-[clamp(44px,7vw,74px)]">
      <Container>
        <SectionHeading
          eyebrow="New to collecting?"
          title="Start with the basics."
          subtitle="No gatekeeping. Plain-English guides and a glossary to get you confident fast."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/articles"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end text-white shadow-card bg-gradient-to-br from-forest-mid to-forest-deep"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Articles &amp; guides
            </h3>
            <p className="text-[#dceede] text-[15px]">
              Beginner-friendly reads on grading, sets, and smart collecting.
            </p>
          </Link>
          <Link
            href="/dictionary"
            className="rounded-[18px] p-8 min-h-[170px] flex flex-col justify-end text-white shadow-card bg-gradient-to-br from-[#3a6b46] to-[#1c3a26]"
          >
            <h3 className="font-serif font-semibold text-white text-[23px] mb-1.5">
              Collectors Dictionary
            </h3>
            <p className="text-[#dceede] text-[15px]">
              Every term — slab, PSA, holo, reverse — explained simply.
            </p>
          </Link>
        </div>
      </Container>
    </section>
  )
}
```

Create `frontend/components/home/FinalCTA.tsx`:
```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm test -- sections-bottom`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**
```bash
git add frontend/components/home/FeaturedFinds.tsx frontend/components/home/ShowsPreview.tsx frontend/components/home/LearnHub.tsx frontend/components/home/FinalCTA.tsx frontend/components/home/__tests__/sections-bottom.test.tsx
git commit -m "feat: add FeaturedFinds, ShowsPreview, LearnHub, FinalCTA sections"
```

---

### Task 11: Wire public layout, compose Home page, acceptance test & final verification

**Files:**
- Modify: `frontend/app/(public)/layout.tsx`
- Modify: `frontend/app/(public)/page.tsx`
- Test: `frontend/app/(public)/__tests__/page.test.tsx`
- Test: `frontend/app/(public)/__tests__/layout.test.tsx`

**Interfaces:**
- Consumes: `Navbar`, `Footer`, and all eight Home sections.
- Produces: the assembled `/` route and `(public)` layout. This is the outside-in acceptance gate for the whole feature.

- [ ] **Step 1: Write the failing acceptance tests**

Create `frontend/app/(public)/__tests__/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

import HomePage from '@/app/(public)/page'

describe('Home page', () => {
  it('renders the hero headline', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('handled with care')
  })

  it('renders every major section heading', () => {
    render(<HomePage />)
    ;[
      'It started with one binder.',
      'Three ways to work with us.',
      'A peek at the collection.',
      'Catch us at a card show.',
      'Start with the basics.',
      "Let's find your card.",
    ].forEach((t) =>
      expect(screen.getByRole('heading', { level: 2, name: t })).toBeInTheDocument(),
    )
  })

  it('routes its primary CTAs correctly', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: 'Read our story' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /Explore the inventory/ })).toHaveAttribute('href', '/inventory')
    expect(screen.getByRole('link', { name: /Articles & guides/ })).toHaveAttribute('href', '/articles')
    expect(screen.getByRole('link', { name: /Collectors Dictionary/ })).toHaveAttribute('href', '/dictionary')
  })
})
```

Create `frontend/app/(public)/__tests__/layout.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

import PublicLayout from '@/app/(public)/layout'

describe('public layout', () => {
  it('wraps children with the Navbar (Inventory CTA) and Footer', () => {
    render(
      <PublicLayout>
        <div>PAGE BODY</div>
      </PublicLayout>,
    )
    expect(screen.getByText('PAGE BODY')).toBeInTheDocument()
    // "Inventory" appears in BOTH Navbar and Footer, so assert each region uniquely:
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument() // Navbar (mobile toggle)
    expect(screen.getByText('Explore')).toBeInTheDocument() // Footer column heading
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `frontend/`): `npm test -- "(public)"`
Expected: FAIL — `HomePage` renders `null` (no headings) and `PublicLayout` renders no Navbar/Footer.

- [ ] **Step 3: Wire the layout**

Replace the contents of `frontend/app/(public)/layout.tsx`:
```tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Compose the Home page**

Replace the contents of `frontend/app/(public)/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import TrustStrip from '@/components/home/TrustStrip'
import StoryTeaser from '@/components/home/StoryTeaser'
import BuySellTrade from '@/components/home/BuySellTrade'
import FeaturedFinds from '@/components/home/FeaturedFinds'
import ShowsPreview from '@/components/home/ShowsPreview'
import LearnHub from '@/components/home/LearnHub'
import FinalCTA from '@/components/home/FinalCTA'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <StoryTeaser />
      <BuySellTrade />
      <FeaturedFinds />
      <ShowsPreview />
      <LearnHub />
      <FinalCTA />
    </>
  )
}
```

- [ ] **Step 5: Run the acceptance tests to verify they pass**

Run (from `frontend/`): `npm test -- "(public)"`
Expected: PASS — 4 tests across `page.test.tsx` and `layout.test.tsx`.

- [ ] **Step 6: Run the full verification gate**

Run (from `frontend/`):
```bash
npm test
npm run lint
npm run build
```
Expected: all tests PASS; lint reports no errors; `next build` succeeds. Fix any failures before committing.

- [ ] **Step 7: Commit**
```bash
git add frontend/app/(public)/layout.tsx frontend/app/(public)/page.tsx "frontend/app/(public)/__tests__/page.test.tsx" "frontend/app/(public)/__tests__/layout.test.tsx"
git commit -m "feat: assemble public layout and Home page"
```

---

## Images Needed (report to owner)

These render as labeled placeholders until provided:
- **Card back** — classic Pokémon card back image (FlipCard back face).
- **Featured finds (×5)** — inventory card images (to be served via CloudFront).
- **Show photo** — a card-show photo for the Shows preview (`images/shows/` is currently empty).
- **Open Graph image** — branded social-share image (future SEO/GEO task).

Real assets already wired: nav/footer logo (transparent cat), story photo (`childhood-card-collection.webp`).

## Out of Scope (future specs)

Auth wiring, the inventory tool UI, Sanity content, the other public pages (Shows/About/Dictionary/Articles), and real photography beyond what exists today.

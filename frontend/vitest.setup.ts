import { expect, vi, afterEach } from 'vitest'
import { createElement } from 'react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

afterEach(() => cleanup())

// next/image is a heavy client component that doesn't run in jsdom. Mock it
// globally (applies to every test file) as a plain <img>, forwarding only the
// props that are valid DOM attributes. The Next-only props (priority, fill,
// quality, placeholder, …) are intentionally dropped so React doesn't warn
// about unknown attributes — tests assert on src/alt, not Next internals.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    sizes,
    className,
  }: {
    src: unknown
    alt?: string
    width?: number
    height?: number
    sizes?: string
    className?: string
  }) =>
    createElement('img', {
      src: typeof src === 'string' ? src : '',
      alt: alt ?? '',
      width,
      height,
      sizes,
      className,
    }),
}))

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

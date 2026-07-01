// Article content layer — static sample data for now, structured so it can be
// swapped to Sanity later without changing the components. Implemented via TDD.

export interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  readingTime: string
  category: string
  body: string[]
}

export const articles: Article[] = [
  {
    slug: 'grading-101',
    title: 'Grading 101: is your card worth slabbing?',
    excerpt: 'When professional grading pays off — and when it just costs you.',
    date: '2026-05-12',
    readingTime: '6 min read',
    category: 'Guides',
    body: [
      'Grading can turn a good card into a great one — or cost you more than the card is worth. The trick is knowing which is which before you mail anything off.',
      'Start with three questions: Is the card valuable enough that a grade meaningfully changes its price? Is it in good enough condition to grade well? And do you actually plan to sell it?',
      'If the answer to all three is yes, grading usually pays for itself. If not, a raw card in a sleeve and toploader is often the smarter move.',
    ],
  },
  {
    slug: 'spotting-fakes',
    title: 'How to spot a fake Pokémon card',
    excerpt: 'Quick checks that catch the most common counterfeits before you buy.',
    date: '2026-04-02',
    readingTime: '5 min read',
    category: 'Guides',
    body: [
      'Counterfeits have gotten better, but most still fail a few simple tests you can run in seconds.',
      'Check the texture and the light-blue back coloring, compare the font weight on the energy symbols, and look closely at the bottom-edge of the card stock for the tell-tale black layer.',
      'When in doubt, compare against a card you know is real from the same set. Side by side, fakes usually give themselves away.',
    ],
  },
  {
    slug: 'starting-with-kids',
    title: 'Collecting with your kids without going broke',
    excerpt: 'A parent-friendly way to make the hobby fun, cheap, and lasting.',
    date: '2026-03-15',
    readingTime: '4 min read',
    category: 'Beginners',
    body: [
      'Kids love opening packs, but packs are the most expensive way to collect. Here is how to keep it fun without emptying your wallet.',
      'Buy singles of their favorite Pokémon, set a small weekly budget they help manage, and use cheap bulk cards to teach sorting and care.',
      'The goal is the shared time, not the chase. The collection is just the excuse to sit down together.',
    ],
  },
]

export function getAllArticles(): Article[] {
  return articles
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

// One formatter per month style. timeZone: 'UTC' is essential: article dates are
// date-only strings (parsed as UTC midnight), so formatting in UTC keeps the
// displayed calendar date identical for every viewer. Without it, negative-offset
// timezones (e.g. US Pacific, where the business is based) render the prior day.
const dateFormatters: Record<'short' | 'long', Intl.DateTimeFormat> = {
  short: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
  long: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
}

/**
 * Format an article's date-only ISO string (e.g. `"2026-05-12"`) for display.
 * Returns the original string unchanged when it can't be parsed.
 *
 * @param iso   A date-only ISO string.
 * @param style `'short'` → `"May 12, 2026"` (default); `'long'` → `"May 12, 2026"`
 *              with the full month name (e.g. `"September 20, 2026"`).
 */
export function formatArticleDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : dateFormatters[style].format(parsed)
}

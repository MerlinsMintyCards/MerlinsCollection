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

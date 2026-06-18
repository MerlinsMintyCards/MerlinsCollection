// Sanity article schema — fields expanded via TDD
const article = {
  name: 'article',
  title: 'Article',
  type: 'document' as const,
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'publishedAt', title: 'Published At', type: 'datetime' },
    { name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] },
  ],
}

export default article

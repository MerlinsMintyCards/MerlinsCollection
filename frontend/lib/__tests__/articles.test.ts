import { describe, it, expect } from 'vitest'
import { getAllArticles, getArticleBySlug } from '@/lib/articles'

describe('articles data layer', () => {
  it('returns the published sample articles', () => {
    const all = getAllArticles()
    expect(all.length).toBeGreaterThanOrEqual(3)
    all.forEach((a) => {
      expect(a.slug).toBeTruthy()
      expect(a.title).toBeTruthy()
    })
  })

  it('looks up an article by slug', () => {
    const article = getArticleBySlug('grading-101')
    expect(article).toBeDefined()
    expect(article?.title).toMatch(/grading/i)
    expect(article?.body.length).toBeGreaterThan(0)
  })

  it('returns undefined for an unknown slug', () => {
    expect(getArticleBySlug('does-not-exist')).toBeUndefined()
  })
})

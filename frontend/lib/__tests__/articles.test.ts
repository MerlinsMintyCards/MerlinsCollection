import { describe, it, expect } from 'vitest'
import { getAllArticles, getArticleBySlug, formatArticleDate } from '@/lib/articles'

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

describe('formatArticleDate', () => {
  it('formats a date-only ISO string by its calendar date, independent of timezone', () => {
    // Parsed as UTC midnight; must render the same day everywhere (no off-by-one).
    expect(formatArticleDate('2026-09-20')).toBe('Sep 20, 2026')
  })

  it('supports a long month style for the article page', () => {
    expect(formatArticleDate('2026-09-20', 'long')).toBe('September 20, 2026')
  })

  it('falls back to the original string when the date is unparseable', () => {
    expect(formatArticleDate('not-a-date')).toBe('not-a-date')
  })
})

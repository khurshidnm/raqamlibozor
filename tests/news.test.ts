import { describe, expect, it } from 'vitest';
import { formatDate, isoDate, newsPath, paginateNews } from '../src/lib/news-utils';

describe('newsPath', () => {
  it('builds list, page and post URLs', () => {
    expect(newsPath('uz', 'uz')).toBe('/news/');
    expect(newsPath('uz', 'uz', 'my-post')).toBe('/news/my-post/');
    expect(newsPath('uz', 'uz', { page: 1 })).toBe('/news/');
    expect(newsPath('uz', 'uz', { page: 3 })).toBe('/news/page/3/');
  });
  it('prefixes non-default locales', () => {
    expect(newsPath('ru', 'uz', { page: 2 })).toBe('/ru/news/page/2/');
    expect(newsPath('ru', 'uz', 'post')).toBe('/ru/news/post/');
  });
});

describe('paginateNews', () => {
  const posts = Array.from({ length: 20 }, (_, i) => i);
  it('splits into pages of the given size', () => {
    expect(paginateNews(posts, 1, 9)).toMatchObject({ current: 1, totalPages: 3 });
    expect(paginateNews(posts, 3, 9).items).toEqual([18, 19]);
  });
  it('clamps out-of-range pages and handles an empty list', () => {
    expect(paginateNews(posts, 99, 9).current).toBe(3);
    expect(paginateNews(posts, 0, 9).current).toBe(1);
    expect(paginateNews([], 1)).toEqual({ items: [], current: 1, totalPages: 1 });
  });
});

describe('dates', () => {
  const date = new Date('2026-09-02T00:00:00Z');
  it('formats and serialises the calendar day independent of the build time zone', () => {
    expect(isoDate(date)).toBe('2026-09-02');
    expect(formatDate(date, 'en')).toBe('September 2, 2026');
  });
  it('falls back to ISO for an invalid locale tag', () => {
    expect(formatDate(date, 'not a locale!!')).toBe('2026-09-02');
  });
});

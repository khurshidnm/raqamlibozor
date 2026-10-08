import { getCollection, type CollectionEntry } from 'astro:content';
import { localePath } from './content';

export type NewsPost = CollectionEntry<'news'>;

export const NEWS_PAGE_SIZE = 9;

/** Published posts for a locale, newest first. Drafts are visible in `astro dev` only. */
export async function getNews(locale: string): Promise<NewsPost[]> {
  const posts = await getCollection(
    'news',
    (post) => post.data.locale === locale && (import.meta.env.DEV || !post.data.draft),
  );
  return posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

/** URL of the news list, a list page, or a post: /news/, /news/page/2/, /news/<slug>/ (locale-prefixed when needed). */
export function newsPath(locale: string, defaultLocale: string, target?: string | { page: number }): string {
  const base = `${localePath(locale, defaultLocale)}news/`;
  if (!target) return base;
  if (typeof target === 'string') return `${base}${target}/`;
  return target.page <= 1 ? base : `${base}page/${target.page}/`;
}

export function paginateNews(posts: NewsPost[], page: number, pageSize = NEWS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: posts.slice((current - 1) * pageSize, current * pageSize), current, totalPages };
}

/** "8-oktabr, 2026" for uz-Latn; falls back to the raw ISO date if the locale is unknown. */
export function formatDate(date: Date, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

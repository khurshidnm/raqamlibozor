import { localePath } from './locale';

/** Pure news helpers (URLs, pagination, dates). Kept free of Astro imports for unit tests. */

export const NEWS_PAGE_SIZE = 9;

/** URL of the news list, a list page, or a post: /news/, /news/page/2/, /news/<slug>/ (locale-prefixed when needed). */
export function newsPath(locale: string, defaultLocale: string, target?: string | { page: number }): string {
  const base = `${localePath(locale, defaultLocale)}news/`;
  if (!target) return base;
  if (typeof target === 'string') return `${base}${target}/`;
  return target.page <= 1 ? base : `${base}page/${target.page}/`;
}

export function paginateNews<T>(posts: T[], page: number, pageSize = NEWS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: posts.slice((current - 1) * pageSize, current * pageSize), current, totalPages };
}

/** "8-oktabr, 2026" for uz-Latn; falls back to the raw ISO date if the locale is unknown. */
export function formatDate(date: Date, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      date,
    );
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Calendar date in UTC, matching how front-matter dates (`2026-09-02`) are parsed. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Locale URL helpers. Pure (no Astro runtime) so they can be unit-tested. */

export interface Alternate {
  /** BCP 47 tag for the `hreflang` attribute. */
  hreflang: string;
  /** Site-relative path of the equivalent page. */
  path: string;
}

/** URL path of a locale's home page: "/" for the default locale, "/ru/" otherwise. */
export function localePath(locale: string, defaultLocale: string): string {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}

/**
 * Prefixes site-internal absolute paths ("/news/") with the locale so a copied
 * translation never links back to the default language. Anchors, external
 * URLs and paths that already carry the prefix are returned unchanged.
 */
export function localizeHref(href: string, locale: string, defaultLocale: string): string {
  if (locale === defaultLocale || !href.startsWith('/') || href.startsWith('//')) return href;
  const prefix = localePath(locale, defaultLocale);
  return href === prefix.slice(0, -1) || href.startsWith(prefix) ? href : `${prefix}${href.slice(1)}`;
}

/** Removes a leading non-default locale segment: "/ru/news/" → "/news/". */
export function stripLocale(pathname: string, locales: string[], defaultLocale: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    if (path === `/${locale}/`) return '/';
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1);
  }
  return path;
}

/**
 * Path of the page equivalent to `pathname` in another locale. News posts and
 * deeper news pages have locale-specific slugs, so they fall back to the news list.
 */
export function switchLocalePath(pathname: string, target: string, locales: string[], defaultLocale: string): string {
  let rest = stripLocale(pathname, locales, defaultLocale);
  if (/^\/news\/(page\/\d+|[^/]+)\/$/.test(rest) && !rest.endsWith('/rss.xml/')) rest = '/news/';
  return `${localePath(target, defaultLocale).slice(0, -1)}${rest}`;
}

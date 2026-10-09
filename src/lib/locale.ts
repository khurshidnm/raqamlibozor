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

/** Pure SEO helpers: titles, descriptions, robots directives, canonical URLs. */

export const MAX_DESCRIPTION = 160;

/** Applies the CMS title template: `%s` is the page title, `{siteName}` the site name. */
export function applyTitleTemplate(template: string, title: string, siteName: string): string {
  return template.replaceAll('%s', title).replaceAll('{siteName}', siteName);
}

/** Cuts text to `max` characters on a word boundary and adds an ellipsis. */
export function truncate(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

/** Value of `<meta name="robots">`. A site that is switched off in the CMS is hidden everywhere. */
export function robotsDirectives(opts: { siteIndexable: boolean; noindex?: boolean }): string {
  if (!opts.siteIndexable) return 'noindex,nofollow';
  if (opts.noindex) return 'noindex,follow';
  return 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
}

/** Canonical URL: the CMS override when set, otherwise the page's own URL. */
export function canonicalUrl(path: string, site: URL, override = ''): string {
  return override.trim() || new URL(path, site).href;
}

/** `@handle` → `@handle`; accepts a bare handle or a twitter.com / x.com URL. */
export function normalizeTwitterHandle(value: string): string {
  const match = value.trim().match(/(?:^@|(?:twitter|x)\.com\/)?@?([A-Za-z0-9_]{1,15})\/?$/);
  return match ? `@${match[1]}` : '';
}

export function robotsTxt(opts: { siteIndexable: boolean; sitemapUrl: string; extra?: string }): string {
  const lines = ['User-agent: *'];
  if (opts.siteIndexable) lines.push('Allow: /', 'Disallow: /keystatic');
  else lines.push('Disallow: /');
  const extra = (opts.extra ?? '').trim();
  if (extra) lines.push(extra);
  lines.push('');
  if (opts.siteIndexable) lines.push(`Sitemap: ${opts.sitemapUrl}`, '');
  return lines.join('\n');
}

/** XML sitemap rendering (pure). Pages are collected in src/pages/sitemap.xml.ts. */

export interface SitemapUrl {
  loc: string;
  /** ISO date (YYYY-MM-DD). Only set when the real modification date is known. */
  lastmod?: string;
  alternates?: { hreflang: string; href: string }[];
}

const escapeXml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function renderSitemap(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const alt = (u.alternates ?? [])
        .map((a) => `<xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}"/>`)
        .join('');
      const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : '';
      return `<url><loc>${escapeXml(u.loc)}</loc>${lastmod}${alt}</url>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
}

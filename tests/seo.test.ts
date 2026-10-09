import { describe, expect, it } from 'vitest';
import {
  applyTitleTemplate,
  canonicalUrl,
  normalizeTwitterHandle,
  robotsDirectives,
  robotsTxt,
  truncate,
} from '../src/lib/seo';
import { renderSitemap } from '../src/lib/sitemap';

describe('applyTitleTemplate', () => {
  it('fills %s and {siteName}', () => {
    expect(applyTitleTemplate('%s — {siteName}', 'Yangiliklar', 'Raqamli Bozor')).toBe('Yangiliklar — Raqamli Bozor');
    expect(applyTitleTemplate('{siteName} | %s', 'A', 'B')).toBe('B | A');
  });
});

describe('truncate', () => {
  it('leaves short text alone and collapses whitespace', () => {
    expect(truncate('a  b\n c', 20)).toBe('a b c');
  });
  it('cuts on a word boundary with an ellipsis and respects the limit', () => {
    const out = truncate('Kunlik haftalik va oylik tushumlar endi bitta ekranda ko‘rinadi', 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe('robotsDirectives', () => {
  it('allows rich snippets by default', () => {
    expect(robotsDirectives({ siteIndexable: true })).toContain('max-image-preview:large');
  });
  it('hides a noindex page but follows its links', () => {
    expect(robotsDirectives({ siteIndexable: true, noindex: true })).toBe('noindex,follow');
  });
  it('hides everything when the site is switched off', () => {
    expect(robotsDirectives({ siteIndexable: false })).toBe('noindex,nofollow');
  });
});

describe('canonicalUrl', () => {
  const site = new URL('https://example.com');
  it('uses the page URL unless overridden', () => {
    expect(canonicalUrl('/news/', site)).toBe('https://example.com/news/');
    expect(canonicalUrl('/news/', site, 'https://other.test/x/')).toBe('https://other.test/x/');
  });
});

describe('normalizeTwitterHandle', () => {
  it('accepts handles and profile URLs', () => {
    expect(normalizeTwitterHandle('raqamli')).toBe('@raqamli');
    expect(normalizeTwitterHandle('@raqamli')).toBe('@raqamli');
    expect(normalizeTwitterHandle('https://x.com/raqamli')).toBe('@raqamli');
    expect(normalizeTwitterHandle('not a handle!')).toBe('');
  });
});

describe('robotsTxt', () => {
  it('lists the sitemap and keeps the CMS out of search', () => {
    const txt = robotsTxt({ siteIndexable: true, sitemapUrl: 'https://x.test/sitemap.xml', extra: 'Disallow: /tmp/' });
    expect(txt).toContain('Disallow: /keystatic');
    expect(txt).toContain('Disallow: /tmp/');
    expect(txt).toContain('Sitemap: https://x.test/sitemap.xml');
  });
  it('blocks everything and omits the sitemap when indexing is off', () => {
    const txt = robotsTxt({ siteIndexable: false, sitemapUrl: 'https://x.test/sitemap.xml' });
    expect(txt).toContain('Disallow: /\n');
    expect(txt).not.toContain('Sitemap');
  });
});

describe('renderSitemap', () => {
  it('renders loc, lastmod and hreflang alternates, escaping XML', () => {
    const xml = renderSitemap([
      {
        loc: 'https://x.test/a?b=1&c=2',
        lastmod: '2026-09-02',
        alternates: [{ hreflang: 'uz-Latn', href: 'https://x.test/a' }],
      },
    ]);
    expect(xml).toContain('<loc>https://x.test/a?b=1&amp;c=2</loc>');
    expect(xml).toContain('<lastmod>2026-09-02</lastmod>');
    expect(xml).toContain('hreflang="uz-Latn"');
  });
  it('is valid for an empty site', () => {
    expect(renderSitemap([])).toContain('<urlset');
  });
});

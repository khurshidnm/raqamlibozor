import { describe, expect, it } from 'vitest';
import { buildNewsArticleJsonLd, organizationNode } from '../src/lib/jsonld';

const settings = {
  siteName: 'Raqamli Bozor',
  siteUrl: 'https://example.com',
  organization: { name: 'RealSoft', url: 'https://realsoft.uz', email: '', phone: '' },
  seo: { socials: [] as { url: string }[] },
} as never;

describe('organizationNode', () => {
  it('omits optional contact data and sameAs until they are filled in', () => {
    const node = organizationNode(settings, 'https://example.com/logo.png');
    expect(node).not.toHaveProperty('sameAs');
    expect(node).not.toHaveProperty('contactPoint');
    expect(node.logo).toBe('https://example.com/logo.png');
  });
  it('emits profiles and contact point from the CMS', () => {
    const full = {
      ...(settings as object),
      organization: { name: 'RealSoft', url: 'https://realsoft.uz', email: 'a@b.test', phone: '+998 71 000 00 00' },
      seo: { socials: [{ url: 'https://t.me/raqamli' }] },
    } as never;
    const node = organizationNode(full, 'x');
    expect(node.sameAs).toEqual(['https://t.me/raqamli']);
    expect(node.contactPoint).toMatchObject({ email: 'a@b.test', telephone: '+998 71 000 00 00' });
  });
});

describe('buildNewsArticleJsonLd', () => {
  const post = {
    data: {
      title: 'T',
      excerpt: 'E',
      publishedAt: new Date('2026-09-02T00:00:00Z'),
      updatedAt: new Date('2026-09-10T00:00:00Z'),
      author: 'Aziz',
    },
  } as never;
  const landing = { data: { lang: 'uz-Latn', news: { listTitle: 'Yangiliklar' } } } as never;
  const [article, breadcrumbs] = buildNewsArticleJsonLd({
    settings,
    landing,
    post,
    pageUrl: 'https://example.com/news/t/',
    listUrl: 'https://example.com/news/',
    coverUrl: 'https://example.com/c.jpg',
    logoUrl: 'https://example.com/logo.png',
  }) as Record<string, unknown>[];

  it('uses the real modification date and the named author', () => {
    expect(article!.dateModified).toBe('2026-09-10T00:00:00.000Z');
    expect(article!.datePublished).toBe('2026-09-02T00:00:00.000Z');
    expect(article!.author).toEqual({ '@type': 'Person', name: 'Aziz' });
  });
  it('has a three-level breadcrumb', () => {
    expect((breadcrumbs!.itemListElement as unknown[]).length).toBe(3);
  });
});

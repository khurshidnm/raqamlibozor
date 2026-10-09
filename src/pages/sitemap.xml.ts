import type { APIRoute } from 'astro';
import { getLandingEntries, getSettings, localePath } from '../lib/content';
import { getNews, isoDate, newsPath } from '../lib/news';
import { renderSitemap, type SitemapUrl } from '../lib/sitemap';

/**
 * Sitemap built from the CMS content: every indexable language home page, each news list and each
 * published post (with its real `lastmod`). `noindex` pages and drafts are left out; a site that
 * is switched off in SEO settings publishes an empty sitemap.
 */
export const GET: APIRoute = async ({ site }) => {
  const settings = await getSettings();
  const origin = site ?? new URL(settings.siteUrl);
  const abs = (path: string): string => new URL(path, origin).href;
  const entries = await getLandingEntries();
  const urls: SitemapUrl[] = [];

  if (settings.seo.indexable) {
    const homes = entries.filter((e) => !e.data.seo.noindex);
    const homeAlternates = homes.map((e) => ({
      hreflang: e.data.lang,
      href: abs(localePath(e.id, settings.defaultLocale)),
    }));
    const listAlternates = homes.map((e) => ({
      hreflang: e.data.lang,
      href: abs(newsPath(e.id, settings.defaultLocale)),
    }));

    for (const e of homes) {
      urls.push({ loc: abs(localePath(e.id, settings.defaultLocale)), alternates: homeAlternates });
    }
    for (const e of homes) {
      const posts = (await getNews(e.id)).filter((p) => !p.data.seo.noindex);
      if (!posts.length) continue;
      urls.push({
        loc: abs(newsPath(e.id, settings.defaultLocale)),
        lastmod: isoDate(
          posts.reduce(
            (latest, p) =>
              (p.data.updatedAt ?? p.data.publishedAt) > latest ? (p.data.updatedAt ?? p.data.publishedAt) : latest,
            posts[0]!.data.publishedAt,
          ),
        ),
        alternates: listAlternates,
      });
      for (const p of posts) {
        urls.push({
          loc: p.data.seo.canonical || abs(newsPath(e.id, settings.defaultLocale, p.id)),
          lastmod: isoDate(p.data.updatedAt ?? p.data.publishedAt),
        });
      }
    }
  }

  return new Response(renderSitemap(urls), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

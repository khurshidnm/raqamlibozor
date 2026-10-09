import type { APIRoute } from 'astro';
import { getSettings } from '../lib/content';
import { robotsTxt } from '../lib/seo';

export const GET: APIRoute = async ({ site }) => {
  const settings = await getSettings();
  const origin = site ?? new URL(settings.siteUrl);
  const body = robotsTxt({
    siteIndexable: settings.seo.indexable,
    sitemapUrl: new URL('sitemap.xml', origin).href,
    extra: settings.seo.robotsExtra,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

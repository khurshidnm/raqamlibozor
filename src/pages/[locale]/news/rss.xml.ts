import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getLandingEntries, getSettings } from '../../../lib/content';
import { getNews, newsPath } from '../../../lib/news';

export async function getStaticPaths() {
  const settings = await getSettings();
  const entries = await getLandingEntries();
  return entries
    .filter((entry) => entry.id !== settings.defaultLocale)
    .map((entry) => ({ params: { locale: entry.id }, props: { landing: entry, settings } }));
}

/** RSS feed of one non-default locale's news. */
export const GET: APIRoute = async ({ site, props }) => {
  const { landing, settings } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];
  const posts = await getNews(landing.id);
  return rss({
    title: `${settings.siteName} — ${landing.data.news.listTitle}`,
    description: landing.data.news.listDescription,
    site: site ?? settings.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.publishedAt,
      link: newsPath(landing.id, settings.defaultLocale, post.id),
    })),
    customData: `<language>${landing.data.lang}</language>`,
  });
};

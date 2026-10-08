import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getLanding, getSettings } from '../../lib/content';
import { getNews, newsPath } from '../../lib/news';

/** RSS feed of the default-locale news. */
export const GET: APIRoute = async ({ site }) => {
  const settings = await getSettings();
  const landing = await getLanding(settings.defaultLocale);
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

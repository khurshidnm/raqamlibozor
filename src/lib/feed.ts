import rss from '@astrojs/rss';
import { getLanding, getSettings } from './content';
import { getNews, newsPath } from './news';

/** RSS feed of one locale's published news. */
export async function newsFeed(locale: string, site: URL | undefined) {
  const settings = await getSettings();
  const landing = await getLanding(locale);
  const posts = (await getNews(locale)).filter((post) => !post.data.seo.noindex);
  return rss({
    title: `${settings.siteName} — ${landing.data.news.listTitle}`,
    description: landing.data.news.listDescription,
    site: site ?? settings.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.publishedAt,
      link: newsPath(locale, settings.defaultLocale, post.id),
      ...(post.data.author ? { author: post.data.author } : {}),
    })),
    customData: `<language>${landing.data.lang}</language>`,
  });
}

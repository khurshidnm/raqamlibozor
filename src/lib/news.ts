import { getCollection, type CollectionEntry } from 'astro:content';
export { NEWS_PAGE_SIZE, formatDate, isoDate, newsPath, paginateNews } from './news-utils';

export type NewsPost = CollectionEntry<'news'>;

/** Published posts for a locale, newest first. Drafts are visible in `astro dev` only. */
export async function getNews(locale: string): Promise<NewsPost[]> {
  const posts = await getCollection(
    'news',
    (post) => post.data.locale === locale && (import.meta.env.DEV || !post.data.draft),
  );
  return posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

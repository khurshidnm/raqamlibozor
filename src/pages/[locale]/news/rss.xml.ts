import type { APIRoute, GetStaticPaths } from 'astro';
import { getLandingEntries, getSettings } from '../../../lib/content';
import { newsFeed } from '../../../lib/feed';

export const getStaticPaths = (async () => {
  const settings = await getSettings();
  return (await getLandingEntries())
    .filter((entry) => entry.id !== settings.defaultLocale)
    .map((entry) => ({ params: { locale: entry.id } }));
}) satisfies GetStaticPaths;

/** RSS feed of a non-default locale's news, at /<locale>/news/rss.xml. */
export const GET: APIRoute = ({ params, site }) => newsFeed(params.locale!, site);

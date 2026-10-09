import type { APIRoute } from 'astro';
import { getSettings } from '../../lib/content';
import { newsFeed } from '../../lib/feed';

/** RSS feed of the default-locale news. */
export const GET: APIRoute = async ({ site }) => newsFeed((await getSettings()).defaultLocale, site);

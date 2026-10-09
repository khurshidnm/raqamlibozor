import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { landingSchema, marketSchema, mediaSchema, newsSchema, settingsSchema } from './content/schema';

/** Asset library synced from the CMS. `image()` turns the stored path into an optimisable import. */
const media = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/media' }),
  schema: ({ image }) => mediaSchema(image()),
});

/** One entry per locale; the file name is the locale code and the URL prefix. */
const landing = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/landing' }),
  schema: landingSchema(reference('media')),
});

/** News posts: Markdown files with front matter, synced from the CMS. Drafts are hidden in production builds. */
const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/news' }),
  schema: newsSchema(reference('media')),
});

/** Markets on the /bozorlar/ map: one JSON file per market, synced from the CMS. */
const markets = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/markets' }),
  schema: marketSchema,
});

const settings = defineCollection({
  loader: glob({ pattern: 'settings.json', base: './src/content' }),
  schema: settingsSchema(reference('media')),
});

export const collections = { media, landing, news, markets, settings };

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Landing = CollectionEntry<'landing'>;
export type Settings = CollectionEntry<'settings'>['data'];
export type MediaRef = { collection: 'media'; id: string };
export type Media = CollectionEntry<'media'>['data'];

export async function getSettings(): Promise<Settings> {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('src/content/settings.json is missing');
  return entry.data;
}

export async function getLandingEntries(): Promise<Landing[]> {
  return getCollection('landing');
}

export async function getLanding(locale: string): Promise<Landing> {
  const entry = await getEntry('landing', locale);
  if (!entry)
    throw new Error(`No landing page content for locale "${locale}" (expected src/content/landing/${locale}.json)`);
  return entry;
}

/** Resolves a media reference; fails the build with a readable message when the asset is missing. */
export async function getMedia(ref: MediaRef): Promise<Media> {
  const entry = await getEntry(ref);
  if (!entry) throw new Error(`Media "${ref.id}" is referenced but src/content/media/${ref.id}.json does not exist`);
  return entry.data;
}

export { localePath } from './locale';

/**
 * One-off (re-runnable) import of the existing site content into the CMS:
 * `npm run import` from cms/. Existing documents (same slug/locale) are updated, never duplicated.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { getPayload, type Payload, type RichTextField } from 'payload';
import { parse as parseYaml } from 'yaml';
import config from '../src/payload.config';
import { mediaKeys, repoRoot } from './shared';

const content = path.join(repoRoot, 'src/content');
const readJson = async (file: string) => JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
const names = async (dir: string, ext: string) =>
  (await readdir(dir)).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length));

async function upsert(
  payload: Payload,
  collection: 'media' | 'landing' | 'news' | 'markets',
  field: string,
  value: string,
  data: Record<string, unknown>,
  filePath?: string,
) {
  const found = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
    draft: true,
  });
  const existing = found.docs[0];
  if (existing) {
    await payload.update({ collection, id: existing.id, data: data as never, ...(filePath ? { filePath } : {}) });
    return existing.id;
  }
  const created = await payload.create({ collection, data: data as never, ...(filePath ? { filePath } : {}) });
  return created.id;
}

/** Replaces media ids by relationship ids and wraps string lists into rows. */
function toCms(value: unknown, mediaIds: Map<string, number | string>, key = ''): unknown {
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string')) return value.map((v) => ({ value: v }));
    return value.map((v) => toCms(v, mediaIds));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toCms(v, mediaIds, k)]));
  }
  if (mediaKeys.has(key) && typeof value === 'string') {
    const id = mediaIds.get(value);
    if (id === undefined) throw new Error(`Unknown media id "${value}"`);
    return id;
  }
  return value;
}

const payload = await getPayload({ config });

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const users = await payload.find({ collection: 'users', limit: 1 });
  if (!users.totalDocs) {
    await payload.create({
      collection: 'users',
      data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, roles: ['admin'] },
    });
    console.log('Created admin user', process.env.ADMIN_EMAIL);
  }
}

const mediaIds = new Map<string, number | string>();
for (const slug of await names(path.join(content, 'media'), '.json')) {
  const item = await readJson(path.join(content, 'media', `${slug}.json`));
  const file = path.join(repoRoot, String(item.image).replace(/^\//, ''));
  const id = await upsert(payload, 'media', 'slug', slug, { title: item.title, slug, alt: item.alt ?? '' }, file);
  mediaIds.set(slug, id);
}
console.log(`media: ${mediaIds.size}`);

const settings = await readJson(path.join(content, 'settings.json'));
await payload.updateGlobal({ slug: 'settings', data: toCms(settings, mediaIds) as never });
console.log('settings: ok');

let count = 0;
for (const locale of await names(path.join(content, 'landing'), '.json')) {
  const page = await readJson(path.join(content, 'landing', `${locale}.json`));
  await upsert(payload, 'landing', 'locale', locale, {
    locale,
    ...(toCms(page, mediaIds) as object),
    _status: 'published',
  });
  count++;
}
console.log(`landing: ${count}`);

count = 0;
for (const slug of await names(path.join(content, 'markets'), '.json')) {
  const market = await readJson(path.join(content, 'markets', `${slug}.json`));
  await upsert(payload, 'markets', 'slug', slug, { slug, ...market });
  count++;
}
console.log(`markets: ${count}`);

const bodyField = payload.collections.news.config.fields.find((f) => 'name' in f && f.name === 'body') as RichTextField;
const editorConfig = editorConfigFactory.fromField({ field: bodyField });
count = 0;
for (const slug of await names(path.join(content, 'news'), '.md')) {
  const raw = await readFile(path.join(content, 'news', `${slug}.md`), 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`${slug}.md has no front matter`);
  const meta = parseYaml(match[1]!) as Record<string, unknown>;
  const date =
    meta.publishedAt instanceof Date ? meta.publishedAt.toISOString().slice(0, 10) : String(meta.publishedAt);
  await upsert(payload, 'news', 'slug', slug, {
    slug,
    title: meta.title,
    locale: meta.locale,
    publishedAt: `${date}T12:00:00.000Z`,
    excerpt: meta.excerpt,
    cover: mediaIds.get(String(meta.cover)),
    body: convertMarkdownToLexical({ editorConfig, markdown: match[2]!.trim() }),
    _status: meta.draft ? 'draft' : 'published',
  });
  count++;
}
console.log(`news: ${count}`);
process.exit(0);

/**
 * Writes the published CMS content into the Astro project (src/content/*, src/assets/media/*).
 * `npm run content:pull` from the repository root. CONTENT_ROOT=/tmp/x writes elsewhere (round-trip checks).
 */
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { getPayload, type RichTextField } from 'payload';
import { stringify as stringifyYaml } from 'yaml';
import config from '../src/payload.config';
import { contentRoot, mediaKeys } from './shared';

const content = path.join(contentRoot, 'src/content');
const assets = path.join(contentRoot, 'src/assets/media');
const mediaDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../media');
const emptyStrings = new Set(['href', 'alt', 'demoEndpoint', 'note']);

/** Drops CMS bookkeeping, resolves media relations to ids and unwraps string lists. */
function toSite(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    if (
      key === 'items' &&
      value.length &&
      value.every((v) => v && typeof v === 'object' && Object.keys(v).join() === 'value,id')
    ) {
      return value.map((v) => (v as { value: string }).value);
    }
    return value.map((v) => toSite(v));
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (mediaKeys.has(key) && typeof object.slug === 'string') return object.slug;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(object)) {
      if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === '_status' || k === 'globalType') continue;
      if (v === null || v === undefined) {
        if (emptyStrings.has(k)) out[k] = '';
        continue;
      }
      out[k] = toSite(v, k);
    }
    return out;
  }
  return value;
}

const writeJson = (file: string, data: unknown) => writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

const payload = await getPayload({ config });
const all = async (collection: 'landing' | 'news' | 'markets' | 'media') =>
  (
    (await payload.find({ collection, limit: 0, pagination: false, depth: 2 })).docs as unknown as Record<
      string,
      unknown
    >[]
  ).filter((doc) => doc._status !== 'draft');

for (const dir of ['landing', 'news', 'markets', 'media']) {
  await rm(path.join(content, dir), { recursive: true, force: true });
  await mkdir(path.join(content, dir), { recursive: true });
}
await rm(assets, { recursive: true, force: true });

const media = await all('media');
for (const item of media) {
  const slug = String(item.slug);
  const ext = path.extname(String(item.filename)).toLowerCase();
  await mkdir(path.join(assets, slug), { recursive: true });
  await copyFile(path.join(mediaDir, String(item.filename)), path.join(assets, slug, `image${ext}`));
  await writeJson(path.join(content, 'media', `${slug}.json`), {
    title: item.title,
    image: `/src/assets/media/${slug}/image${ext}`,
    alt: item.alt ?? '',
  });
}

for (const page of await all('landing')) {
  const { locale, ...rest } = toSite(page) as Record<string, unknown>;
  await writeJson(path.join(content, 'landing', `${locale}.json`), rest);
}

for (const market of await all('markets')) {
  const { slug, ...rest } = toSite(market) as Record<string, unknown>;
  await writeJson(path.join(content, 'markets', `${slug}.json`), rest);
}

const bodyField = payload.collections.news.config.fields.find((f) => 'name' in f && f.name === 'body') as RichTextField;
const editorConfig = editorConfigFactory.fromField({ field: bodyField });
for (const post of await all('news')) {
  const body = convertLexicalToMarkdown({ data: post.body as never, editorConfig }).trim();
  const front = stringifyYaml(
    {
      title: post.title,
      locale: post.locale,
      publishedAt: String(post.publishedAt).slice(0, 10),
      excerpt: post.excerpt,
      cover: (post.cover as { slug: string }).slug,
      draft: false,
    },
    { lineWidth: 0 },
  );
  await writeFile(path.join(content, 'news', `${post.slug}.md`), `---\n${front}---\n\n${body}\n`, 'utf8');
}

const settings = toSite(await payload.findGlobal({ slug: 'settings', depth: 2 }));
await writeJson(path.join(content, 'settings.json'), settings);

console.log(`Pulled: ${media.length} media, landing, markets, news, settings → ${contentRoot}`);
process.exit(0);

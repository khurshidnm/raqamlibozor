/**
 * Validates the CMS files the same way Astro will at build time, plus a few
 * project rules (media references resolve to files, Uzbek apostrophes are the
 * correct Unicode characters, links are well-formed).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  landingFileSchema,
  marketFileSchema,
  mediaFileSchema,
  newsFileSchema,
  regionIds,
  settingsFileSchema,
  type LandingFile,
} from '../src/content/schema';

const root = resolve(import.meta.dirname, '..');
const readJson = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T;

const mediaIds = readdirSync(join(root, 'src/content/media'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5));
const landingFiles = readdirSync(join(root, 'src/content/landing')).filter((f) => f.endsWith('.json'));
const newsFiles = readdirSync(join(root, 'src/content/news')).filter((f) => f.endsWith('.md'));
const marketFiles = readdirSync(join(root, 'src/content/markets')).filter((f) => f.endsWith('.json'));

describe('settings.json', () => {
  const settings = settingsFileSchema.parse(readJson('src/content/settings.json'));
  it('references an existing default locale', () => {
    expect(landingFiles).toContain(`${settings.defaultLocale}.json`);
  });
  it('references an existing social image', () => {
    expect(mediaIds).toContain(settings.socialImage);
  });
  it('ships the configured number of globe frames', () => {
    for (let i = 0; i < settings.globeFrames; i++) {
      expect(existsSync(join(root, 'public/earth', `earth-${String(i).padStart(2, '0')}.webp`))).toBe(true);
    }
  });
});

describe('media library', () => {
  it.each(mediaIds)('%s points to an existing file under src/assets', (id) => {
    const media = mediaFileSchema.parse(readJson(`src/content/media/${id}.json`));
    expect(media.image.startsWith('/src/assets/')).toBe(true);
    expect(existsSync(join(root, media.image))).toBe(true);
  });
});

/** Collects every media reference in a landing entry. */
function mediaRefs(data: LandingFile): string[] {
  return [
    data.seo.ogImage,
    ...data.hero.slides.flatMap((s) => [s.image, s.imageMobile]),
    ...data.solutions.cards.map((c) => c.image),
    ...data.steps.items.map((s) => s.icon),
    data.contact.image,
  ];
}

/** Every string value in a JSON tree. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe.each(landingFiles)('landing/%s', (file) => {
  const raw = readJson<unknown>(`src/content/landing/${file}`);
  const data = landingFileSchema.parse(raw);

  it('references media that exist', () => {
    for (const ref of mediaRefs(data)) expect(mediaIds, `media "${ref}"`).toContain(ref);
  });

  it('uses only anchors or absolute URLs for links', () => {
    const links = [
      ...data.nav.links,
      data.nav.cta,
      ...data.hero.buttons,
      data.solutions.cta,
      data.markets.cta,
      data.map.invitation.cta,
      ...data.footer.columns.flatMap((c) => c.links),
      data.footer.madeBy,
    ];
    for (const link of links) {
      if (!link.href) continue;
      expect(link.href, `link "${link.label}"`).toMatch(/^(#[\w-]+|https?:\/\/\S+|\/\S*)$/);
    }
  });

  it('every in-page anchor has a matching section id', () => {
    const sectionIds = [
      'bosh-sahifa',
      'haqimizda',
      'imkoniyatlar',
      'yechimlar',
      'joriy-etish',
      'bozorlar',
      'yangiliklar',
      'savollar',
      'boglanish',
    ];
    const anchors = strings(raw).filter((s) => /^#[\w-]+$/.test(s));
    for (const a of anchors) expect(sectionIds, `anchor ${a}`).toContain(a.slice(1));
  });

  if (file.startsWith('uz')) {
    it('uses the correct Uzbek apostrophes (ʻ U+02BB for oʻ/gʻ, ʼ U+02BC for the glottal stop)', () => {
      const text = strings(raw).join('\n');
      expect(text, "typographic quotes ‘ ’ or ASCII ' must not be used as Uzbek letters").not.toMatch(/[A-Za-z][‘’']/);
      expect(text).toMatch(/[og]ʻ/);
    });
  }
});

describe('markets', () => {
  it('has at least one market on the map', () => {
    expect(marketFiles.length).toBeGreaterThan(0);
  });
  it.each(marketFiles)('%s is valid', (file) => {
    expect(file, 'file slug').toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.json$/);
    const market = marketFileSchema.parse(readJson(`src/content/markets/${file}`));
    expect(regionIds).toContain(market.region);
    expect(typeof market.x === 'number', 'set both coordinates or neither').toBe(typeof market.y === 'number');
  });
});

/** Splits a Markdown file into YAML front matter and body. */
function splitFrontMatter(raw: string): { data: unknown; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('missing front matter');
  return { data: parseYaml(match[1] ?? ''), body: match[2] ?? '' };
}

describe.each(newsFiles)('news/%s', (file) => {
  const raw = readFileSync(join(root, 'src/content/news', file), 'utf8');
  const { data: frontMatter, body } = splitFrontMatter(raw);
  const data = newsFileSchema.parse(frontMatter);

  it('uses a URL-safe file name', () => {
    expect(file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.md$/);
  });
  it('references a cover in the media library and an existing locale', () => {
    expect(mediaIds).toContain(data.cover);
    expect(landingFiles).toContain(`${data.locale}.json`);
  });
  it('has a plain-Markdown body (no Markdoc tags, Astro renders it natively)', () => {
    expect(body.trim().length).toBeGreaterThan(50);
    expect(body).not.toMatch(/\{%/);
  });
  if (data.locale === 'uz') {
    it('uses the correct Uzbek apostrophes', () => {
      expect(raw).not.toMatch(/[A-Za-z][‘’']/);
    });
  }
});

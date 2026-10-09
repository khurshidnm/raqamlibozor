import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { buildExtras } from './src/integrations/build-extras';

/* ------------------------------------------------------------------ *
 * Site-wide values come from the content files (synced from the Payload CMS) so there is one source of
 * truth. `SITE_URL` can override the deployed origin per environment.
 * ------------------------------------------------------------------ */
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;

const settings = read<{ siteUrl: string; defaultLocale: string }>('./src/content/settings.json');
const locales = readdirSync(new URL('./src/content/landing/', import.meta.url))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.slice(0, -'.json'.length));
const localeLangs = Object.fromEntries(
  locales.map((locale) => [locale, read<{ lang: string }>(`./src/content/landing/${locale}.json`).lang]),
);

const site = process.env.SITE_URL || settings.siteUrl;

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  /*
   * Locales are handled by src/pages/[locale]/index.astro and lib/content.ts rather than
   * Astro's `i18n` option: the site is fully static and hreflang links are generated in Base.astro.
   */
  build: {
    // External stylesheets keep the generated Content-Security-Policy strict (see src/integrations/build-extras.ts).
    inlineStylesheets: 'never',
  },
  integrations: [
    react(),
    sitemap({ i18n: { defaultLocale: settings.defaultLocale, locales: localeLangs } }),
    buildExtras(),
  ],
});

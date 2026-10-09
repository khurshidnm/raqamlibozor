import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import { buildExtras } from './src/integrations/build-extras';

/* ------------------------------------------------------------------ *
 * Site-wide values come from the CMS files so there is one source of
 * truth. `SITE_URL` can override the deployed origin per environment.
 * ------------------------------------------------------------------ */
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;

const settings = read<{ siteUrl: string }>('./src/content/settings.json');
const site = process.env.SITE_URL || settings.siteUrl;

/**
 * Keystatic's admin UI and API are server routes. They are enabled for
 * `astro dev` (local editing, writes straight to the content files) and
 * for builds that set KEYSTATIC=true together with a server adapter
 * (hosted editing in GitHub mode). A plain `astro build` stays 100% static.
 */
function cms(): AstroIntegration {
  return {
    name: 'raqamli-bozor:cms',
    hooks: {
      'astro:config:setup': ({ command, updateConfig, logger }) => {
        const enabled = command === 'dev' || process.env.KEYSTATIC === 'true';
        if (!enabled) return;
        logger.info('Keystatic admin enabled at /keystatic');
        updateConfig({ integrations: [react(), keystatic()] });
      },
    },
  };
}

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  /*
   * Locales are handled by src/pages/[locale]/index.astro and lib/content.ts rather than
   * Astro's `i18n` option: the site is fully static, hreflang links are generated in Base.astro,
   * and Astro's i18n middleware 404s any dev URL containing a locale segment, which breaks
   * Keystatic's /keystatic/collection/landing/item/uz page.
   */
  build: {
    // External stylesheets keep the generated Content-Security-Policy strict (see src/integrations/build-extras.ts).
    inlineStylesheets: 'never',
  },
  integrations: [cms(), buildExtras()],
});

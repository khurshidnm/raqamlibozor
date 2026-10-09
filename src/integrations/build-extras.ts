import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { PAGE_ZOOM_INLINE } from '../lib/inline-scripts';
import { settingsFileSchema, type TrackingSettings } from '../content/schema';
import { trackingCspSources } from '../lib/tracking';
import { launchIssues } from './launch-checks';

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('base64');

/** Netlify / Cloudflare Pages `_headers`; other hosts can copy the values into their config. */
function headersFile(scriptHashes: string[], tracking: TrackingSettings): string {
  const extra = trackingCspSources(tracking);
  const list = (base: string, more: string[]): string => [base, ...more].join(' ');
  const csp = [
    "default-src 'self'",
    list(`script-src 'self' ${scriptHashes.map((h) => `'sha256-${h}'`).join(' ')}`, extra.script),
    "style-src 'self' 'unsafe-inline'",
    list("img-src 'self' data:", extra.img),
    "font-src 'self'",
    list("connect-src 'self' https:", extra.connect),
    ...(extra.frame.length ? [list("frame-src 'self'", extra.frame)] : []),
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
  return [
    '# Generated at build time by src/integrations/build-extras.ts — do not edit in dist.',
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    `  Content-Security-Policy: ${csp}`,
    '',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/earth/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/fonts/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/icons/*',
    '  Cache-Control: public, max-age=604800',
    '',
  ].join('\n');
}

/**
 * Bodies of executable inline `<script>` elements (no `src`, not JSON data). Browsers need their
 * hashes in the Content-Security-Policy.
 */
export function inlineScripts(html: string): string[] {
  const found: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    if (/\bsrc\s*=/i.test(attrs) || !body.trim()) continue;
    if (/\btype\s*=\s*["']?(application\/(ld\+)?json|importmap|speculationrules)/i.test(attrs)) continue;
    found.push(body);
  }
  return found;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * 1. Writes `_headers` with a strict CSP whose script hashes match the inline scripts actually emitted.
 * 2. Reports release-readiness problems (missing form endpoint / site URL); `STRICT_BUILD=true` turns them into a failed build.
 * 3. Removes optimised/original images under `_astro/` that no HTML, CSS or JS references
 *    (the content layer emits every source image even when only derived sizes are used).
 */
export function buildExtras(): AstroIntegration {
  return {
    name: 'raqamli-bozor:build-extras',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = walk(out);
        const textFiles = files.filter((f) => /\.(html|css|js|xml|txt|webmanifest)$/.test(f));
        const text = textFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
        /* Settings are parsed with the CMS schema so tracking ids and allow-lists get their defaults. */
        const rawSettings: unknown = JSON.parse(
          readFileSync(fileURLToPath(new URL('../content/settings.json', import.meta.url)), 'utf8'),
        );
        const settings = settingsFileSchema.parse(rawSettings);

        /*
         * CSP: hash every inline script in the HTML (page-zoom, Astro's island runtime, enabled analytics
         * snippets, CMS custom code). Only HTML is scanned; JS bundles (React DOM) contain "<script>" as code.
         */
        const html = textFiles.filter((f) => f.endsWith('.html')).map((f) => readFileSync(f, 'utf8'));
        const inline = new Set(html.flatMap(inlineScripts));
        if (!inline.has(PAGE_ZOOM_INLINE)) {
          throw new Error(
            'The page-zoom inline script is missing or was rewritten by the compiler (see src/lib/inline-scripts.ts).',
          );
        }
        writeFileSync(join(out, '_headers'), headersFile([...inline].map(sha256), settings.tracking));
        logger.info(`_headers written with ${inline.size} inline script hash(es)`);

        /* Release checks: warn locally, fail the build for production deploys that set STRICT_BUILD=true. */
        const issues = launchIssues(process.env, settings);
        for (const issue of issues) logger.warn(issue);
        if (issues.length && process.env.STRICT_BUILD === 'true') {
          throw new Error(`STRICT_BUILD: ${issues.length} release check(s) failed:\n- ${issues.join('\n- ')}`);
        }

        /* Prune unreferenced images. */
        let pruned = 0;
        let bytes = 0;
        for (const file of files) {
          const rel = relative(out, file);
          if (!/^_astro\/.+\.(png|jpe?g|webp|avif|gif|svg)$/.test(rel)) continue;
          const name = rel.slice('_astro/'.length);
          if (text.includes(name)) continue;
          bytes += statSync(file).size;
          unlinkSync(file);
          pruned++;
        }
        logger.info(`pruned ${pruned} unreferenced image(s), ${(bytes / 1024 / 1024).toFixed(1)} MB`);
      },
    },
  };
}

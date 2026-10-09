import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { HEAD_INLINE } from '../lib/inline-scripts';
import { launchIssues, type LaunchSettings } from './launch-checks';

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('base64');

/** The two small scripts Astro inlines on pages with a client island (`Astro.load` + the `astro-island` element). */
const isAstroIslandRuntime = (script: string): boolean =>
  /customElements\.define\(["'`]astro-island["'`]/.test(script) ||
  /dispatchEvent\(new Event\(["'`]astro:load["'`]\)\)/.test(script);

/** Netlify / Cloudflare Pages `_headers`; other hosts can copy the values into their config. */
function headersFile(scriptHashes: string[]): string {
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.map((h) => `'sha256-${h}'`).join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https:",
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
        /* Only HTML can carry inline scripts; JS bundles (React DOM) contain "<script>" as code. */
        const html = textFiles
          .filter((f) => f.endsWith('.html'))
          .map((f) => readFileSync(f, 'utf8'))
          .join('\n');

        /*
         * CSP: every inline script must be one we know — our page-zoom snippet (verified
         * byte-for-byte) or Astro's island runtime — and each one is hashed into the policy.
         */
        const inline = new Set<string>([HEAD_INLINE]);
        for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) inline.add(match[1] ?? '');
        for (const script of inline) {
          if (script !== HEAD_INLINE && !isAstroIslandRuntime(script)) {
            throw new Error(
              `Unexpected inline <script> in the build output; add it to src/lib/inline-scripts.ts:\n${script}`,
            );
          }
        }
        writeFileSync(join(out, '_headers'), headersFile([...inline].map(sha256)));
        logger.info(`_headers written with ${inline.size} inline script hash(es)`);

        /* Release checks: warn locally, fail the build for production deploys that set STRICT_BUILD=true. */
        const settings = JSON.parse(
          readFileSync(fileURLToPath(new URL('../content/settings.json', import.meta.url)), 'utf8'),
        ) as LaunchSettings;
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

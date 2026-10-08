import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { PAGE_ZOOM_INLINE } from '../lib/inline-scripts';

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('base64');

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
 * 2. Removes optimised/original images under `_astro/` that no HTML, CSS or JS references
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

        /* CSP: verify the inline script survived the compiler byte-for-byte, then hash it. */
        const inline = new Set<string>();
        for (const match of text.matchAll(/<script>([\s\S]*?)<\/script>/g)) inline.add(match[1] ?? '');
        for (const script of inline) {
          if (script !== PAGE_ZOOM_INLINE) {
            throw new Error(
              `Unexpected inline <script> in the build output; add it to src/lib/inline-scripts.ts:\n${script}`,
            );
          }
        }
        writeFileSync(join(out, '_headers'), headersFile([sha256(PAGE_ZOOM_INLINE)]));
        logger.info(`_headers written with ${inline.size} inline script hash(es)`);

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

// Generates the raster icon set from public/favicon.svg (run: npm run icons)
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const svg = await readFile(resolve(root, 'public/favicon.svg'));
const out = resolve(root, 'public/icons');
await mkdir(out, { recursive: true });

const BRAND_BG = { r: 255, g: 255, b: 255, alpha: 1 };

/** Render the mark at `size`, with `pad` px of background around it. */
async function render(file, size, pad, background) {
  const inner = size - pad * 2;
  const mark = await sharp(svg, { density: 600 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(out, file));
  console.log('wrote public/icons/' + file);
}

await render('favicon-32.png', 32, 2, { r: 0, g: 0, b: 0, alpha: 0 });
await render('favicon-16.png', 16, 1, { r: 0, g: 0, b: 0, alpha: 0 });
await render('apple-touch-icon.png', 180, 24, BRAND_BG);
await render('icon-192.png', 192, 24, BRAND_BG);
await render('icon-512.png', 512, 64, BRAND_BG);
await render('icon-maskable-512.png', 512, 110, BRAND_BG);

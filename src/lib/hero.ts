import { getImage } from 'astro:assets';
import type { Placement } from '../content/schema';
import type { Preload } from '../layouts/Base.astro';
import type { HeroData, SlideData, SlideVariant } from '../scripts/hero-slider';
import { getMedia, type Landing, type MediaRef } from './content';

/** Builds a responsive WebP variant sized for its placement (1x and 2x, never upscaled). */
async function variant(ref: MediaRef, p: Placement): Promise<SlideVariant> {
  const media = await getMedia(ref);
  const natural = media.image.width;
  const widths = [...new Set([Math.min(p.width, natural), Math.min(p.width * 2, natural)])];
  const img = await getImage({ src: media.image, format: 'webp', width: widths[0], widths, sizes: `${p.width}px` });
  return {
    src: img.src,
    srcset: img.srcSet.attribute,
    sizes: `${p.width}px`,
    width: Number(img.attributes.width),
    height: Number(img.attributes.height),
    w: p.width,
    x: p.x,
    y: p.y,
  };
}

export async function buildHeroData(landing: Landing): Promise<HeroData> {
  const { hero, a11y } = landing.data;
  const slides: SlideData[] = await Promise.all(
    hero.slides.map(async (s) => ({
      title: s.title,
      tags: s.tags,
      d: await variant(s.image, s.desktop),
      m: await variant(s.imageMobile, s.mobile),
    })),
  );
  return { slides, intervalMs: hero.intervalMs, labels: { pause: a11y.sliderPause, play: a11y.sliderPlay } };
}

/** Preload hints for the first slide, one per breakpoint. */
export function heroPreloads(data: HeroData): Preload[] {
  const first = data.slides[0];
  if (!first) return [];
  return [
    { imagesrcset: first.d.srcset, imagesizes: first.d.sizes, media: '(min-width: 810px)' },
    { imagesrcset: first.m.srcset, imagesizes: first.m.sizes, media: '(max-width: 809.98px)' },
  ];
}

import { getCollection, type CollectionEntry } from 'astro:content';
import { SHAPES } from '../components/map/shapes';
import type { MapMarket } from '../components/map/UzbekistanMarketMap';
import type { RegionId } from '../content/regions';
import { localePath } from './content';

export type MarketEntry = CollectionEntry<'markets'>;
export type { MapMarket };

export async function getMarkets(): Promise<MarketEntry[]> {
  return getCollection('markets');
}

/** URL of the markets map page: /bozorlar/ (locale-prefixed when needed). */
export function marketsPath(locale: string, defaultLocale: string): string {
  return `${localePath(locale, defaultLocale)}bozorlar/`;
}

/**
 * Resolves every market to a map position, sorted by name within a region.
 * Entries without coordinates are spread around their region's label point so a
 * market added in the CMS shows up right away; editors can then read exact
 * coordinates from the page's picker mode (`/bozorlar/?pick`) and fill them in.
 */
export function placeMarkets(entries: MarketEntry[]): MapMarket[] {
  const sorted = [...entries].sort(
    (a, b) => a.data.region.localeCompare(b.data.region) || a.data.name.localeCompare(b.data.name, 'uz'),
  );
  const unplaced = new Map<RegionId, number>();
  return sorted.map((entry) => {
    const { name, region, kind, branch, x, y } = entry.data;
    const placed = typeof x === 'number' && typeof y === 'number';
    if (placed) return { id: entry.id, name, region, kind, branch, x, y, placed };
    const shape = SHAPES.find((s) => s.id === region);
    const [lx = 0, ly = 0] = shape?.lp ?? [];
    const i = unplaced.get(region) ?? 0;
    unplaced.set(region, i + 1);
    /* Sunflower spiral: distinct points that stay close to the label. */
    const angle = i * 2.4;
    const radius = i === 0 ? 0 : 5 + 3 * Math.sqrt(i);
    return {
      id: entry.id,
      name,
      region,
      kind,
      branch,
      x: Math.round((lx + Math.cos(angle) * radius) * 100) / 100,
      y: Math.round((ly + Math.sin(angle) * radius) * 100) / 100,
      placed,
    };
  });
}

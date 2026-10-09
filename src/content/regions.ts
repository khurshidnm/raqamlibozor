/**
 * Fixed ids of the map regions (they match the outlines in src/components/map/shapes.ts)
 * and the market types. Dependency-free so both the Zod schema and the Keystatic
 * config can import it. Visitor-facing names live in the CMS (landing → map).
 */
export const regionIds = [
  'andijan',
  'bukhara',
  'fergana',
  'jizzakh',
  'namangan',
  'navoi',
  'kashkadarya',
  'karakalpakstan',
  'samarkand',
  'syrdarya',
  'surkhandarya',
  'tashkent-city',
  'tashkent',
  'khorezm',
] as const;
export type RegionId = (typeof regionIds)[number];

/** Editor-facing labels for the admin UI only. */
export const regionLabels: Record<RegionId, string> = {
  andijan: 'Andijon viloyati',
  bukhara: 'Buxoro viloyati',
  fergana: 'Fargʻona viloyati',
  jizzakh: 'Jizzax viloyati',
  namangan: 'Namangan viloyati',
  navoi: 'Navoiy viloyati',
  kashkadarya: 'Qashqadaryo viloyati',
  karakalpakstan: 'Qoraqalpogʻiston Respublikasi',
  samarkand: 'Samarqand viloyati',
  syrdarya: 'Sirdaryo viloyati',
  surkhandarya: 'Surxondaryo viloyati',
  'tashkent-city': 'Toshkent shahri',
  tashkent: 'Toshkent viloyati',
  khorezm: 'Xorazm viloyati',
};

export const marketKinds = ['dehqon', 'buyum', 'avtomobil'] as const;
export type MarketKind = (typeof marketKinds)[number];

/** Editor-facing labels for the admin UI only. */
export const marketKindLabels: Record<MarketKind, string> = {
  dehqon: 'Dehqon bozori',
  buyum: 'Buyum bozori',
  avtomobil: 'Avtomobil bozori',
};

/** Map units of the full map (see components/map/shapes.ts BASE); market coordinates must stay inside. */
export const mapBounds = { x: [-65, 1065], y: [-20, 730] } as const;

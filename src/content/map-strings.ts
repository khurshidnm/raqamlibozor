/**
 * Visitor-facing text of the markets map, keyed by what the component needs.
 * The values are the editor labels shown in the CMS; the translated strings
 * live in src/content/landing/<locale>.json under `map.strings`.
 * `{n}` in a value is replaced with a number at render time.
 */
export const mapStrings = {
  country: 'Country name (panel root)',
  eyebrow: 'Panel eyebrow',
  eyebrowRegions: 'Eyebrow while listing regions',
  eyebrowMarkets: 'Eyebrow while listing a region’s markets',
  metricRegions: 'Metric label: regions',
  metricPlaces: 'Metric label: cities / districts',
  metricMarkets: 'Metric label: markets',
  tabMarkets: 'Tab: markets',
  tabPlaces: 'Tab: cities and districts',
  allMarkets: 'List heading: all markets',
  cities: 'List heading: cities',
  districts: 'List heading: districts',
  city: 'Place kind: city',
  district: 'Place kind: district',
  citySuffix: 'Suffix after a city name (e.g. “shahri”)',
  districtSuffix: 'Suffix after a district name (e.g. “tumani”)',
  noData: 'Message for a region without markets',
  notListed: 'Region not listed yet (screen readers)',
  marketsCount: 'Market count — {n} is replaced (screen readers)',
  boundariesNote: 'Boundaries note under the places list',
  allRegions: 'Back button: all regions',
  legendTitle: 'Legend title',
  legendNote: 'Legend note',
  zoomIn: 'Zoom in (screen readers)',
  zoomOut: 'Zoom out (screen readers)',
  resetView: 'Reset view (screen readers)',
  reset: 'Reset button',
  mapControls: 'Map controls group (screen readers)',
  mapLabel: 'Map name (screen readers)',
  mapTitle: 'Map title (screen readers)',
  mapSummary: 'Map summary — {n} is replaced (screen readers)',
  panelLabel: 'Side panel name (screen readers)',
  regionsNav: 'Regions list name (screen readers)',
  regionInfo: 'Region tabs name (screen readers)',
  tipClose: 'Close info window (screen readers)',
  tipInfo: 'Info window name, after the region (screen readers)',
  approximate: 'Approximate location kicker',
  tipTotal: 'Info row: markets incl. branches',
  tipRegionTotal: 'Info row: region total',
  tipFarmers: 'Info row: farmers markets',
  tipGoods: 'Info row: goods markets',
  tipVehicle: 'Info row: vehicle markets',
  tipMarketNote: 'Note under a market',
  tipDistrictNote: 'Note under a district',
  tipBranches: 'Branches note — {n} is replaced',
  hintMarket: 'Hint: click a dot',
  hintDistrict: 'Hint: click a district',
  hintRegion: 'Hint: click a region',
} as const;

export type MapStringKey = keyof typeof mapStrings;
export const mapStringKeys = Object.keys(mapStrings) as MapStringKey[];

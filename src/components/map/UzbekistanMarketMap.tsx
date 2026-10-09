/**
 * Interactive market map of Uzbekistan — the React island behind /bozorlar/.
 *
 * A pan/zoom SVG with region outlines, district outlines (loaded on demand when a region is
 * opened), one dot per market and a side panel listing regions, markets and places. Everything
 * visitor-facing arrives through props from the CMS; the outlines live in ./shapes.ts and
 * ./districts.ts. Styling is scoped to the instance id so the component owns its own CSS.
 *
 * Editors: open the page with `?pick` to read map coordinates for a market by clicking.
 *
 * Boundaries: UN OCHA / geoBoundaries 2020, CC BY 3.0 IGO. Dot positions are representative.
 */
import * as React from 'react';
import { regionIds, type MarketKind, type RegionId } from '../../content/regions';
import type { MapStrings } from '../../content/schema';
import type { District } from './districts';
import { BASE, SHAPES } from './shapes';

/** A market as the page passes it in (see lib/markets.ts → placeMarkets). */
export interface MapMarket {
  id: string;
  name: string;
  region: RegionId;
  kind: MarketKind;
  branch: boolean;
  x: number;
  y: number;
  /** False when the position was generated because the CMS entry has no coordinates yet. */
  placed: boolean;
}
export interface MapRegionName {
  name: string;
  kind: string;
}
export interface MapInvitation {
  text: string;
  label: string;
  href: string;
  note: string;
}
export interface Props {
  markets: MapMarket[];
  regions: Record<RegionId, MapRegionName>;
  kinds: Record<MarketKind | 'branch', string>;
  strings: MapStrings;
  invitation: MapInvitation;
}

type RegionStats = MapRegionName & {
  id: RegionId;
  hasRecords: boolean;
  markets: number;
  farmers: number;
  goods: number;
  vehicle: number;
  branches: number;
  records: MapMarket[];
};

type Camera = { x: number; y: number; width: number; height: number };
type Position = { x: number; y: number; clientX: number; clientY: number };
type Tip = {
  region: RegionId;
  market?: string;
  x: number;
  y: number;
  pinned: boolean;
  district?: string;
};
type Gesture =
  | { type: 'pan'; start: Position; camera: Camera }
  | {
      type: 'pinch';
      distance: number;
      zoom: number;
      aspect: number;
      anchor: { x: number; y: number };
    };
type MapStyle = {
  gridSize: number;
  inactiveOpacity: number;
  background: string;
  fill: string;
  active: string;
  border: string;
  borderWidth: number;
  grid: boolean;
  gridColor: string;
};
type DotStyle = {
  color: string;
  hoverColor: string;
  size: number;
  border: string;
  borderWidth: number;
};
type TooltipStyle = {
  padding: number;
  shadowValue: string;
  show: boolean;
  background: string;
  color: string;
  muted: string;
  accent: string;
  border: string;
  radius: number;
  width: number;
  shadow: boolean;
};
type BarStyle = {
  show: boolean;
  background: string;
  color: string;
  active: string;
  activeText: string;
  border: string;
  radius: number;
  gap: number;
};
type NavigationStyle = {
  offset: number;
  padding: number;
  gap: number;
  borderWidth: number;
  show: boolean;
  background: string;
  color: string;
  border: string;
  radius: number;
  size: number;
  placement: 'left' | 'right';
};
type Interaction = {
  drag: boolean;
  zoom: boolean;
  wheel: boolean;
  pinch: boolean;
  initialZoom: number;
  maxZoom: number;
  sensitivity: number;
  pinOnClick: boolean;
};
type Invitation = {
  padding: number;
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  buttonHover: string;
  buttonBorder: string;
  buttonBorderWidth: number;
  background: string;
  color: string;
  buttonColor: string;
  buttonText: string;
  radius: number;
};
type DetailsStyle = {
  districtBorderWidth: number;
  outlineColor: string;
  outlineWidth: number;
  labelHalo: string;
  haloWidth: number;
  shade1: number;
  shade2: number;
  shade3: number;
  shade4: number;
  labels: boolean;
  color: string;
  panelWidth: number;
};
type FrameStyle = {
  gap: number;
  verticalPadding: number;
  mobilePadding: number;
  mobileRadius: number;
  height: number;
  mobileHeight: number;
  breakpoint: number;
  mobileMap: number;
  panelSide: 'left' | 'right';
  radius: number;
  padding: number;
  borderWidth: number;
  borderColor: string;
  shadow: string;
};
type PanelStyle = {
  mobileTitleSize: number;
  metricColor: string;
  radius: number;
  cardColor: string;
  cardRadius: number;
  metricHeight: number;
  rowHeight: number;
  titleColor: string;
  muted: string;
  accent: string;
  hover: string;
  selectedBackground: string;
  headPadding: number;
  headTop: number;
  headBottom: number;
  contentPadding: number;
  rowPaddingX: number;
  rowPaddingY: number;
  tabPadding: number;
  dividerWidth: number;
  note: boolean;
};
type CaptionStyle = {
  background: string;
  radius: number;
  height: number;
  color: string;
  legendSize: number;
  creditSize: number;
  offset: number;
  bottom: number;
  opacity: number;
};

const DEFAULT_FRAME: FrameStyle = {
  height: 946,
  mobileHeight: 960,
  breakpoint: 720,
  mobileMap: 38,
  panelSide: 'left',
  radius: 40,
  padding: 18,
  verticalPadding: 15,
  mobilePadding: 14,
  mobileRadius: 28,
  gap: 16,
  borderWidth: 0,
  borderColor: '#d4d6d9',
  shadow: 'none',
};
const DEFAULT_PANEL: PanelStyle = {
  mobileTitleSize: 24,
  metricColor: '#3d9b3f',
  radius: 24,
  cardColor: '#ffffff',
  cardRadius: 24,
  metricHeight: 82,
  rowHeight: 78,
  titleColor: '#1c1c1c',
  muted: '#808080',
  accent: '#2e7d32',
  hover: '#ffffff',
  selectedBackground: '#ffffff',
  headPadding: 25,
  headTop: 26,
  headBottom: 14,
  contentPadding: 25,
  rowPaddingX: 24,
  rowPaddingY: 20,
  tabPadding: 14,
  dividerWidth: 0,
  note: false,
};
const DEFAULT_CAPTIONS: CaptionStyle = {
  background: '#f5f6f8',
  radius: 24,
  height: 66,
  color: '#808080',
  legendSize: 14,
  creditSize: 12,
  offset: 20,
  bottom: 12,
  opacity: 1,
};
const DEFAULT_HEADING_FONT = {
  fontSize: '32px',
  fontWeight: 600,
  lineHeight: '1.25em',
  letterSpacing: '-.035em',
};
const DEFAULT_LABEL_FONT = {
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '1.2em',
};
const DEFAULT_TOOLTIP_FONT = {
  fontSize: '14px',
  lineHeight: '1.5em',
};
const DEFAULT_CTA_FONT = {
  fontSize: '16px',
  lineHeight: '1.55em',
};
const DEFAULT_BUTTON_FONT = {
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '1.5em',
};

const DEFAULT_MAP: MapStyle = {
  gridSize: 70,
  inactiveOpacity: 16,
  background: '#e7e8ea',
  fill: '#178f20',
  active: '#106d18',
  border: '#ffffff',
  borderWidth: 0.65,
  grid: true,
  gridColor: '#cdd0d3',
};
const DEFAULT_DOTS: DotStyle = {
  color: '#fe9e00',
  hoverColor: '#ffc766',
  size: 3.5,
  border: '#fe9e00',
  borderWidth: 0,
};
const DEFAULT_TOOLTIP: TooltipStyle = {
  padding: 22,
  shadowValue: '0 12px 40px rgba(0,0,0,.08)',
  show: true,
  background: '#f5f6f8',
  color: '#1c1c1c',
  muted: '#808080',
  accent: '#2d9235',
  border: 'transparent',
  radius: 24,
  width: 320,
  shadow: true,
};
const DEFAULT_BAR: BarStyle = {
  show: true,
  background: '#f5f6f8',
  color: '#1c1c1c',
  active: '#2d9235',
  activeText: '#1c1c1c',
  border: 'transparent',
  radius: 24,
  gap: 4,
};
const DEFAULT_NAVIGATION: NavigationStyle = {
  offset: 0,
  padding: 15,
  gap: 7,
  borderWidth: 0,
  show: true,
  background: '#f5f6f8',
  color: '#000000',
  border: 'transparent',
  radius: 24,
  size: 47,
  placement: 'left',
};
const DEFAULT_INTERACTION: Interaction = {
  drag: true,
  zoom: true,
  wheel: true,
  pinch: true,
  initialZoom: 1,
  maxZoom: 50,
  sensitivity: 1,
  pinOnClick: true,
};
const DEFAULT_INVITATION: Invitation = {
  padding: 24,
  buttonRadius: 18,
  buttonPaddingX: 18,
  buttonPaddingY: 15,
  buttonHover: '#106d18',
  buttonBorder: 'transparent',
  buttonBorderWidth: 0,
  background: '#ffffff',
  color: '#1c1c1c',
  buttonColor: '#178f20',
  buttonText: '#ffffff',
  radius: 24,
};
const DEFAULT_DETAILS: DetailsStyle = {
  districtBorderWidth: 0.6,
  outlineColor: '#106d18',
  outlineWidth: 1,
  labelHalo: '#e7e8ea',
  haloWidth: 2.8,
  shade1: 96,
  shade2: 88,
  shade3: 80,
  shade4: 72,
  labels: true,
  color: '#234227',
  panelWidth: 356,
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const number = new Intl.NumberFormat('uz-UZ');
function initialCamera(level: number, maximum: number): Camera {
  const z = clamp(level, 1, maximum),
    width = BASE.width / z,
    height = BASE.height / z;
  return {
    x: BASE.x + (BASE.width - width) / 2,
    y: BASE.y + (BASE.height - height) / 2,
    width,
    height,
  };
}

export default function UzbekistanMarketMap(props: Props) {
  const map = DEFAULT_MAP;
  const dots = DEFAULT_DOTS;
  const tt = DEFAULT_TOOLTIP;
  const bar = DEFAULT_BAR;
  const nav = DEFAULT_NAVIGATION;
  const interaction = DEFAULT_INTERACTION;
  const invite = DEFAULT_INVITATION;
  const details = DEFAULT_DETAILS;
  const frame = DEFAULT_FRAME;
  const panel = DEFAULT_PANEL;
  const captions = DEFAULT_CAPTIONS;
  const headingFont = DEFAULT_HEADING_FONT;
  const labelFont = DEFAULT_LABEL_FONT;
  const tooltipFont = DEFAULT_TOOLTIP_FONT;
  const ctaFont = DEFAULT_CTA_FONT;
  const buttonFont = DEFAULT_BUTTON_FONT;
  const labelSize = Math.max(6, parseFloat(String(labelFont.fontSize)) || 11);

  const ui = props.strings;
  const { invitation, kinds } = props;
  /* Per-region totals are derived from the markets, so a CMS change updates every count. */
  const regions = React.useMemo(() => {
    const out = {} as Record<RegionId, RegionStats>;
    for (const id of regionIds) {
      out[id] = {
        id,
        ...props.regions[id],
        hasRecords: false,
        markets: 0,
        farmers: 0,
        goods: 0,
        vehicle: 0,
        branches: 0,
        records: [],
      };
    }
    for (const m of props.markets) {
      const r = out[m.region];
      r.records.push(m);
      r.markets++;
      r.hasRecords = true;
      if (m.kind === 'dehqon') r.farmers++;
      else if (m.kind === 'buyum') r.goods++;
      else r.vehicle++;
      if (m.branch) r.branches++;
    }
    return out;
  }, [props.markets, props.regions]);
  const marketById = React.useMemo(() => new Map(props.markets.map((m) => [m.id, m])), [props.markets]);
  const total = props.markets.length;
  const fullName = (id: RegionId) => regions[id].name + ' ' + regions[id].kind;
  const districtName = (d: District) => d.name + ' ' + (d.city ? ui.citySuffix : ui.districtSuffix);
  const kindLabel = (m: MapMarket) => kinds[m.kind] + (m.branch ? ' · ' + kinds.branch : '');
  const fill = (template: string, n: number) => template.replace('{n}', number.format(n));

  /* District outlines are ~290 KB, so they load the first time a region is opened. */
  const [districts, setDistricts] = React.useState<District[]>([]);
  /* Editor-only coordinate picker, enabled with ?pick in the page URL. */
  const [pick, setPick] = React.useState(false);
  const [picked, setPicked] = React.useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const maximum = Math.max(1, interaction.maxZoom);
  const instance = 'uzmap-' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const root = React.useRef<HTMLDivElement>(null);
  const svg = React.useRef<SVGSVGElement>(null);
  const tipElement = React.useRef<HTMLDivElement>(null);
  const cameraRef = React.useRef<Camera>(initialCamera(interaction.initialZoom, maximum));
  const pointers = React.useRef(new Map<number, Position>());
  const gesture = React.useRef<Gesture | null>(null);
  const moved = React.useRef(false);
  const suppressClick = React.useRef(false);
  const suppressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [camera, setCamera] = React.useState(cameraRef.current);
  const [dragging, setDragging] = React.useState(false);
  const [selected, setSelected] = React.useState<RegionId | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [tip, setTip] = React.useState<Tip | null>(null);
  const tipRef = React.useRef<Tip | null>(null);
  const [tipPosition, setTipPosition] = React.useState({ left: 12, top: 12 });
  const [size, setSize] = React.useState({
    width: 1100,
    height: 720,
    mapWidth: 790,
    mapHeight: 720,
  });
  const [panelTab, setPanelTab] = React.useState<'markets' | 'places'>('markets');
  const [pickedDistrict, setPickedDistrict] = React.useState<string | null>(null);
  const [pickedMarket, setPickedMarket] = React.useState<string | null>(null);
  const selectedRef = React.useRef<RegionId | null>(null);
  selectedRef.current = selected;
  const settingsRef = React.useRef(interaction);
  settingsRef.current = interaction;
  tipRef.current = tip;
  const layoutRef = React.useRef({
    frame,
    bar,
    details,
    nav,
    captions,
  });
  layoutRef.current = { frame, bar, details, nav, captions };
  function mapViewport() {
    const settings = layoutRef.current,
      el = svg.current;
    const rect = el?.getBoundingClientRect();
    const width = Math.max(1, el?.clientWidth || rect?.width || BASE.width);
    const height = Math.max(1, el?.clientHeight || rect?.height || BASE.height);
    const mobile = (root.current?.clientWidth || width) <= settings.frame.breakpoint;
    const sidebar = !mobile && settings.bar.show ? settings.details.panelWidth + settings.frame.gap : 0;
    const left = mobile
      ? settings.frame.mobilePadding
      : settings.frame.padding + (settings.frame.panelSide === 'left' ? sidebar : 0);
    const right = mobile
      ? settings.frame.mobilePadding
      : settings.frame.padding + (settings.frame.panelSide === 'right' ? sidebar : 0);
    const top = mobile
      ? (settings.nav.show && settingsRef.current.zoom
          ? selectedRef.current
            ? 100
            : 62
          : selectedRef.current
            ? 44
            : 0) +
        settings.nav.offset +
        settings.frame.mobilePadding
      : settings.frame.verticalPadding;
    const footer = root.current?.querySelector<HTMLElement>('.um-map-footer');
    const sheetHeight =
      mobile && settings.bar.show
        ? Math.max(0, (height - settings.frame.mobilePadding * 2) * (1 - settings.frame.mobileMap / 100))
        : 0;
    const bottom =
      (mobile
        ? settings.frame.mobilePadding + sheetHeight + (settings.bar.show ? settings.frame.gap : 0)
        : settings.frame.verticalPadding + settings.captions.bottom) +
      (footer?.offsetHeight || settings.captions.height) +
      12;
    const usableWidth = Math.max(1, width - left - right);
    const usableHeight = Math.max(1, height - top - bottom);
    return {
      width,
      height,
      usableWidth,
      usableHeight,
      centerX: left + usableWidth / 2,
      centerY: top + usableHeight / 2,
    };
  }
  function fittedCamera(bounds: Camera, minimumUnits = 0): Camera {
    const area = mapViewport();
    const units = Math.max(bounds.width / area.usableWidth, bounds.height / area.usableHeight, minimumUnits);
    return {
      x: bounds.x + bounds.width / 2 - area.centerX * units,
      y: bounds.y + bounds.height / 2 - area.centerY * units,
      width: area.width * units,
      height: area.height * units,
    };
  }
  function homeCamera(level: number, max: number): Camera {
    return fittedCamera(initialCamera(level, max));
  }
  const zoom = homeCamera(1, maximum).width / camera.width;
  function dismiss() {
    tipRef.current = null;
    setTip(null);
    setHovered(null);
  }
  function draw(view: Camera) {
    // The canvas clips only at the outer frame; panning is free behind its overlays.
    cameraRef.current = view;
    setCamera(view);
  }
  function local(e: { clientX: number; clientY: number }): Position {
    const view = cameraRef.current,
      matrix = svg.current?.getScreenCTM();
    if (svg.current && matrix) {
      const point = svg.current.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const world = point.matrixTransform(matrix.inverse());
      return {
        x: (world.x - view.x) / view.width,
        y: (world.y - view.y) / view.height,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    }
    const box = svg.current?.getBoundingClientRect();
    return {
      x: box ? (e.clientX - box.left) / box.width : 0.5,
      y: box ? (e.clientY - box.top) / box.height : 0.5,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  }
  const world = (p: { x: number; y: number }, view = cameraRef.current) => ({
    x: view.x + p.x * view.width,
    y: view.y + p.y * view.height,
  });
  function zoomAt(factor: number, p?: { x: number; y: number }) {
    if (!settingsRef.current.zoom) return;
    dismiss();
    const area = mapViewport(),
      point = p || {
        x: area.centerX / area.width,
        y: area.centerY / area.height,
      };
    const anchor = world(point),
      homeWidth = homeCamera(1, settingsRef.current.maxZoom).width;
    const next = clamp((homeWidth / cameraRef.current.width) * factor, 1, Math.max(1, settingsRef.current.maxZoom));
    const width = homeWidth / next,
      height = (cameraRef.current.height * width) / cameraRef.current.width;
    draw({
      x: anchor.x - point.x * width,
      y: anchor.y - point.y * height,
      width,
      height,
    });
  }
  function regionCamera(id: string): Camera {
    const shape = SHAPES.find((s) => s.id === id)!,
      [x0, y0, x1, y1] = shape.bb;
    const padding = Math.max(x1 - x0, y1 - y0) * 0.12 + 2;
    const area = mapViewport();
    return fittedCamera(
      {
        x: x0 - padding,
        y: y0 - padding,
        width: x1 - x0 + padding * 2,
        height: y1 - y0 + padding * 2,
      },
      homeCamera(1, settingsRef.current.maxZoom).width / area.width / Math.max(1, settingsRef.current.maxZoom),
    );
  }
  function reset() {
    dismiss();
    const id = selectedRef.current;
    draw(id ? regionCamera(id) : homeCamera(settingsRef.current.initialZoom, Math.max(1, settingsRef.current.maxZoom)));
  }
  function openRegion(id: RegionId | null) {
    dismiss();
    selectedRef.current = id;
    setSelected(id);
    setPickedDistrict(null);
    setPickedMarket(null);
    setPanelTab('markets');
    draw(id ? regionCamera(id) : homeCamera(settingsRef.current.initialZoom, maximum));
  }
  React.useEffect(() => {
    reset();
  }, [interaction.initialZoom, maximum]);
  React.useEffect(() => {
    if (!root.current) return;
    let previousWidth = 0,
      previousHeight = 0;
    const update = () => {
      const el = root.current,
        mapEl = svg.current;
      if (!el) return;
      const next = {
        width: el.clientWidth,
        height: el.clientHeight,
        mapWidth: mapEl?.clientWidth || el.clientWidth,
        mapHeight: mapEl?.clientHeight || el.clientHeight,
      };
      setSize((old) =>
        Object.keys(next).every((k) => old[k as keyof typeof old] === next[k as keyof typeof next]) ? old : next,
      );
      if (previousWidth && (next.mapWidth !== previousWidth || next.mapHeight !== previousHeight)) reset();
      previousWidth = next.mapWidth;
      previousHeight = next.mapHeight;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root.current);
    if (svg.current) observer.observe(svg.current);
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      const settings = settingsRef.current;
      if (!settings.zoom || !settings.wheel) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      zoomAt(Math.exp(-clamp(e.deltaY * unit, -400, 400) * 0.0015 * settings.sensitivity), local(e));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  function beginGesture() {
    const [a, b] = [...pointers.current.values()],
      settings = settingsRef.current;
    if (a && b && settings.zoom && settings.pinch) {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      gesture.current = {
        type: 'pinch',
        distance: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)),
        zoom: homeCamera(1, settings.maxZoom).width / cameraRef.current.width,
        aspect: cameraRef.current.height / cameraRef.current.width,
        anchor: world(mid),
      };
      moved.current = true;
      suppressClick.current = true;
      setDragging(true);
      dismiss();
    } else if (a && !b && settings.drag)
      gesture.current = {
        type: 'pan',
        start: a,
        camera: { ...cameraRef.current },
      };
    else gesture.current = null;
  }
  function pointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!interaction.drag && !(interaction.zoom && interaction.pinch)) return;
    if (pointers.current.size === 0) {
      moved.current = false;
      suppressClick.current = false;
      if (suppressTimer.current) clearTimeout(suppressTimer.current);
    }
    pointers.current.set(e.pointerId, local(e));
    beginGesture();
    dismiss();
    // Capture only gestures, so a simple touch tap keeps its original dot target.
    if (gesture.current?.type === 'pinch')
      for (const id of pointers.current.keys()) e.currentTarget.setPointerCapture(id);
  }
  function pointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const g = gesture.current;
    if (!pointers.current.has(e.pointerId) || !g) return;
    pointers.current.set(e.pointerId, local(e));
    if (g.type === 'pinch') {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const next = clamp((g.zoom * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) / g.distance, 1, maximum),
        width = homeCamera(1, maximum).width / next,
        height = width * g.aspect;
      draw({
        x: g.anchor.x - mid.x * width,
        y: g.anchor.y - mid.y * height,
        width,
        height,
      });
    } else {
      const p = pointers.current.get(e.pointerId)!;
      if (!moved.current && Math.hypot(p.clientX - g.start.clientX, p.clientY - g.start.clientY) < 5) return;
      if (!moved.current) {
        moved.current = true;
        suppressClick.current = true;
        setDragging(true);
        dismiss();
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      const view = g.camera;
      // Screen deltas remain stable even as the camera changes during a drag.
      const matrix = svg.current?.getScreenCTM(),
        pixelsPerUnitX = matrix ? Math.hypot(matrix.a, matrix.b) : 1,
        pixelsPerUnitY = matrix ? Math.hypot(matrix.c, matrix.d) : 1;
      draw({
        ...view,
        x: view.x - (p.clientX - g.start.clientX) / pixelsPerUnitX,
        y: view.y - (p.clientY - g.start.clientY) / pixelsPerUnitY,
      });
    }
    e.preventDefault();
  }
  function finishPointer(id: number) {
    if (!pointers.current.has(id)) return;
    pointers.current.delete(id);
    if (svg.current?.hasPointerCapture(id)) svg.current.releasePointerCapture(id);
    if (pointers.current.size) beginGesture();
    else {
      gesture.current = null;
      setDragging(false);
      if (moved.current) {
        dismiss();
        suppressTimer.current = setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }
    }
  }
  React.useEffect(() => {
    const finish = (e: PointerEvent) => finishPointer(e.pointerId);
    const blur = () => {
      pointers.current.clear();
      gesture.current = null;
      setDragging(false);
      dismiss();
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', blur);
      if (suppressTimer.current) clearTimeout(suppressTimer.current);
    };
  }, []);
  function rootPoint(clientX: number, clientY: number) {
    const el = root.current,
      rect = el?.getBoundingClientRect();
    return {
      x: rect && el ? ((clientX - rect.left) * el.clientWidth) / rect.width : 12,
      y: rect && el ? ((clientY - rect.top) * el.clientHeight) / rect.height : 12,
    };
  }
  function show(
    region: RegionId,
    e: { clientX: number; clientY: number },
    market?: string,
    pinned = false,
    district?: string,
  ) {
    if (!tt.show || pointers.current.size || suppressClick.current) return;
    if (!pinned && tipRef.current?.pinned) return;
    const p = rootPoint(e.clientX, e.clientY),
      next = { region, market, district, ...p, pinned };
    tipRef.current = next;
    setTip(next);
    setHovered(region);
  }
  function leave() {
    if (!tipRef.current?.pinned) {
      setTip(null);
      setHovered(null);
      tipRef.current = null;
    }
  }
  function focus(region: RegionId, element: Element) {
    const box = element.getBoundingClientRect();
    show(region, {
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    });
  }
  function select(region: RegionId, e: { clientX: number; clientY: number }, market?: string) {
    if (suppressClick.current) return;
    if (selectedRef.current !== region) openRegion(region);
    if (market) {
      setPickedMarket(market);
      setPanelTab('markets');
      const button = (e as React.MouseEvent).target as Element | undefined;
      const dot = marketById.get(market),
        matrix = svg.current?.getScreenCTM();
      if (button?.closest?.('.um-market-row') && dot && matrix && svg.current) {
        const point = svg.current.createSVGPoint();
        point.x = dot.x;
        point.y = dot.y;
        const position = point.matrixTransform(matrix);
        show(region, { clientX: position.x, clientY: position.y }, market, interaction.pinOnClick);
      } else show(region, e, market, interaction.pinOnClick);
    }
  }
  function pickDistrict(d: District) {
    dismiss();
    setPickedDistrict(d.id);
    setPickedMarket(null);
    setPanelTab('places');
  }
  React.useEffect(() => {
    if (!pickedMarket || panelTab !== 'markets') return;
    const list = root.current?.querySelector<HTMLElement>('.um-panel-content'),
      row = root.current?.querySelector<HTMLElement>('[data-sidebar-market="' + pickedMarket + '"]');
    if (list && row) {
      const a = list.getBoundingClientRect(),
        b = row.getBoundingClientRect();
      if (b.top < a.top) list.scrollTop += b.top - a.top - 8;
      else if (b.bottom > a.bottom) list.scrollTop += b.bottom - a.bottom + 8;
    }
  }, [pickedMarket, panelTab, selected]);
  React.useLayoutEffect(() => {
    if (!tip || !tipElement.current) return;
    const width = tipElement.current.offsetWidth,
      height = tipElement.current.offsetHeight;
    let left = tip.x + 16,
      top = tip.y - height - 16;
    if (left + width > size.width - 8) left = tip.x - width - 16;
    if (top < 8) top = tip.y + 16;
    setTipPosition({
      left: clamp(left, 8, Math.max(8, size.width - width - 8)),
      top: clamp(top, 8, Math.max(8, size.height - height - 8)),
    });
  }, [tip, size.width, size.height, tt.width, tt.padding]);
  React.useLayoutEffect(() => {
    reset();
  }, [
    frame.breakpoint,
    frame.padding,
    frame.verticalPadding,
    frame.mobilePadding,
    frame.mobileMap,
    frame.panelSide,
    frame.gap,
    bar.show,
    details.panelWidth,
    nav.show,
    nav.offset,
    interaction.zoom,
    captions.height,
    captions.bottom,
    selected,
    size.width <= frame.breakpoint,
    size.height,
  ]);
  function keyDown(e: React.KeyboardEvent<SVGSVGElement>) {
    const key = e.key;
    let handled = true;
    if (key === '+' || key === '=') zoomAt(1.4);
    else if (key === '-' || key === '_') zoomAt(1 / 1.4);
    else if (key === '0' || key === 'Home') reset();
    else if (key === 'Escape') {
      if (tipRef.current) dismiss();
      else if (pickedDistrict) setPickedDistrict(null);
      else openRegion(null);
    } else if (key.startsWith('Arrow') && interaction.drag) {
      const view = { ...cameraRef.current };
      if (key === 'ArrowLeft') view.x -= view.width * 0.1;
      else if (key === 'ArrowRight') view.x += view.width * 0.1;
      else if (key === 'ArrowUp') view.y -= view.height * 0.1;
      else if (key === 'ArrowDown') view.y += view.height * 0.1;
      dismiss();
      draw(view);
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  const stats = tip ? regions[tip.region] : null;
  const market = tip?.market ? marketById.get(tip.market) : null;
  const tipDistrict = tip?.district ? districts.find((d) => d.id === tip.district) : null;
  const current = selected ? regions[selected] : null;
  const places = selected
    ? districts.filter((d) => d.r === selected).sort((a, b) => a.name.localeCompare(b.name, 'uz'))
    : [];
  const cities = places.filter((d) => d.city),
    tumans = places.filter((d) => !d.city);
  const scale = Math.max(0.01, Math.min(size.mapWidth / camera.width, size.mapHeight / camera.height));
  const keptLabels: { x: number; y: number; w: number; h: number }[] = [];
  const visibleLabels = details.labels
    ? [...places]
        .sort(
          (a, b) =>
            (b.id === pickedDistrict ? 1 : 0) - (a.id === pickedDistrict ? 1 : 0) ||
            Number(b.city) - Number(a.city) ||
            b.a - a.a,
        )
        .filter((d) => {
          const [x, y] = d.lp,
            w = (d.name.length * labelSize * 0.57 + 10) / scale,
            h = (labelSize * 1.55) / scale;
          if (
            x - w / 2 < camera.x ||
            x + w / 2 > camera.x + camera.width ||
            y - h / 2 < camera.y ||
            y + h / 2 > camera.y + camera.height
          )
            return false;
          if (keptLabels.some((q) => Math.abs(q.x - x) < (q.w + w) / 2 && Math.abs(q.y - y) < (q.h + h) / 2))
            return false;
          keptLabels.push({ x, y, w, h });
          return true;
        })
    : [];
  const shade = (index: number) =>
    `color-mix(in srgb, ${map.fill} ${[details.shade1, details.shade2, details.shade3, details.shade4][index % 4]}%, ${map.background})`;
  const isMobile = size.width <= frame.breakpoint;
  const mobileSheetHeight = bar.show
    ? Math.max(0, (size.height - frame.mobilePadding * 2) * (1 - frame.mobileMap / 100))
    : 0;
  const rootStyle = {
    width: '100%',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'block',
    isolation: 'isolate',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: isMobile ? frame.mobileRadius : frame.radius,
    padding: isMobile ? frame.mobilePadding : frame.verticalPadding + 'px ' + frame.padding + 'px',
    border: frame.borderWidth + 'px solid ' + frame.borderColor,
    boxShadow: frame.shadow,
    backgroundColor: map.background,
    color: tt.color,
    fontFamily: 'inherit',
    fontSize: 14,
    lineHeight: '1.5em',
    containerType: 'inline-size',
    '--um-map': map.fill,
    '--um-active': map.active,
    '--um-dot': dots.color,
    '--um-dot-hover': dots.hoverColor,
  } as React.CSSProperties;
  React.useEffect(() => {
    if (!selected || districts.length) return;
    let cancelled = false;
    void import('./districts').then((m) => {
      if (!cancelled) setDistricts(m.DISTRICTS);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, districts.length]);
  React.useEffect(() => {
    setPick(new URLSearchParams(window.location.search).has('pick'));
  }, []);
  const copy = (value: number) => {
    void navigator.clipboard?.writeText(String(value)).then(() => setCopied(true));
  };
  return (
    <div
      ref={root}
      id={instance}
      className={isMobile ? 'um-mobile' : 'um-desktop'}
      style={rootStyle}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !(e.target instanceof SVGElement)) {
          if (tipRef.current) dismiss();
          else if (pickedDistrict) setPickedDistrict(null);
          else openRegion(null);
        }
      }}
    >
      <style>{`

      #${instance} *{box-sizing:border-box}#${instance} button,#${instance} a{font:inherit;-webkit-tap-highlight-color:transparent}#${instance} button{cursor:pointer}#${instance} button:focus,#${instance} a:focus,#${instance} .um-svg:focus{outline:none}#${instance} .um-svg{border:0}#${instance} button:focus-visible,#${instance} a:focus-visible{outline:2px solid var(--um-active);outline-offset:-3px}#${instance} .um-svg:focus-visible{outline:none;box-shadow:none}#${instance} .um-stage:has(.um-svg:focus-visible) .um-level{color:var(--um-active);font-weight:600}
      #${instance}{background-image:${map.grid ? `linear-gradient(${map.gridColor} .7px,transparent .7px),linear-gradient(90deg,${map.gridColor} .7px,transparent .7px)` : 'none'};background-size:${map.gridSize}px ${map.gridSize}px;background-position:-11px 28px}
      #${instance} .um-layout{position:relative;display:flex;gap:${frame.gap}px;width:100%;height:100%;min-height:0}#${instance} .um-stage{position:relative;flex:1;min-width:0;min-height:0;overflow:hidden;order:${frame.panelSide === 'left' ? 2 : 1}}
      #${instance} .um-panel{width:${details.panelWidth}px;flex:0 0 ${details.panelWidth}px;min-height:0;display:flex;flex-direction:column;order:${frame.panelSide === 'left' ? 1 : 2};border:${panel.dividerWidth}px solid ${bar.border};border-radius:${panel.radius}px;background:${bar.background};color:${bar.color};overflow:hidden}
      #${instance} .um-panel-head{padding:${panel.headTop}px ${panel.headPadding}px ${panel.headBottom}px;flex:none}#${instance} .um-eyebrow{display:flex;gap:5px;align-items:center;margin:0 0 12px;font-size:.7143em;line-height:1.5;color:${map.fill};font-weight:400}#${instance} .um-eyebrow-muted,#${instance} .um-eyebrow-divider{color:${panel.muted}}#${instance} .um-panel-title{margin:0 0 15px;color:${panel.titleColor};overflow-wrap:anywhere}#${instance} .um-summary{margin:0;line-height:1.55;color:${panel.muted};font-size:.857em}#${instance} .um-summary strong{font-weight:600;color:${panel.accent}}
      #${instance} .um-metrics{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}#${instance} .um-metric{height:${panel.metricHeight}px;background:${panel.cardColor};border-radius:${panel.cardRadius}px;padding:14px 15px;display:flex;flex-direction:column;justify-content:center;gap:2px;min-width:0}#${instance} .um-metric strong{font-size:1.7143em;line-height:1.3;font-weight:600;color:${panel.metricColor}}#${instance} .um-metric span{font-size:1em;line-height:1.5;color:${panel.muted}}
      #${instance} .um-breadcrumb{display:flex;align-items:center;gap:8px;margin:0 0 14px;font-size:.857em;color:${panel.muted}}#${instance} .um-breadcrumb button{border:0;background:${panel.cardColor};padding:6px 10px;border-radius:12px;color:${panel.accent}}
      #${instance} .um-tabs{display:flex;gap:6px;padding:0 ${panel.contentPadding}px 12px;flex:none}#${instance} .um-tabs button{flex:1;border:0;border-radius:16px;background:transparent;color:${panel.muted};padding:${panel.tabPadding}px 6px;font-size:.857em;line-height:1.4}#${instance} .um-tabs button[aria-selected=true]{background:${panel.cardColor};color:${bar.active};font-weight:500}
      #${instance} .um-panel-content{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;padding:0 ${panel.contentPadding}px 20px}#${instance} .um-panel-content::-webkit-scrollbar{display:none}#${instance} .um-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:${panel.rowPaddingY}px ${panel.rowPaddingX}px;margin:0 0 ${bar.gap}px;border:${panel.dividerWidth}px solid ${bar.border};border-radius:${bar.radius}px;background:none;color:${bar.color};line-height:1.4;transition:background .15s}
      #${instance} .um-region-row{min-height:${panel.rowHeight}px}#${instance} .um-region-row:first-child{background:${panel.cardColor}}#${instance} .um-row:hover{background:${panel.hover}}#${instance} .um-row[aria-pressed=true]{background:${panel.selectedBackground};color:${bar.activeText}}#${instance} .um-row[aria-pressed=true] .um-row-kind,#${instance} .um-row[aria-pressed=true] .um-market-number{color:${panel.muted}}
      #${instance} .um-row-chip{width:8px;height:8px;flex:none;border-radius:3px;background:${panel.accent}}#${instance} .um-row-name{flex:1;min-width:0;overflow-wrap:anywhere;font-size:1.143em;line-height:1.25;font-weight:600}#${instance} .um-row-kind{display:block;font-size:.75em;line-height:1.5;font-weight:400;color:${panel.muted};margin-top:0}#${instance} .um-row-count{flex:none;font-size:1.143em;font-variant-numeric:tabular-nums;font-weight:500;color:${panel.accent}}#${instance} .um-section-title{font-size:.857em;font-weight:500;color:${panel.muted};margin:8px 4px 12px}#${instance} .um-market-row{align-items:flex-start;padding:${panel.rowPaddingY}px 16px}#${instance} .um-market-number{flex:none;font-size:.857em;color:${panel.muted};width:20px;padding-top:3px}#${instance} .um-market-row .um-row-name{font-size:1em;font-weight:500;line-height:1.5}#${instance} .um-market-row .um-row-kind{font-size:.857em}
      #${instance} .um-panel-note{padding:12px ${panel.headPadding}px;flex:none;font-size:.714em;line-height:1.6;color:${panel.muted}}#${instance} .um-panel-note strong{font-weight:500;color:${panel.titleColor}}
      #${instance} .um-empty{padding:${invite.padding}px;margin:0 0 16px;background:${invite.background};border-radius:${invite.radius}px;color:${invite.color}}#${instance} .um-empty-icon{font-size:24px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:14px;margin-bottom:18px;background:color-mix(in srgb,${invite.buttonColor} 8%,${invite.background});color:${invite.buttonColor}}#${instance} .um-empty p{margin:0 0 22px;overflow-wrap:anywhere}#${instance} .um-empty small{display:block;font-size:.857em;line-height:1.6;margin-top:16px;color:${panel.muted}}#${instance} .um-cta{display:flex;align-items:center;justify-content:space-between;gap:8px;text-decoration:none;padding:${invite.buttonPaddingY}px ${invite.buttonPaddingX}px;border-radius:${invite.buttonRadius}px;border:${invite.buttonBorderWidth}px solid ${invite.buttonBorder};background:${invite.buttonColor};color:${invite.buttonText};overflow-wrap:anywhere;transition:background .15s}#${instance} .um-cta:hover{background:${invite.buttonHover}}
      #${instance} .um-svg{display:block;width:100%;height:100%;user-select:none;-webkit-user-select:none;cursor:${interaction.drag ? 'grab' : 'default'};touch-action:${interaction.drag || (interaction.zoom && interaction.pinch) ? 'none' : 'auto'}}
      #${instance} .um-region,#${instance} .um-district{cursor:pointer;transition:fill .12s}#${instance} .um-region:focus,#${instance} .um-district:focus{outline:none}#${instance} .um-region:focus-visible,#${instance} .um-district:focus-visible{stroke:var(--um-active);stroke-width:2px}#${instance} .um-region:hover,#${instance} .um-district:hover{fill:var(--um-active)}#${instance} .um-dot-hit{fill:transparent;pointer-events:all}#${instance} .um-dot{fill:var(--um-dot);pointer-events:none}#${instance} .um-market{cursor:pointer}#${instance} .um-market:hover .um-dot{fill:var(--um-dot-hover)}#${instance} .um-dragging,#${instance} .um-dragging *{cursor:grabbing!important}
      #${instance} .um-navigation{position:absolute;top:${nav.offset}px;${nav.placement}:${nav.offset}px;display:flex;align-items:center;gap:${nav.gap}px;padding:${nav.padding}px;border:${nav.borderWidth}px solid ${nav.border};border-radius:${nav.radius}px;background:${nav.background};color:${nav.color};z-index:2}
      #${instance} .um-navigation button{border:0;border-radius:16px;background:transparent;color:inherit;height:${nav.size}px;min-width:${Math.max(28, nav.size - 5)}px;padding:0 5px;font-size:2.286em;font-weight:400;line-height:1}#${instance} .um-navigation button:disabled{opacity:1;cursor:default}#${instance} .um-level{font-size:1em;margin-left:16px;margin-right:5px;min-width:42px;text-align:center;font-weight:400;font-variant-numeric:tabular-nums;color:${panel.muted}}#${instance} .um-navigation .um-reset{font-size:1em;background:${panel.cardColor};color:${map.fill};padding:0 15px;min-width:74px}
      #${instance} .um-back{position:absolute;top:${nav.show && interaction.zoom ? nav.offset + nav.size + nav.padding * 2 + nav.borderWidth * 2 + 12 : nav.offset}px;left:${nav.offset}px;display:flex;align-items:center;gap:8px;border:0;border-radius:16px;background:${bar.background};color:${panel.accent};padding:12px 16px;font-size:.929em;z-index:2}
      #${instance} .um-map-footer{position:absolute;left:0;right:0;bottom:${captions.bottom}px;height:${captions.height}px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px ${captions.offset}px;background:${captions.background};border-radius:${captions.radius}px;z-index:1}#${instance} .um-map-note{display:flex;align-items:flex-start;gap:10px;pointer-events:none;font-size:${captions.legendSize}px;line-height:1.5;color:${bar.color}}#${instance} .um-legend-dot{display:block;width:8px;height:8px;margin-top:6px;flex:none;border-radius:50%;background:${panel.accent}}#${instance} .um-map-note strong{font-weight:600}#${instance} .um-map-note small{display:block;font-size:.857em;color:${captions.color}}#${instance} .um-credit{font-size:${captions.creditSize}px;line-height:1.5;color:${captions.color};text-decoration:none;opacity:${captions.opacity};text-align:right;margin-left:auto}#${instance} .um-compass{position:absolute;right:${captions.offset}px;top:${nav.placement === 'right' ? nav.offset + nav.size + nav.padding * 2 + 16 : nav.offset}px;pointer-events:none;color:${captions.color};font-size:.857em;text-align:center}
      #${instance} .um-tip{position:absolute;z-index:5;width:${Math.min(tt.width, Math.max(0, size.width - 24))}px;max-height:calc(100% - 24px);overflow:auto;overscroll-behavior:contain;padding:${tt.padding}px;background:${tt.background};color:${tt.color};border:1px solid ${tt.border};border-radius:${tt.radius}px;box-shadow:${tt.shadow ? tt.shadowValue : 'none'}}#${instance} .um-tip-title{font-size:1.429em;font-weight:600;line-height:1.4;letter-spacing:-.025em;margin:0 26px 18px 0;overflow-wrap:anywhere}#${instance} .um-kicker{font-size:.714em;line-height:1.5;color:${tt.accent};margin-bottom:12px}#${instance} .um-tip-row{display:flex;justify-content:space-between;gap:12px;margin:6px 0;padding:11px 12px;border-radius:14px;background:${panel.cardColor};color:${tt.muted};font-size:.929em}#${instance} .um-tip-row strong{color:${tt.accent};font-weight:600;flex:none}#${instance} .um-tip-total{padding:15px 12px;margin-bottom:10px;align-items:center}#${instance} .um-tip-total strong{font-size:1.846em}#${instance} .um-tip-note{font-size:.857em;line-height:1.55;color:${tt.muted};margin:16px 0 0}#${instance} .um-tip-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border:0;border-radius:10px;background:${panel.cardColor};color:${tt.muted};font-size:1.429em}
      #${instance}.um-mobile .um-layout{flex-direction:column}#${instance}.um-mobile .um-stage{order:1;flex:0 0 ${frame.mobileMap}%;width:100%}#${instance}.um-mobile .um-panel{order:2;flex:1;width:100%;min-width:0}#${instance}.um-mobile .um-panel-head{padding:20px 20px 14px}#${instance}.um-mobile .um-panel-title{margin-bottom:14px}#${instance}.um-mobile .um-panel-content{padding:0 20px 16px}#${instance}.um-mobile .um-tabs{padding-left:20px;padding-right:20px}#${instance}.um-mobile .um-eyebrow{margin-bottom:10px}#${instance}.um-mobile .um-breadcrumb{margin-bottom:10px}#${instance}.um-mobile .um-metric{height:${Math.min(panel.metricHeight, 72)}px;border-radius:${Math.min(panel.cardRadius, 20)}px}#${instance}.um-mobile .um-navigation{gap:6px;padding:8px;border-radius:20px}#${instance}.um-mobile .um-navigation button{height:40px;min-width:36px;font-size:1.857em}#${instance}.um-mobile .um-navigation .um-reset{font-size:.857em;min-width:64px;padding:0 12px}#${instance}.um-mobile .um-level{font-size:.857em}#${instance}.um-mobile .um-back{top:${nav.show && interaction.zoom ? nav.offset + 66 : nav.offset}px;padding:8px 12px;font-size:.857em}#${instance}.um-mobile .um-map-footer{height:auto;min-height:${captions.height}px;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 16px;bottom:0;border-radius:20px}#${instance}.um-mobile .um-credit{font-size:${Math.min(captions.creditSize, 10)}px;margin-left:18px;text-align:left}#${instance}.um-mobile .um-svg{margin-top:${nav.show && interaction.zoom ? (selected ? 100 : 62) : selected ? 44 : 0}px;height:calc(100% - ${captions.height + 28 + (nav.show && interaction.zoom ? (selected ? 100 : 62) : selected ? 44 : 0)}px)}#${instance}.um-mobile .um-map-note{font-size:${Math.min(captions.legendSize, 13)}px}#${instance}.um-mobile .um-empty-icon{display:none}
      #${instance} .um-no-panel .um-stage{flex:1;width:100%;height:100%}

      /* Full desktop canvas behind floating panels; only the outer frame clips it. */
      #${instance}.um-desktop .um-layout{justify-content:${frame.panelSide === 'left' ? 'flex-start' : 'flex-end'}}
      #${instance}.um-desktop .um-stage{position:absolute;left:-${frame.padding}px;right:-${frame.padding}px;top:-${frame.verticalPadding}px;bottom:-${frame.verticalPadding}px;width:auto;height:auto;overflow:visible}
      #${instance} .um-panel{position:relative;z-index:3}
      #${instance}.um-desktop .um-navigation{top:${frame.verticalPadding + nav.offset}px;${nav.placement}:${frame.padding + nav.offset + (bar.show && frame.panelSide === nav.placement ? details.panelWidth + frame.gap : 0)}px}
      #${instance}.um-desktop .um-back{left:${frame.padding + nav.offset + (bar.show && frame.panelSide === 'left' ? details.panelWidth + frame.gap : 0)}px;top:${frame.verticalPadding + (nav.show && interaction.zoom ? nav.offset + nav.size + nav.padding * 2 + nav.borderWidth * 2 + 12 : nav.offset)}px}
      #${instance}.um-desktop .um-map-footer{left:${frame.padding + (bar.show && frame.panelSide === 'left' ? details.panelWidth + frame.gap : 0)}px;right:${frame.padding + (bar.show && frame.panelSide === 'right' ? details.panelWidth + frame.gap : 0)}px;bottom:${frame.verticalPadding + captions.bottom}px}
      #${instance}.um-desktop .um-compass{right:${frame.padding + captions.offset + (bar.show && frame.panelSide === 'right' ? details.panelWidth + frame.gap : 0)}px;top:${frame.verticalPadding + (nav.placement === 'right' ? nav.offset + nav.size + nav.padding * 2 + 16 : nav.offset)}px}
      #${instance}.um-mobile .um-svg{margin-top:0;height:100%}

      /* Mobile keeps the original always-visible list; the map fills the grid behind it. */
      #${instance}.um-mobile .um-layout{display:block}
      #${instance}.um-mobile .um-stage{position:absolute;left:-${frame.mobilePadding}px;right:-${frame.mobilePadding}px;top:-${frame.mobilePadding}px;bottom:-${frame.mobilePadding}px;width:auto;height:auto;overflow:visible}
      #${instance}.um-mobile .um-panel{position:absolute;left:0;right:0;bottom:0;width:100%;height:${mobileSheetHeight}px;border-radius:${panel.radius}px}
      #${instance}.um-mobile .um-navigation{top:${frame.mobilePadding + nav.offset}px;${nav.placement}:${frame.mobilePadding + nav.offset}px}
      #${instance}.um-mobile .um-back{left:${frame.mobilePadding + nav.offset}px;top:${frame.mobilePadding + (nav.show && interaction.zoom ? nav.offset + 66 : nav.offset)}px}
      #${instance}.um-mobile .um-map-footer{left:${frame.mobilePadding}px;right:${frame.mobilePadding}px;bottom:${frame.mobilePadding + mobileSheetHeight + (bar.show ? frame.gap : 0)}px}
      #${instance}.um-mobile .um-svg{margin-top:0;width:100%;height:100%}
      #${instance} .um-svg.um-picking{cursor:crosshair}
      #${instance} .um-dot--unplaced{fill:none;stroke:${dots.color};stroke-width:1.5px;stroke-dasharray:2 1.5}
      #${instance} .um-pick{position:absolute;z-index:6;left:50%;top:${frame.verticalPadding + 12}px;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:8px;align-items:center;max-width:calc(100% - 24px);padding:10px 14px;border-radius:16px;background:#1c1c1c;color:#fff;font-size:13px;line-height:1.3;box-shadow:0 12px 40px rgba(0,0,0,.2)}
      #${instance} .um-pick button{border:0;border-radius:10px;background:${dots.color};color:#fff;padding:6px 10px;font:inherit;font-weight:600;cursor:pointer}
      #${instance}.um-mobile .um-pick{top:${frame.mobilePadding + 12}px}
      @media(prefers-reduced-motion:reduce){#${instance} .um-region,#${instance} .um-district,#${instance} .um-row,#${instance} .um-cta{transition:none}}
    `}</style>

      <div className={'um-layout' + (bar.show ? '' : ' um-no-panel')}>
        {bar.show && (
          <aside className="um-panel" aria-label={ui.panelLabel}>
            <header className="um-panel-head">
              {selected && (
                <div className="um-breadcrumb">
                  <button type="button" onClick={() => openRegion(null)}>
                    {ui.country}
                  </button>
                  <span>/</span>
                  <span>{current?.name}</span>
                </div>
              )}
              <p className="um-eyebrow">
                <span>{ui.eyebrow}</span>
                <span className="um-eyebrow-divider">·</span>
                <span className="um-eyebrow-muted">{selected ? ui.eyebrowMarkets : ui.eyebrowRegions}</span>
              </p>
              <h2
                className="um-panel-title"
                style={{
                  ...headingFont,
                  ...(isMobile ? { fontSize: `min(${headingFont.fontSize}, ${panel.mobileTitleSize}px)` } : {}),
                }}
              >
                {selected ? fullName(selected) : ui.country}
              </h2>
              <div className="um-metrics">
                <div className="um-metric">
                  <strong>{current ? places.length : regionIds.length}</strong>
                  <span>{current ? ui.metricPlaces : ui.metricRegions}</span>
                </div>
                <div className="um-metric">
                  <strong>{current ? (current.hasRecords ? current.markets : '—') : total}</strong>
                  <span>{ui.metricMarkets}</span>
                </div>
              </div>
            </header>
            {selected && (
              <div className="um-tabs" role="tablist" aria-label={ui.regionInfo}>
                <button
                  type="button"
                  role="tab"
                  id={instance + '-markets-tab'}
                  aria-selected={panelTab === 'markets'}
                  aria-controls={instance + '-content'}
                  onClick={() => setPanelTab('markets')}
                >
                  {ui.tabMarkets} {current?.hasRecords ? `(${current.markets})` : ''}
                </button>
                <button
                  type="button"
                  role="tab"
                  id={instance + '-places-tab'}
                  aria-selected={panelTab === 'places'}
                  aria-controls={instance + '-content'}
                  onClick={() => setPanelTab('places')}
                >
                  {ui.tabPlaces}
                </button>
              </div>
            )}
            <div
              className="um-panel-content"
              id={instance + '-content'}
              key={(selected || 'home') + panelTab}
              role={selected ? 'tabpanel' : undefined}
              aria-labelledby={
                selected ? instance + (panelTab === 'markets' ? '-markets-tab' : '-places-tab') : undefined
              }
            >
              {!selected && (
                <nav aria-label={ui.regionsNav}>
                  {regionIds.map((id) => {
                    const r = regions[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        className="um-row um-region-row"
                        data-sidebar-region={id}
                        aria-label={
                          fullName(id) + ': ' + (r.hasRecords ? fill(ui.marketsCount, r.markets) : ui.notListed)
                        }
                        onClick={() => openRegion(id)}
                        onPointerEnter={(e) => {
                          if (e.pointerType !== 'touch') show(id, e);
                        }}
                        onPointerLeave={leave}
                        onFocus={(e) => focus(id, e.currentTarget)}
                        onBlur={leave}
                      >
                        <span className="um-row-name">
                          {r.name}
                          <span className="um-row-kind">{r.kind}</span>
                        </span>
                        <span className="um-row-count">{r.hasRecords ? r.markets : '—'}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
              {current && !current.hasRecords && (
                <div className="um-empty">
                  <span className="um-empty-icon" aria-hidden="true">
                    ↗
                  </span>
                  <p style={ctaFont}>{invitation.text}</p>
                  <a style={buttonFont} className="um-cta" href={invitation.href}>
                    {invitation.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                  <small>{invitation.note}</small>
                </div>
              )}
              {current && panelTab === 'markets' && current.hasRecords && (
                <>
                  <h3 className="um-section-title">
                    {ui.allMarkets} · {current.markets}
                  </h3>
                  <div className="um-market-list">
                    {current.records.map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        className="um-row um-market-row"
                        data-sidebar-market={m.id}
                        aria-pressed={pickedMarket === m.id}
                        onClick={(e) => select(m.region, e, m.id)}
                      >
                        <span className="um-market-number">{i + 1}</span>
                        <span className="um-row-name">
                          {m.name}
                          <span className="um-row-kind">{kindLabel(m)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {current && panelTab === 'places' && (
                <>
                  {(
                    [
                      [ui.cities, cities],
                      [ui.districts, tumans],
                    ] as const
                  ).map(([label, list]) =>
                    list.length ? (
                      <section key={label}>
                        <h3 className="um-section-title">
                          {label} · {list.length}
                        </h3>
                        {list.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="um-row um-place-row"
                            data-sidebar-district={d.id}
                            aria-pressed={pickedDistrict === d.id}
                            onClick={() => pickDistrict(d)}
                          >
                            <span
                              className="um-row-chip"
                              style={{ borderRadius: d.city ? '50%' : 3, background: shade(d.c) }}
                            />
                            <span className="um-row-name">
                              {d.name}
                              <span className="um-row-kind">{d.city ? ui.city : ui.district}</span>
                            </span>
                          </button>
                        ))}
                      </section>
                    ) : null,
                  )}
                  <p className="um-summary" style={{ fontSize: 12, padding: 10 }}>
                    {ui.boundariesNote}
                  </p>
                </>
              )}
            </div>
          </aside>
        )}
        <div className="um-stage">
          <svg
            ref={svg}
            className={'um-svg' + (dragging ? ' um-dragging' : '') + (pick ? ' um-picking' : '')}
            viewBox={`${camera.x} ${camera.y} ${camera.width} ${camera.height}`}
            tabIndex={0}
            role="group"
            aria-label={ui.mapLabel}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={(e) => finishPointer(e.pointerId)}
            onPointerCancel={(e) => finishPointer(e.pointerId)}
            onKeyDown={keyDown}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.preventDefault();
                e.stopPropagation();
                suppressClick.current = false;
              } else if (pick) {
                /* Picker mode: a click records coordinates instead of selecting anything. */
                e.preventDefault();
                e.stopPropagation();
                const w = world(local(e));
                setPicked({ x: Math.round(w.x * 100) / 100, y: Math.round(w.y * 100) / 100 });
                setCopied(false);
              }
            }}
          >
            <title>{ui.mapTitle}</title>
            <desc>{fill(ui.mapSummary, total)}</desc>

            {SHAPES.map((shape) => (
              <path
                key={shape.id}
                className="um-region"
                data-region={shape.id}
                d={shape.d}
                fillRule="evenodd"
                fill={
                  selected
                    ? shape.id === selected
                      ? map.fill
                      : `color-mix(in srgb, ${map.fill} ${map.inactiveOpacity}%, ${map.background})`
                    : hovered === shape.id
                      ? map.active
                      : map.fill
                }
                stroke={map.border}
                strokeWidth={map.borderWidth}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="button"
                aria-label={fullName(shape.id)}
                aria-pressed={selected === shape.id}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch' && selected !== shape.id) show(shape.id, e);
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch' && selected !== shape.id) show(shape.id, e);
                }}
                onPointerLeave={leave}
                onFocus={(e) => focus(shape.id, e.currentTarget)}
                onBlur={leave}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!suppressClick.current) openRegion(shape.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openRegion(shape.id);
                  }
                }}
              />
            ))}
            {places.map((d) => (
              <path
                key={d.id}
                className="um-district"
                data-district={d.id}
                data-region={d.r}
                d={d.d}
                fillRule="evenodd"
                fill={pickedDistrict === d.id ? map.active : shade(d.c)}
                stroke={map.border}
                strokeWidth={details.districtBorderWidth}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="button"
                aria-label={districtName(d)}
                aria-pressed={pickedDistrict === d.id}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') show(d.r, e, undefined, false, d.id);
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'touch') show(d.r, e, undefined, false, d.id);
                }}
                onPointerLeave={leave}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!suppressClick.current) pickDistrict(d);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pickDistrict(d);
                  }
                }}
              />
            ))}
            {selected && (
              <path
                d={SHAPES.find((shape) => shape.id === selected)?.d}
                fill="none"
                stroke={details.outlineColor}
                strokeWidth={details.outlineWidth}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {visibleLabels.map((d) => (
              <text
                key={d.id}
                x={d.lp[0]}
                y={d.lp[1]}
                fill={details.color}
                fontFamily="inherit"
                fontSize={labelSize / scale}
                fontWeight={labelFont.fontWeight}
                textAnchor="middle"
                dominantBaseline="central"
                stroke={details.labelHalo}
                strokeWidth={details.haloWidth / scale}
                strokeLinejoin="round"
                style={{ ...labelFont, fontSize: labelSize / scale, paintOrder: 'stroke', pointerEvents: 'none' }}
              >
                {d.name}
              </text>
            ))}
            {props.markets
              .filter((m) => !selected || m.region === selected)
              .map((m) => (
                <g
                  key={m.id}
                  className="um-market"
                  data-region={m.region}
                  data-market={m.id}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'touch') show(m.region, e, m.id);
                  }}
                  onPointerMove={(e) => {
                    if (e.pointerType !== 'touch') show(m.region, e, m.id);
                  }}
                  onPointerLeave={leave}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(m.region, e, m.id);
                  }}
                >
                  <circle className="um-dot-hit" cx={m.x} cy={m.y} r={Math.max(dots.size, 6) / scale} />
                  <circle
                    className={'um-dot' + (pick && !m.placed ? ' um-dot--unplaced' : '')}
                    cx={m.x}
                    cy={m.y}
                    r={dots.size / scale}
                    stroke={dots.border}
                    strokeWidth={dots.borderWidth}
                    vectorEffect="non-scaling-stroke"
                    style={pickedMarket === m.id ? { fill: dots.hoverColor } : undefined}
                  />
                </g>
              ))}
            {picked && (
              <g className="um-pick-cross" pointerEvents="none">
                <circle
                  cx={picked.x}
                  cy={picked.y}
                  r={7 / scale}
                  fill="none"
                  stroke="#1c1c1c"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={picked.x - 12 / scale}
                  x2={picked.x + 12 / scale}
                  y1={picked.y}
                  y2={picked.y}
                  stroke="#1c1c1c"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={picked.x}
                  x2={picked.x}
                  y1={picked.y - 12 / scale}
                  y2={picked.y + 12 / scale}
                  stroke="#1c1c1c"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}
          </svg>
          {nav.show && interaction.zoom && (
            <div className="um-navigation" role="group" aria-label={ui.mapControls}>
              <button
                type="button"
                aria-label={ui.zoomIn}
                disabled={zoom >= maximum - 1e-6}
                onClick={() => zoomAt(1.4)}
              >
                +
              </button>
              <button type="button" aria-label={ui.zoomOut} disabled={zoom <= 1 + 1e-6} onClick={() => zoomAt(1 / 1.4)}>
                −
              </button>
              <span className="um-level">{Math.round(zoom * 100)}%</span>
              <button type="button" className="um-reset" aria-label={ui.resetView} onClick={reset}>
                {ui.reset}
              </button>
            </div>
          )}
          {selected && (
            <button type="button" className="um-back" onClick={() => openRegion(null)}>
              <span aria-hidden="true">←</span>
              {ui.allRegions}
            </button>
          )}
          {pick && (
            /* Editor tool reached only via ?pick, so its wording is not part of the CMS. */
            <div className="um-pick" role="status">
              <strong>Koordinata rejimi</strong>
              {picked ? (
                <>
                  <button type="button" onClick={() => copy(picked.x)}>
                    X {picked.x}
                  </button>
                  <button type="button" onClick={() => copy(picked.y)}>
                    Y {picked.y}
                  </button>
                  <span>{copied ? 'Nusxalandi' : 'Nusxa olish uchun bosing'}</span>
                </>
              ) : (
                <span>Xaritada bozor joylashgan nuqtani bosing</span>
              )}
            </div>
          )}
          <div className="um-map-footer">
            <div className="um-map-note">
              <span className="um-legend-dot" />
              <div>
                <strong>{ui.legendTitle}</strong>
                <small>{ui.legendNote}</small>
              </div>
            </div>
            <a
              className="um-credit"
              href="https://www.geoboundaries.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UN OCHA / geoBoundaries 2020, CC BY 3.0 IGO"
            >
              UN OCHA / geoBoundaries 2020
            </a>
          </div>
        </div>
      </div>
      {tip && stats && tt.show && (
        <div
          ref={tipElement}
          className="um-tip"
          role={tip.pinned ? 'dialog' : 'tooltip'}
          aria-label={stats.name + ' ' + ui.tipInfo}
          style={{ ...tooltipFont, ...tipPosition, pointerEvents: tip.pinned ? 'auto' : 'none' }}
        >
          {tip.pinned && (
            <button type="button" className="um-tip-close" aria-label={ui.tipClose} onClick={dismiss}>
              ×
            </button>
          )}
          <div className="um-kicker">
            {market
              ? fullName(tip.region) + ' · ' + ui.approximate
              : tipDistrict
                ? fullName(tip.region)
                : ui.eyebrowMarkets}
          </div>
          <h3 className="um-tip-title">
            {market ? market.name : tipDistrict ? districtName(tipDistrict) : fullName(tip.region)}
          </h3>
          <div className="um-tip-row um-tip-total">
            <span>{tipDistrict ? ui.tipRegionTotal : ui.tipTotal}</span>
            <strong>{stats.hasRecords ? number.format(stats.markets) : '—'}</strong>
          </div>
          <div className="um-tip-row">
            <span>{ui.tipFarmers}</span>
            <strong>{stats.hasRecords ? stats.farmers : '—'}</strong>
          </div>
          <div className="um-tip-row">
            <span>{ui.tipGoods}</span>
            <strong>{stats.hasRecords ? stats.goods : '—'}</strong>
          </div>
          <div className="um-tip-row">
            <span>{ui.tipVehicle}</span>
            <strong>{stats.hasRecords ? stats.vehicle : '—'}</strong>
          </div>
          <p className="um-tip-note">
            {market
              ? kindLabel(market) + '. ' + ui.tipMarketNote
              : tipDistrict
                ? ui.tipDistrictNote
                : stats.hasRecords
                  ? fill(ui.tipBranches, stats.branches)
                  : ui.noData}
          </p>
          {!tip.pinned && (
            <p className="um-tip-note">{market ? ui.hintMarket : tipDistrict ? ui.hintDistrict : ui.hintRegion}</p>
          )}
        </div>
      )}
    </div>
  );
}

import { $, clamp, reduceMotion } from './dom';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Globe: N frames scrubbed by scroll position, drawn to a canvas. The first
 * frame is a plain <img> so there is always something to see. On data-saver
 * or slow connections the frames are never downloaded.
 */
export function initGlobe(): void {
  const box = $('#globe');
  const canvas = box && $<HTMLCanvasElement>('canvas', box);
  if (!box || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (conn?.saveData || /^(slow-)?2g$/.test(conn?.effectiveType ?? '')) return;

  const COUNT = Math.max(1, Number(box.dataset.frames) || 80);
  const pattern = box.dataset.src || '/earth/earth-{i}.webp';
  const SMOOTHING = 110;
  const frames: Array<HTMLImageElement & { ready?: boolean }> = new Array(COUNT);
  let started = false;
  let active = false;
  let current = 0;
  let target = 0;
  let drawn = -1;
  let raf = 0;
  let lastT = 0;

  const src = (i: number) => pattern.replace('{i}', String(i).padStart(2, '0'));

  const load = (i: number): void => {
    if (frames[i]) return;
    const im: HTMLImageElement & { ready?: boolean } = new Image();
    im.decoding = 'async';
    im.onload = () => {
      im.ready = true;
      wake();
    };
    im.src = src(i);
    frames[i] = im;
  };

  const loadAll = (): void => {
    if (started) return;
    started = true;
    const order: number[] = [];
    const c = Math.round(target);
    for (let d = 0; d < COUNT; d++) {
      if (c + d < COUNT) order.push(c + d);
      if (d && c - d >= 0) order.push(c - d);
    }
    let k = 0;
    const next = () => {
      for (let n = 0; n < 6 && k < order.length; n++, k++) load(order[k]!);
      if (k < order.length) setTimeout(next, 60);
    };
    next();
  };

  const nearestReady = (i: number): number => {
    for (let d = 0; d < COUNT; d++) {
      if (frames[i - d]?.ready) return i - d;
      if (frames[i + d]?.ready) return i + d;
    }
    return -1;
  };

  const measure = (): void => {
    const r = box.getBoundingClientRect();
    const vh = innerHeight;
    active = r.top < vh && r.bottom > 0;
    target = clamp((vh - r.top) / Math.max(1, vh + r.height), 0, 1) * (COUNT - 1);
    if (!active) current = target;
    if (started) wake();
  };

  const wake = (): void => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = (t: number): void => {
    raf = 0;
    if (active) {
      const dt = clamp(t - (lastT || t - 16.67), 1, 64);
      lastT = t;
      const k = reduceMotion() ? 1 : 1 - Math.exp(-dt / SMOOTHING);
      const maxStep = Math.max(1, dt / 16.67);
      let next = current + clamp((target - current) * k, -maxStep, maxStep);
      if (Math.abs(target - next) < 0.015) next = target;
      current = next;
    }
    const f = nearestReady(Math.round(current));
    if (f >= 0 && f !== drawn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[f]!, 0, 0, canvas.width, canvas.height);
      drawn = f;
      box.classList.add('is-live');
    }
    if (active && current !== target) wake();
    else lastT = 0;
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          measure();
          loadAll();
        }
      },
      { rootMargin: '600px 0px' },
    ).observe(box);
  } else {
    loadAll();
  }
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure, { passive: true });
  measure();
}

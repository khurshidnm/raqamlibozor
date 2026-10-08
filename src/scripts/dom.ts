/** Small DOM helpers shared by the behaviour modules. */

export const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

export const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const phoneQuery = (): MediaQueryList => matchMedia('(max-width: 809.98px)');

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Parses "530ms" / ".53s" into milliseconds. */
export function toMs(value: string): number {
  const n = parseFloat(value) || 0;
  return /ms$/.test(value) ? n : n * 1000;
}

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/** Web Animations helper: falls back to a cubic-bezier when the browser rejects a linear() easing. */
export function animate(el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation | null {
  if (!el || !('animate' in el)) return null;
  try {
    return el.animate(frames, opts);
  } catch {
    return el.animate(frames, { ...opts, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
}

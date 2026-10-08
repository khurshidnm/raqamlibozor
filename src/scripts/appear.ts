import { $$ } from './dom';

/**
 * Reveals `.appear` elements (and the intro sentence) once, when roughly half
 * of them is visible. Elements taller than half the viewport reveal as soon as
 * they intersect, so nothing can stay hidden on short screens.
 */
export function initAppear(): void {
  const targets = $$('.appear, .intro__text');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const viewport = entry.rootBounds?.height ?? innerHeight;
        const needed = Math.min(0.5, (viewport * 0.5) / Math.max(1, entry.boundingClientRect.height));
        if (entry.intersectionRatio >= needed) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: [0, 0.1, 0.25, 0.5] },
  );
  targets.forEach((t) => io.observe(t));
}

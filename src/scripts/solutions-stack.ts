import { $, $$, clamp, reduceMotion } from './dom';

/** Sticky stack: every card shrinks 5% for each following card that arrives. */
export function initSolutionsStack(): void {
  const list = $('#stack');
  if (!list) return;
  const cards = $$('.scard', list);
  if (!cards.length) return;

  const N = cards.length;
  const cur = cards.map(() => 1);
  const target = cur.slice();
  let raf = 0;
  let lastT = 0;

  const measure = (): void => {
    const rect = list.getBoundingClientRect();
    const zoom = rect.width / (list.offsetWidth || rect.width) || 1; // page zoom on large screens
    const cs = getComputedStyle(list);
    const gap = (parseFloat(cs.rowGap) || 0) * zoom;
    let y = rect.top + scrollY + (parseFloat(cs.paddingTop) || 0) * zoom; // natural (un-stuck) top of card 1
    const half = innerHeight / 2;
    for (let i = 0; i < N; i++) {
      const card = cards[i]!;
      const pitch = card.offsetHeight * zoom + gap;
      const progress = clamp((scrollY - (y - half)) / pitch, 0, N - i);
      target[i] = 1 - 0.05 * progress;
      y += pitch;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = (t: number): void => {
    raf = 0;
    const dt = clamp(t - (lastT || t - 16.7), 1, 64);
    lastT = t;
    const k = reduceMotion() ? 1 : 1 - Math.exp(-dt / 130);
    let moving = false;
    for (let i = 0; i < N; i++) {
      const d = target[i]! - cur[i]!;
      if (Math.abs(d) < 0.0004) cur[i] = target[i]!;
      else {
        cur[i]! += d * k;
        moving = true;
      }
      cards[i]!.style.setProperty('--scale', cur[i]!.toFixed(4));
    }
    if (moving) raf = requestAnimationFrame(tick);
    else lastT = 0;
  };

  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure, { passive: true });
  measure();
}

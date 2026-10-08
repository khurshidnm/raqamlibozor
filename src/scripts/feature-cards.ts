import { $, $$ } from './dom';

/** Notification stack + icon tiles. Both loop only while the features section is on screen. */
export function initFeatureCards(): void {
  const section = $('#imkoniyatlar');
  if (!section) return;

  const loops: Array<() => void> = [];

  const notifs = $$('#notifStack .notif__item');
  if (notifs.length) {
    const n = notifs.length;
    let i = 0;
    const layout = () => {
      notifs.forEach((el, a) => {
        const o = (a - i + n) % n;
        el.style.setProperty('--y', `${o * -26}px`);
        el.style.setProperty('--s', String(1 - o * 0.12));
        el.style.zIndex = String(n - o);
        el.classList.toggle('is-front', o === 0);
      });
    };
    layout();
    loops.push(() => {
      i = (i + 1) % n;
      layout();
    });
  }

  const tiles = $$('#tiles .tiles__item');
  if (tiles.length === 3) {
    let a = 0;
    const layout = () => {
      tiles.forEach((el, t) => {
        const pos = (t + a) % 3; // 0 = left, 1 = centre, 2 = right
        el.style.setProperty('--x', `${pos === 1 ? 0 : pos === 0 ? -105 : 105}px`);
        el.style.setProperty('--s', pos === 1 ? '1' : '.85');
        el.classList.toggle('is-center', pos === 1);
      });
    };
    layout();
    loops.push(() => {
      a = (a + 1) % 3;
      layout();
    });
  }
  if (!loops.length) return;

  let timer: ReturnType<typeof setInterval> | undefined;
  let visible = true;
  const schedule = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    if (!visible || document.hidden) return;
    timer = setInterval(() => loops.forEach((step) => step()), 2500);
  };
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      schedule();
    }).observe(section);
  } else {
    schedule();
  }
}

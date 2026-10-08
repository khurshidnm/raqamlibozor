/**
 * Large screens: the 1440px layout is zoomed at half the rate of the extra width.
 * The initial value is set before first paint by the inline script in src/lib/inline-scripts.ts;
 * this keeps it in sync on resize.
 */
export function initPageZoom(): void {
  const root = document.documentElement;
  const apply = () => {
    const w = root.clientWidth;
    const z = w >= 1440 ? 1 + (w / 1440 - 1) * 0.5 : 1;
    root.style.setProperty('--page-zoom', z.toFixed(4));
  };
  apply();
  addEventListener('resize', apply, { passive: true });
}

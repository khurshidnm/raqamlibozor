const SEEN_KEY = 'rb-loaded';
/** Keeps the loader up long enough to read as intentional rather than a flash. */
const MIN_VISIBLE_MS = 600;
/** Never hold the page back longer than this, even if some asset is slow. */
const MAX_WAIT_MS = 2500;

/**
 * Hides the page loader once the window has loaded and remembers it for the
 * session. Resolves when the page is revealed, so entrance animations can start then.
 */
export function initLoader(): Promise<void> {
  const root = document.documentElement;
  const el = document.getElementById('pageLoader');
  if (!el || root.classList.contains('loader-skip')) {
    el?.remove();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let done = false;
    const reveal = (): void => {
      if (done) return;
      done = true;
      setTimeout(
        () => {
          root.classList.add('is-loaded');
          try {
            sessionStorage.setItem(SEEN_KEY, '1');
          } catch {
            /* storage blocked: the loader simply shows again next time */
          }
          resolve();
          setTimeout(() => el.remove(), 700);
        },
        Math.max(0, MIN_VISIBLE_MS - performance.now()),
      );
    };
    if (document.readyState === 'complete') reveal();
    else addEventListener('load', reveal, { once: true });
    setTimeout(reveal, MAX_WAIT_MS);
  });
}

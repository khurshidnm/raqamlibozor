type Win = Window & { dataLayer?: unknown[]; ym?: (...args: unknown[]) => void };

function addScript(src: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Loads Google Tag Manager and Yandex Metrika when their IDs are set in Site settings (read from <body data-*>). */
export function initAnalytics(): void {
  const win = window as Win;
  const { gtm, ym } = document.body.dataset;

  if (gtm) {
    win.dataLayer = win.dataLayer ?? [];
    win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtm)}`);
  }

  if (ym) {
    const id = Number(ym);
    const queue: unknown[][] = [];
    const stub = (...args: unknown[]): void => {
      queue.push(args);
    };
    (stub as unknown as { a: unknown[][]; l: number }).a = queue;
    (stub as unknown as { a: unknown[][]; l: number }).l = Date.now();
    win.ym = win.ym ?? stub;
    addScript('https://mc.yandex.ru/metrika/tag.js');
    win.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
}

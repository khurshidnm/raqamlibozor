/** Sends the "demo requested" conversion to whichever analytics tags the CMS enabled. All calls are no-ops when absent. */

type Fn = (...args: unknown[]) => void;
interface TrackingWindow {
  dataLayer?: unknown[];
  gtag?: Fn;
  ym?: Fn;
  fbq?: Fn;
}

export function trackDemoRequest(yandexCounterId = ''): void {
  const w = window as unknown as TrackingWindow;
  try {
    w.dataLayer?.push({ event: 'demo_request' });
    w.gtag?.('event', 'generate_lead');
    if (yandexCounterId) w.ym?.(Number(yandexCounterId), 'reachGoal', 'demo_request');
    w.fbq?.('track', 'Lead');
  } catch {
    /* Analytics must never break the form. */
  }
}

import type { TrackingSettings } from '../content/schema';

/**
 * Analytics / tag-manager snippets generated from CMS ids. IDs are validated by the
 * schema (strict patterns), so they are safe to interpolate. Inline scripts emitted here are
 * hashed into the Content-Security-Policy by src/integrations/build-extras.ts.
 */

const q = (value: string): string => JSON.stringify(value);

const gtmScript = (id: string): string =>
  `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${q(id)});`;

const ga4Script = (id: string): string =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${q(id)});`;

const yandexScript = (id: string): string =>
  `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${id},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});`;

const pixelScript = (id: string): string =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${q(id)});fbq('track','PageView');`;

/** HTML for the end of `<head>`. */
export function trackingHead(t: TrackingSettings): string {
  const out: string[] = [];
  if (t.gtm) out.push(`<script>${gtmScript(t.gtm)}</script>`);
  if (t.ga4) {
    out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${t.ga4}"></script>`);
    out.push(`<script>${ga4Script(t.ga4)}</script>`);
  }
  if (t.yandexMetrica) out.push(`<script>${yandexScript(t.yandexMetrica)}</script>`);
  if (t.metaPixel) out.push(`<script>${pixelScript(t.metaPixel)}</script>`);
  if (t.customHead.trim()) out.push(t.customHead.trim());
  return out.join('\n');
}

/** HTML for right after `<body>` (no-JS fallbacks and custom body snippets). */
export function trackingBodyStart(t: TrackingSettings): string {
  const out: string[] = [];
  if (t.gtm) {
    out.push(
      `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${t.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    );
  }
  if (t.yandexMetrica) {
    out.push(
      `<noscript><div><img src="https://mc.yandex.ru/watch/${t.yandexMetrica}" style="position:absolute;left:-9999px" alt="" /></div></noscript>`,
    );
  }
  if (t.metaPixel) {
    out.push(
      `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${t.metaPixel}&amp;ev=PageView&amp;noscript=1" alt="" /></noscript>`,
    );
  }
  if (t.customBodyStart.trim()) out.push(t.customBodyStart.trim());
  return out.join('\n');
}

export interface CspSources {
  script: string[];
  connect: string[];
  img: string[];
  frame: string[];
}

/** Extra Content-Security-Policy sources needed by the enabled providers and the CMS allow-list. */
export function trackingCspSources(t: TrackingSettings): CspSources {
  const s: CspSources = { script: [], connect: [], img: [], frame: [] };
  if (t.gtm || t.ga4) {
    s.script.push('https://www.googletagmanager.com');
    s.connect.push(
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
    );
    s.img.push('https://www.google-analytics.com', 'https://www.googletagmanager.com');
  }
  if (t.gtm) s.frame.push('https://www.googletagmanager.com');
  if (t.yandexMetrica) {
    s.script.push('https://mc.yandex.ru');
    s.connect.push('https://mc.yandex.ru', 'wss://mc.yandex.ru');
    s.img.push('https://mc.yandex.ru');
  }
  if (t.metaPixel) {
    s.script.push('https://connect.facebook.net');
    s.connect.push('https://www.facebook.com', 'https://connect.facebook.net');
    s.img.push('https://www.facebook.com');
  }
  for (const { host } of t.cspHosts) {
    s.script.push(host);
    s.connect.push(host);
    s.img.push(host);
    s.frame.push(host);
  }
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, [...new Set(v)]])) as unknown as CspSources;
}

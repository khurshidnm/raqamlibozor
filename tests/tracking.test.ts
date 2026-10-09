import { describe, expect, it } from 'vitest';
import { inlineScripts } from '../src/integrations/build-extras';
import { trackingSettingsSchema } from '../src/content/schema';
import { trackingBodyStart, trackingCspSources, trackingHead } from '../src/lib/tracking';

const parse = (input: object) => trackingSettingsSchema.parse(input);
const empty = parse({});

describe('trackingSettingsSchema', () => {
  it('accepts valid ids and empty values', () => {
    expect(() =>
      parse({ gtm: 'GTM-ABC1234', ga4: 'G-ABCDE12345', yandexMetrica: '12345678', metaPixel: '123456789012' }),
    ).not.toThrow();
    expect(() => parse({ gtm: '', ga4: '' })).not.toThrow();
  });
  it('rejects ids that could break out of the snippet', () => {
    expect(() => parse({ gtm: "GTM-1');alert(1)//" })).toThrow();
    expect(() => parse({ yandexMetrica: '1);alert(1)' })).toThrow();
    expect(() => parse({ cspHosts: [{ host: 'http://insecure.test' }] })).toThrow();
  });
});

describe('tracking snippets', () => {
  it('emit nothing when nothing is configured', () => {
    expect(trackingHead(empty)).toBe('');
    expect(trackingBodyStart(empty)).toBe('');
    expect(trackingCspSources(empty)).toEqual({ script: [], connect: [], img: [], frame: [] });
  });
  it('emit each provider with its noscript fallback', () => {
    const t = parse({ gtm: 'GTM-ABC1234', ga4: 'G-ABCDE12345', yandexMetrica: '12345678', metaPixel: '987654321' });
    const head = trackingHead(t);
    expect(head).toContain('GTM-ABC1234');
    expect(head).toContain('gtag/js?id=G-ABCDE12345');
    expect(head).toContain("ym(12345678,'init'");
    expect(head).toContain('fbq(\'init\',"987654321")');
    const body = trackingBodyStart(t);
    expect(body).toContain('ns.html?id=GTM-ABC1234');
    expect(body).toContain('mc.yandex.ru/watch/12345678');
    expect(body).toContain('facebook.com/tr?id=987654321');
  });
  it('adds only the CSP sources of enabled providers plus the CMS allow-list', () => {
    const csp = trackingCspSources(
      parse({ yandexMetrica: '12345678', cspHosts: [{ host: 'https://cdn.hotjar.test' }] }),
    );
    expect(csp.script).toEqual(['https://mc.yandex.ru', 'https://cdn.hotjar.test']);
    expect(csp.connect).toContain('wss://mc.yandex.ru');
    expect(csp.frame).toEqual(['https://cdn.hotjar.test']);
  });
  it('appends custom code verbatim', () => {
    expect(trackingHead(parse({ customHead: '  <script>x()</script> ' }))).toBe('<script>x()</script>');
  });
});

describe('inlineScripts', () => {
  it('finds executable inline scripts only', () => {
    const html = [
      '<script>one()</script>',
      '<script async src="https://x.test/a.js"></script>',
      '<script type="application/ld+json">{"a":1}</script>',
      '<script type="module" src="/_astro/a.js"></script>',
      '<script type="text/javascript">two()</script>',
    ].join('\n');
    expect(inlineScripts(html)).toEqual(['one()', 'two()']);
  });
});

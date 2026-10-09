import { describe, expect, it } from 'vitest';
import { localePath, localizeHref } from '../src/lib/locale';

describe('localePath', () => {
  it('serves the default locale at the root', () => {
    expect(localePath('uz', 'uz')).toBe('/');
    expect(localePath('ru', 'uz')).toBe('/ru/');
  });
});

describe('localizeHref', () => {
  it('prefixes internal paths for non-default locales', () => {
    expect(localizeHref('/news/', 'ru', 'uz')).toBe('/ru/news/');
  });
  it('leaves the default locale, anchors, external and already-prefixed links alone', () => {
    expect(localizeHref('/news/', 'uz', 'uz')).toBe('/news/');
    expect(localizeHref('#faq', 'ru', 'uz')).toBe('#faq');
    expect(localizeHref('https://realsoft.uz', 'ru', 'uz')).toBe('https://realsoft.uz');
    expect(localizeHref('//cdn.example.com/x', 'ru', 'uz')).toBe('//cdn.example.com/x');
    expect(localizeHref('/ru/news/', 'ru', 'uz')).toBe('/ru/news/');
    expect(localizeHref('', 'ru', 'uz')).toBe('');
  });
});

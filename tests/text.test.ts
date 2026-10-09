import { describe, expect, it } from 'vitest';
import { jsonForScript } from '../src/lib/text';

describe('jsonForScript', () => {
  it('escapes "<" so a value cannot close the surrounding script tag', () => {
    const out = jsonForScript({ t: '</script><b>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ t: '</script><b>' });
  });
});

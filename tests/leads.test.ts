import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLead, leadId, normalizePhone, sanitizePage, tashkentDateTime } from '../src/lib/leads';

describe('leads', () => {
  it('normalises Uzbek numbers and rejects everything else', () => {
    expect(normalizePhone('+998 90 123 45 67')).toBe('+998901234567');
    expect(normalizePhone('998901234567')).toBe('+998901234567');
    expect(normalizePhone('901234567')).toBe('+998901234567');
    expect(normalizePhone('+998 90 123 45')).toBeNull();
    expect(normalizePhone('+7 912 345 67 89')).toBeNull();
    expect(normalizePhone(12345)).toBeNull();
  });

  it('stamps leads in Tashkent time (UTC+5)', () => {
    const at = new Date('2026-10-08T16:50:12Z');
    expect(tashkentDateTime(at)).toBe('2026-10-08T21:50');
    expect(leadId(at, '+998901234567')).toBe('20261008-215012-4567');
    expect(leadId(new Date('2026-12-31T20:00:00Z'), '+998901234567')).toMatch(/^20270101-010000-4567$/);
  });

  it('keeps only same-site paths', () => {
    expect(sanitizePage('/')).toBe('/');
    expect(sanitizePage('/ru/bozorlar/')).toBe('/ru/bozorlar/');
    expect(sanitizePage('https://evil.example/')).toBe('');
    expect(sanitizePage('/<script>')).toBe('');
  });

  it('creates new leads with an empty note', () => {
    expect(createLead('+998901234567', '/', new Date('2026-10-08T16:50:12Z'))).toEqual({
      phone: '+998901234567',
      submittedAt: '2026-10-08T21:50',
      page: '/',
      status: 'new',
      note: '',
    });
  });

  const root = resolve(import.meta.dirname, '..');
  it.runIf(existsSync(resolve(root, '.git')))(
    'never tracks lead files in git (phone numbers; public repository)',
    () => {
      const tracked = execFileSync('git', ['ls-files', 'src/content/leads'], { cwd: root, encoding: 'utf8' })
        .split('\n')
        .filter((f) => f.endsWith('.json'));
      expect(tracked).toEqual([]);
    },
  );
});

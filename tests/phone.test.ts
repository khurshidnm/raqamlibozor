import { describe, expect, it } from 'vitest';
import {
  extractNationalDigits,
  formatUzPhone,
  isCompleteUzPhone,
  toE164,
  UZ_DISPLAY_MAX_LENGTH,
} from '../src/lib/phone';

describe('extractNationalDigits', () => {
  it('strips formatting and the country code', () => {
    expect(extractNationalDigits('+998 90 123 45 67')).toBe('901234567');
    expect(extractNationalDigits('998901234567')).toBe('901234567');
    expect(extractNationalDigits('998 (93) 555-44-33')).toBe('935554433');
  });
  it('handles national numbers that themselves start with 998', () => {
    expect(extractNationalDigits('+998 99 8')).toBe('998');
    expect(extractNationalDigits('+998 99 812 3')).toBe('998123');
    expect(extractNationalDigits('+998 99 812 34 56')).toBe('998123456');
    expect(extractNationalDigits('998123456')).toBe('998123456');
  });
  it('caps at nine digits', () => {
    expect(extractNationalDigits('+998 90 123 45 67 89')).toBe('901234567');
  });
  it('returns an empty string for the bare prefix', () => {
    expect(extractNationalDigits('+998 ')).toBe('');
    expect(extractNationalDigits('')).toBe('');
  });
});

describe('formatUzPhone', () => {
  it('formats progressively while typing', () => {
    expect(formatUzPhone('')).toBe('+998 ');
    expect(formatUzPhone('9')).toBe('+998 9');
    expect(formatUzPhone('90')).toBe('+998 90');
    expect(formatUzPhone('901')).toBe('+998 90 1');
    expect(formatUzPhone('90123')).toBe('+998 90 123');
    expect(formatUzPhone('9012345')).toBe('+998 90 123 45');
    expect(formatUzPhone('901234567')).toBe('+998 90 123 45 67');
  });
  it('never exceeds the input maxlength', () => {
    expect(formatUzPhone('901234567').length).toBe(UZ_DISPLAY_MAX_LENGTH);
  });
});

describe('validation and E.164', () => {
  it('accepts only nine national digits', () => {
    expect(isCompleteUzPhone('901234567')).toBe(true);
    expect(isCompleteUzPhone('90123456')).toBe(false);
    expect(isCompleteUzPhone('')).toBe(false);
  });
  it('builds the E.164 form', () => {
    expect(toE164('901234567')).toBe('+998901234567');
  });
});

/**
 * Uzbek mobile numbers: +998 followed by 9 digits, displayed as +998 XX XXX XX XX.
 * Pure functions so they can be unit-tested and shared by the form script.
 */
export const UZ_COUNTRY_CODE = '998';
export const UZ_NATIONAL_LENGTH = 9;
export const UZ_DISPLAY_PREFIX = '+998 ';
/** "+998 90 123 45 67" is 17 characters. */
export const UZ_DISPLAY_MAX_LENGTH = 17;

/**
 * Keeps the national digits only: strips formatting, the country code and extra digits.
 * The 998 prefix is removed when the value is written internationally ("+998 …") or has
 * more than nine digits; a bare nine-digit number starting with 998 is kept as typed.
 */
export function extractNationalDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  const international = value.trimStart().startsWith('+');
  if (digits.startsWith(UZ_COUNTRY_CODE) && (international || digits.length > UZ_NATIONAL_LENGTH)) {
    digits = digits.slice(UZ_COUNTRY_CODE.length);
  }
  return digits.slice(0, UZ_NATIONAL_LENGTH);
}

/** Formats national digits progressively: "90" → "+998 90", "901234567" → "+998 90 123 45 67". */
export function formatUzPhone(nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, '').slice(0, UZ_NATIONAL_LENGTH);
  if (!d) return UZ_DISPLAY_PREFIX;
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return UZ_DISPLAY_PREFIX + groups.join(' ');
}

export function isCompleteUzPhone(nationalDigits: string): boolean {
  return /^\d{9}$/.test(nationalDigits);
}

/** E.164 form for APIs: "+998901234567". */
export function toE164(nationalDigits: string): string {
  return '+' + UZ_COUNTRY_CODE + nationalDigits;
}

/**
 * Pure helpers for website leads (phone numbers sent from the contact form).
 * Used by the /api/leads endpoint and covered by tests/leads.test.ts.
 */

export const LEAD_STATUSES = ['new', 'contacted', 'converted', 'rejected'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  phone: string;
  /** Tashkent local time, `YYYY-MM-DDTHH:mm` (the format Keystatic's datetime field stores). */
  submittedAt: string;
  page: string;
  status: LeadStatus;
  note: string;
}

const TIME_ZONE = 'Asia/Tashkent';

/** "+998 90 123-45-67", "998901234567" … → "+998901234567"; null for anything that is not a full Uzbek number. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 12 && digits.startsWith('998') ? digits.slice(3) : digits;
  return /^\d{9}$/.test(national) ? `+998${national}` : null;
}

function tashkentParts(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** `2026-10-08T21:50` in Tashkent time. */
export function tashkentDateTime(date: Date): string {
  const p = tashkentParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** File name / Keystatic slug: `20261008-215012-4567` (Tashkent time + last four digits), so the list sorts by arrival. */
export function leadId(date: Date, phone: string): string {
  const p = tashkentParts(date);
  return `${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}-${phone.slice(-4)}`;
}

/** Keeps only a same-site path such as "/" or "/ru/"; anything else becomes "". */
export function sanitizePage(value: unknown): string {
  if (typeof value !== 'string') return '';
  return /^\/[\w\-/]{0,100}$/.test(value) ? value : '';
}

export function createLead(phone: string, page: unknown, now: Date): Lead {
  return { phone, submittedAt: tashkentDateTime(now), page: sanitizePage(page), status: 'new', note: '' };
}

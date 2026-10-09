/**
 * POST /api/leads — stores a phone number from the contact form as a Keystatic
 * entry in src/content/leads/<id>.json (shown under “Leads” in /keystatic).
 *
 * Injected only where the CMS runs (`astro dev`, or a KEYSTATIC=true server build;
 * see astro.config.ts), so the public static site has no server code. The files are
 * excluded from git by scripts/protect-leads.mjs: the repository is public and must
 * never contain customers' numbers.
 *
 * Env: LEADS_DIR (default <cwd>/src/content/leads), LEADS_ALLOWED_ORIGINS
 * (comma-separated, added to the site URL from settings.json for cross-origin posts).
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import settings from '../content/settings.json';
import { createLead, leadId, normalizePhone } from '../lib/leads';

export const prerender = false;

const MAX_BODY_BYTES = 2_000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_IP = 5;

const dir = process.env.LEADS_DIR || join(process.cwd(), 'src/content/leads');
const allowed = new Set(
  [settings.siteUrl, ...(process.env.LEADS_ALLOWED_ORIGINS ?? '').split(',')]
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => new URL(u).origin),
);
/** In-memory guards: requests per client and recently stored numbers. */
const hits = new Map<string, number[]>();
const recentPhones = new Map<string, number>();

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const self = new URL(request.url).origin;
  const ok = origin && (origin === self || allowed.has(origin));
  return {
    'Content-Type': 'application/json',
    Vary: 'Origin',
    ...(ok
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      : {}),
  };
}

const reply = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers });

function tooMany(client: string, now: number): boolean {
  const recent = (hits.get(client) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(client, recent);
  return recent.length > MAX_PER_IP;
}

export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: 204, headers: corsHeaders(request) });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const headers = corsHeaders(request);
  const origin = request.headers.get('origin');
  if (origin && !headers['Access-Control-Allow-Origin']) return reply(403, { error: 'origin' }, headers);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply(413, { error: 'too_large' }, headers);
  let body: { phone?: unknown; page?: unknown; website?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return reply(400, { error: 'invalid_json' }, headers);
  }
  /* Honeypot filled: pretend success so bots learn nothing. */
  if (typeof body.website === 'string' && body.website) return reply(200, { ok: true }, headers);

  const phone = normalizePhone(body.phone);
  if (!phone) return reply(422, { error: 'invalid_phone' }, headers);

  const now = new Date();
  let client = 'unknown';
  try {
    client = clientAddress;
  } catch {
    /* not available in every adapter */
  }
  if (tooMany(client, now.getTime())) return reply(429, { error: 'too_many_requests' }, headers);
  /* The same number again within the window is acknowledged but not stored twice. */
  const last = recentPhones.get(phone);
  if (last && now.getTime() - last < WINDOW_MS) return reply(200, { ok: true }, headers);

  await mkdir(dir, { recursive: true });
  const base = leadId(now, phone);
  let id = base;
  for (let n = 2; existsSync(join(dir, `${id}.json`)); n++) id = `${base}-${n}`;
  const lead = createLead(phone, body.page, now);
  await writeFile(join(dir, `${id}.json`), JSON.stringify(lead, null, 2) + '\n', 'utf8');
  recentPhones.set(phone, now.getTime());
  return reply(201, { ok: true }, headers);
};

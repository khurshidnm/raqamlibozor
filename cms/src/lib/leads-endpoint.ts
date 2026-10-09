import type { Endpoint } from 'payload';
import { createLead, leadId, normalizePhone } from '../../../src/lib/leads';

const MAX_BODY_BYTES = 2_000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_IP = 5;

const hits = new Map<string, number[]>();
const recentPhones = new Map<string, number>();

function allowedOrigins(siteUrl: string): Set<string> {
  return new Set(
    [siteUrl, ...(process.env.LEADS_ALLOWED_ORIGINS ?? '').split(',')]
      .map((u) => u.trim())
      .filter(Boolean)
      .flatMap((u) => {
        try {
          return [new URL(u).origin];
        } catch {
          return [];
        }
      }),
  );
}

function corsHeaders(request: Request, allowed: Set<string>): Record<string, string> {
  const origin = request.headers.get('origin');
  const ok = origin && (origin === new URL(request.url).origin || allowed.has(origin));
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

async function siteOrigins(req: Parameters<Endpoint['handler']>[0]): Promise<Set<string>> {
  const settings = await req.payload.findGlobal({ slug: 'settings', depth: 0 });
  return allowedOrigins(settings.siteUrl ?? '');
}

/**
 * Public demo-request endpoint: POST /api/lead with {"phone", "page", "website"}.
 * Validation, honeypot, rate limit and duplicate suppression; the lead is stored in the private `leads` collection.
 */
export const leadEndpoints: Endpoint[] = [
  {
    path: '/lead',
    method: 'options',
    handler: async (req) =>
      new Response(null, { status: 204, headers: corsHeaders(req as Request, await siteOrigins(req)) }),
  },
  {
    path: '/lead',
    method: 'post',
    handler: async (req) => {
      const request = req as unknown as Request;
      const headers = corsHeaders(request, await siteOrigins(req));
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
      if (typeof body.website === 'string' && body.website) return reply(200, { ok: true }, headers);

      const phone = normalizePhone(body.phone);
      if (!phone) return reply(422, { error: 'invalid_phone' }, headers);

      const now = new Date();
      const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      if (tooMany(client, now.getTime())) return reply(429, { error: 'too_many_requests' }, headers);
      const last = recentPhones.get(phone);
      if (last && now.getTime() - last < WINDOW_MS) return reply(200, { ok: true }, headers);

      const lead = createLead(phone, body.page, now);
      await req.payload.create({
        collection: 'leads',
        data: { leadId: leadId(now, phone), phone, page: lead.page, status: 'new', submittedAt: now.toISOString() },
        overrideAccess: true,
      });
      recentPhones.set(phone, now.getTime());
      return reply(201, { ok: true }, headers);
    },
  },
];

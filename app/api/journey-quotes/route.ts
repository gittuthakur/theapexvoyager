import { NextResponse } from 'next/server';
import { createJourneyQuote } from '@/services/booking/journeyQuote.service';
import type { JourneyQuoteRequest, QuoteRejectionReason } from '@/services/booking/quote.types';
import { isRateLimited } from '@/lib/rateLimit';
import { formatINR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * The first PUBLIC surface for the Phase 9B quote service — POST only, no GET handler.
 * This route does exactly one thing: validate the shape of the request, hand it to the
 * existing `createJourneyQuote()`, and map its result to a customer-safe HTTP response.
 * It never computes a price itself, never touches MongoDB directly, never sends an
 * email/WhatsApp message, and never creates anything — see models/Booking.ts's own doc
 * comment: no Booking-creation flow exists yet.
 */

// Deliberately far smaller than app/api/booking-requests/route.ts's 100,000-byte cap —
// this payload is a handful of primitive fields plus a short addOnIds array, never free
// text. No shared byte-counted body-size helper exists yet in this codebase (only
// lib/rateLimit.ts's isRateLimited is a genuinely reusable cross-route helper today);
// extracting one now would mean also touching the existing, already-hardened
// booking-requests route, which is out of this phase's scope. This is the smallest
// local protection this new route needs on its own.
const MAX_BODY_BYTES = 5_000;
// lib/rateLimit.ts's isRateLimited() is a process-local, in-memory sliding window (a
// plain module-level Map — confirmed by reading that file directly, not assumed) —
// there is no shared/external store (Redis or otherwise) behind it. On a serverless
// platform (this project deploys to Vercel), each warm instance keeps its own
// independent counter, so a client whose requests land on N different instances can
// see up to roughly N x 30 requests/minute go through rather than a true global 30.
// This is a KNOWN, ACCEPTED limitation for this quote-only endpoint today — it costs
// nothing but a Mongo read (no email/WhatsApp/HBX/payment call), so the worst case of
// under-enforcement is wasted read capacity, not fraud or financial exposure. It is
// explicitly NOT payment-grade abuse protection and must not be treated as a durable,
// globally-enforced production quota once a real payment/booking flow exists behind
// this or a similar endpoint — that would need a shared store (e.g. Redis) instead.
const QUOTE_RATE_LIMIT_PER_MINUTE = 30;
const MAX_ADD_ON_IDS = 20;
const MAX_ID_STRING_LENGTH = 100;
const MAX_SLUG_LENGTH = 200;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

type BodyReadResult = { ok: true; text: string } | { ok: false };

async function readBodyWithLimit(request: Request, maxBytes: number): Promise<BodyReadResult> {
  if (!request.body) return { ok: true, text: '' };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false };
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8').decode(combined) };
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isAddOnIdArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= MAX_ADD_ON_IDS && value.every((item) => typeof item === 'string' && item.length <= MAX_ID_STRING_LENGTH);
}

// Every reason createJourneyQuote() can return maps to exactly one stable, customer-safe
// status — never a stack trace, never internal detail. UNKNOWN_JOURNEY/INACTIVE_JOURNEY
// both read as "not found" to a caller; there is no legitimate reason to let a public
// caller distinguish "doesn't exist" from "exists but disabled".
const REJECTION_STATUS: Record<QuoteRejectionReason, number> = {
  UNKNOWN_JOURNEY: 404,
  INACTIVE_JOURNEY: 404,
  INVALID_DATE: 400,
  INVALID_TRAVELLER_COUNT: 400,
  UNKNOWN_STAY_OPTION: 400,
  UNKNOWN_TRANSPORT_OPTION: 400,
  UNKNOWN_PACE: 400,
  UNKNOWN_ADD_ON: 400,
  CONFIGURATION_ERROR: 503
};

const REJECTION_MESSAGE: Record<QuoteRejectionReason, string> = {
  UNKNOWN_JOURNEY: 'Journey not found',
  INACTIVE_JOURNEY: 'Journey not found',
  INVALID_DATE: 'travelDate must be a valid, non-past date (YYYY-MM-DD)',
  INVALID_TRAVELLER_COUNT: 'adults/children are out of the accepted range',
  UNKNOWN_STAY_OPTION: 'stayOptionId does not belong to this journey',
  UNKNOWN_TRANSPORT_OPTION: 'transportOptionId does not belong to this journey',
  UNKNOWN_PACE: 'paceId does not belong to this journey',
  UNKNOWN_ADD_ON: 'One or more addOnIds do not belong to this journey',
  // Never reveals *why* — a missing/empty/weak BOOKING_QUOTE_SECRET must look identical
  // to a caller as any other transient unavailability. See journeyQuote.service.ts's
  // own doc comment on why this reason never carries further detail.
  CONFIGURATION_ERROR: 'Quotation service is temporarily unavailable'
};

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimited(`journey-quote:${clientIp}`, QUOTE_RATE_LIMIT_PER_MINUTE)) {
      return NextResponse.json({ error: 'Too many requests — please slow down.' }, { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': '60' } });
    }

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413, headers: NO_STORE_HEADERS });
    }

    const bodyRead = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (!bodyRead.ok) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413, headers: NO_STORE_HEADERS });
    }

    // Explicit, directly-testable confirmation of the byte-size limit — measured with
    // Buffer.byteLength on the actual raw text, never a JS string .length (character
    // count), so a multibyte payload (e.g. Devanagari/emoji) whose CHARACTER count is
    // under the limit but whose real transmitted BYTE count is over it is still
    // correctly rejected here. This is intentionally redundant with readBodyWithLimit's
    // own streamed byte-counting above (which already aborts mid-stream on an oversized
    // body without ever fully buffering it, so an attacker can't force this route to
    // hold a huge payload in memory just to reach this line) — kept as its own explicit
    // assertion rather than relying solely on that internal accounting. Still runs
    // before any JSON.parse call, per this route's contract: size is checked on the raw
    // body first, always.
    if (Buffer.byteLength(bodyRead.text, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413, headers: NO_STORE_HEADERS });
    }

    let parsed: unknown;
    try {
      parsed = bodyRead.text ? JSON.parse(bodyRead.text) : null;
    } catch {
      // Never echoes back any part of the raw body — the client learns only that
      // parsing failed, nothing about what was actually sent.
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const body = parsed as Record<string, unknown>;

    // Strict types only — no numeric-string ("2") or boolean coercion for any field. A
    // wrong type is a 400, never silently reinterpreted.
    if (!isNonEmptyString(body.journeySlug, MAX_SLUG_LENGTH)) {
      return NextResponse.json({ error: 'journeySlug is required' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (!isNonEmptyString(body.travelDate, 10)) {
      return NextResponse.json({ error: 'travelDate is required' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (typeof body.adults !== 'number' || typeof body.children !== 'number') {
      return NextResponse.json({ error: 'adults and children must be numbers' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (body.stayOptionId !== undefined && !isNonEmptyString(body.stayOptionId, MAX_ID_STRING_LENGTH)) {
      return NextResponse.json({ error: 'stayOptionId must be a string' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (body.transportOptionId !== undefined && !isNonEmptyString(body.transportOptionId, MAX_ID_STRING_LENGTH)) {
      return NextResponse.json({ error: 'transportOptionId must be a string' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (body.paceId !== undefined && !isNonEmptyString(body.paceId, MAX_ID_STRING_LENGTH)) {
      return NextResponse.json({ error: 'paceId must be a string' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (body.addOnIds !== undefined && !isAddOnIdArray(body.addOnIds)) {
      return NextResponse.json({ error: 'addOnIds must be an array of strings' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const quoteRequest: JourneyQuoteRequest = {
      journeySlug: body.journeySlug,
      travelDate: body.travelDate,
      adults: body.adults,
      children: body.children,
      stayOptionId: body.stayOptionId as string | undefined,
      transportOptionId: body.transportOptionId as string | undefined,
      paceId: body.paceId as string | undefined,
      addOnIds: (body.addOnIds as string[] | undefined) ?? []
    };

    // The ONLY pricing call this route ever makes — no independent calculation here.
    const result = await createJourneyQuote(quoteRequest);

    if (!result.ok) {
      return NextResponse.json({ error: REJECTION_MESSAGE[result.reason] }, { status: REJECTION_STATUS[result.reason], headers: NO_STORE_HEADERS });
    }

    // `result.quote.snapshot` already excludes every forbidden field by construction
    // (services/booking/journeyQuote.service.ts builds it field-by-field — it is never
    // a raw Mongo document, never carries an `_id`, supplier cost, or HBX field). The
    // only addition here is a formatted-rupee convenience string for display.
    return NextResponse.json(
      {
        token: result.quote.token,
        quote: {
          ...result.quote.snapshot,
          totalFormatted: formatINR(result.quote.snapshot.totalMinorUnits / 100)
        },
        availabilityStatus: 'NOT_CONFIRMED',
        disclaimer: 'This is a price quotation only. It is not a confirmed booking and does not guarantee hotel, vehicle, or supplier availability.'
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    // Logs only a fixed label and the error object itself server-side — never the
    // request body (this endpoint's fields are pricing-only; there is no name/phone/
    // email here to begin with, but this stays conservative regardless) and never a
    // token/secret, matching journeyQuote.service.ts's own logging discipline.
    console.error('Failed to create journey quote', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

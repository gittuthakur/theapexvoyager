import { NextResponse } from 'next/server';
import { createBooking, type CreateBookingRejection } from '@/services/booking/createBooking.service';
import type { BookingDocument } from '@/models/Booking';
import { validateIdempotencyKey } from '@/lib/idempotencyKey';
import { isRateLimited } from '@/lib/rateLimit';
import { formatINR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * POST-only (no GET/PUT/PATCH/DELETE handler exists — Next.js itself returns 405 for
 * any other method on this route). Creates only a `PENDING_PAYMENT` Booking from an
 * already-verified signed quote token — see services/booking/createBooking.service.ts's
 * own doc comment for the full trust boundary. This route's job is purely HTTP-shape
 * validation and response mapping; all quote/customer/idempotency business logic lives
 * in that service.
 */

// Larger than app/api/journey-quotes/route.ts's 5,000-byte cap (this payload also
// carries a customer name/email/phone/optional notes, not just pricing primitives) but
// still small and fixed — no shared byte-counted body-size helper exists yet in this
// codebase; see that route's own comment for why one isn't being extracted in this
// phase either.
const MAX_BODY_BYTES = 10_000;

// Deliberately stricter than the quote endpoint's 30/min — creating a Booking is a
// heavier, more consequential operation (a DB write standing in for a real financial
// intent) than pricing a journey. Single exported constant, not a magic number reused
// elsewhere. Same process-local, in-memory limitation as
// app/api/journey-quotes/route.ts's own limiter (lib/rateLimit.ts is a plain
// module-level Map — confirmed by reading that file directly — no shared/external
// store): on a serverless platform, each warm instance keeps its own independent
// counter, so this is a best-effort, per-instance throttle, not a globally-enforced
// production quota. Acceptable here because this route still makes no payment/email/
// WhatsApp/HBX call — the worst case of under-enforcement is extra PENDING_PAYMENT rows
// with no payment ever completed against them, not fraud or financial exposure. This
// must NOT be treated as payment-grade abuse protection, and a future payment route
// must use a shared store (e.g. Redis) instead, never this limiter as-is.
export const BOOKING_RATE_LIMIT_PER_MINUTE = 10;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

/**
 * Fail-closed feature gate — this whole endpoint (including idempotent replay of an
 * already-created booking) is OFF unless `JOURNEY_BOOKING_CREATION_ENABLED` is the
 * exact string `'true'`. Unset, empty, `'false'`, `'TRUE'`, or any other value/typo all
 * mean disabled — there is no "trueish" coercion. Deliberately read here, inside the
 * request handler, on every call — never hoisted to a module-level constant — so a
 * platform env-var change takes effect on the very next request without needing a
 * fresh deploy/rebuild, and so `next build` never bakes today's value into the bundle.
 *
 * Existing-booking replay is intentionally NOT exempted while disabled: allowing replay
 * through would let a caller probe arbitrary Idempotency-Key values against a
 * "supposedly fully shut" endpoint and learn (from a 200 vs. 503/409) which keys
 * correspond to a real booking — the public booking surface must be either fully open
 * or fully closed, never partially observable while closed.
 */
function isBookingCreationEnabled(): boolean {
  return process.env.JOURNEY_BOOKING_CREATION_ENABLED === 'true';
}

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

// First X-Forwarded-For entry, trimmed — same convention already used by
// app/api/destinations/route.ts and app/api/journey-quotes/route.ts.
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
}

function mapRejectionToResponse(rejection: CreateBookingRejection) {
  switch (rejection.reason) {
    case 'INVALID_QUOTE':
      return errorResponse('Invalid or unrecognized quote', 400);
    case 'EXPIRED_QUOTE':
      return errorResponse('This quote has expired — please request a new one', 410);
    case 'CONFIGURATION_ERROR':
      // Never reveals *why* — a missing/empty/weak BOOKING_QUOTE_SECRET must look
      // identical to a caller as any other transient unavailability (matches
      // journeyQuote.service.ts's own convention for this exact reason).
      return errorResponse('Booking service is temporarily unavailable', 503);
    case 'INVALID_CUSTOMER':
      return errorResponse(`customer.${rejection.field} is invalid`, 400);
    case 'CONFLICT':
      return errorResponse('This Idempotency-Key was already used for a different request', 409);
    case 'SERVER_ERROR':
      return errorResponse('Something went wrong. Please try again.', 500);
  }
}

/** Only ever the fields listed in the Phase 9D response contract — never a Mongo `_id`,
 *  `__v`, the idempotency key, the request fingerprint, the quote fingerprint, the raw
 *  quote token, any payment-provider ID, or the customer's email/phone. */
function toSafeBookingResponse(booking: BookingDocument, idempotentReplay: boolean) {
  return {
    booking: {
      bookingReference: booking.bookingReference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      fulfilmentStatus: booking.fulfilmentStatus,
      journey: {
        slug: booking.journeySlug,
        name: booking.journeySnapshot.name,
        travelDate: booking.travelDate,
        adults: booking.adults,
        children: booking.children
      },
      money: {
        currency: booking.money.currency,
        totalMinorUnits: booking.money.totalMinorUnits,
        totalFormatted: formatINR(booking.money.totalMinorUnits / 100)
      },
      createdAt: booking.createdAt.toISOString()
    },
    idempotentReplay,
    availabilityStatus: 'NOT_CONFIRMED',
    disclaimer: 'This booking request is not confirmed until availability and payment are completed.'
  };
}

export async function POST(request: Request) {
  try {
    // Checked before anything else — before rate limiting, before Idempotency-Key
    // validation, before any body read, before MongoDB, before any quote/customer
    // processing. Zero MongoDB reads/writes and zero quote-token processing happen on
    // this path; the response never reveals that a feature flag is the reason, which is
    // what keeps it identical to CONFIGURATION_ERROR's own "temporarily unavailable"
    // wording (see mapRejectionToResponse above) from the outside.
    if (!isBookingCreationEnabled()) {
      return errorResponse('Booking service is temporarily unavailable', 503);
    }

    const clientIp = getClientIp(request);
    if (isRateLimited(`booking-create:${clientIp}`, BOOKING_RATE_LIMIT_PER_MINUTE)) {
      return NextResponse.json({ error: 'Too many requests — please slow down.' }, { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': '60' } });
    }

    // Header names are case-insensitive per the Fetch/Headers spec — `.get('idempotency-key')`
    // matches an `Idempotency-Key` header from any real client regardless of casing.
    const idempotencyResult = validateIdempotencyKey(request.headers.get('idempotency-key'));
    if (!idempotencyResult.valid) {
      return errorResponse('A valid Idempotency-Key header is required', 400);
    }

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return errorResponse('Request body too large', 413);
    }

    const bodyRead = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (!bodyRead.ok) {
      return errorResponse('Request body too large', 413);
    }

    // Explicit, directly-testable confirmation of the byte-size limit — measured with
    // Buffer.byteLength on the raw text, never a JS string .length (character count) —
    // same convention as app/api/journey-quotes/route.ts. Still runs before any
    // JSON.parse call; `request.json()` is never used anywhere in this route.
    if (Buffer.byteLength(bodyRead.text, 'utf8') > MAX_BODY_BYTES) {
      return errorResponse('Request body too large', 413);
    }

    let parsed: unknown;
    try {
      parsed = bodyRead.text ? JSON.parse(bodyRead.text) : null;
    } catch {
      // Never echoes back any part of the raw body.
      return errorResponse('Invalid JSON body', 400);
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return errorResponse('Request body must be a JSON object', 400);
    }
    const body = parsed as Record<string, unknown>;

    if (typeof body.quoteToken !== 'string' || body.quoteToken.length === 0) {
      return errorResponse('quoteToken is required', 400);
    }
    if (body.customer === null || typeof body.customer !== 'object' || Array.isArray(body.customer)) {
      return errorResponse('customer must be an object', 400);
    }

    const result = await createBooking({
      idempotencyKey: idempotencyResult.key,
      quoteToken: body.quoteToken,
      customer: body.customer as Record<string, unknown>
    });

    if (!result.ok) {
      return mapRejectionToResponse(result.rejection);
    }

    return NextResponse.json(toSafeBookingResponse(result.booking, result.idempotentReplay), {
      status: result.idempotentReplay ? 200 : 201,
      headers: NO_STORE_HEADERS
    });
  } catch (error) {
    // Logs only a fixed label and the error object itself — never the request body,
    // the quote token, the Idempotency-Key header, or any customer field.
    console.error('Failed to create booking', error);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

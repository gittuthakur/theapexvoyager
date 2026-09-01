import { NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BookingRequest, type BookingRequestType } from '@/models/BookingRequest';
import { generateBookingId } from '@/lib/bookingId';
import { sendBookingConfirmationEmails } from '@/lib/mailer';

const VALID_TYPES: BookingRequestType[] = ['stay', 'journey', 'tour', 'experience', 'transport', 'expert'];

// Every real caller (PackageBookingModal, HotelBookingModal, the shared
// BookingRequestModal used by Journeys/Transport/Experts) sends a flat-ish `details`
// object of at most ~8 keys, with at most one small array (add-ons, experience ids) or
// — the trip planner's richest case — one level of {params: {...8 flat keys, 1 array},
// breakdown: [{label, amount}, ...]}. These limits are set well above every observed
// real shape, not tuned to be tight, so they can't reject a legitimate payload.
const MAX_DETAILS_DEPTH = 4;
const MAX_DETAILS_KEYS = 40;
const MAX_DETAILS_ARRAY_LENGTH = 100;
const MAX_DETAILS_STRING_LENGTH = 2000;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
// Deliberately the same practical, no-comment/no-quoted-string pattern browsers use for
// <input type="email"> — besides being a reasonable format check, it structurally can't
// contain the parenthesised/nested address syntax that Nodemailer's addressparser DoS
// advisory (GHSA-rcmh-qjqh-p98v, reachable here since `email` flows straight into a
// `to:` field) or its address-interpretation-conflict advisory (GHSA-mm7p-fcc7-pg87)
// depend on — so this closes both regardless of the installed Nodemailer version.
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Rejects a `details` payload shaped for abuse (unbounded size, dangerous keys) while
 *  accepting every real caller's shape — see the shapes surveyed above. `depth` counts
 *  container levels only (the root object is depth 0, its values depth 1, and so on) —
 *  a value itself never increments depth, only descending into an object/array does. */
function isSafeDetailsShape(value: unknown, depth: number): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return typeof value !== 'string' || value.length <= MAX_DETAILS_STRING_LENGTH;
  }
  if (depth >= MAX_DETAILS_DEPTH) return false;
  if (Array.isArray(value)) {
    return value.length <= MAX_DETAILS_ARRAY_LENGTH && value.every((item) => isSafeDetailsShape(item, depth + 1));
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length > MAX_DETAILS_KEYS) return false;
    return keys.every(
      (key) => !FORBIDDEN_KEYS.has(key) && !key.startsWith('$') && isSafeDetailsShape((value as Record<string, unknown>)[key], depth + 1)
    );
  }
  // Functions/symbols/undefined can't arrive via JSON.parse, but reject on principle.
  return false;
}

const MAX_BODY_BYTES = 100_000;

type BodyReadResult = { ok: true; text: string } | { ok: false };

/** Reads the request body incrementally, counting real bytes as they arrive instead of
 *  trusting the `Content-Length` header (which a non-browser client can omit, lie about,
 *  or send via chunked transfer-encoding without). Aborts and cancels the stream the
 *  moment the limit is crossed, so an oversized body is never fully buffered or handed
 *  to JSON.parse. */
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

// Saves a booking/enquiry request under a human-readable reference ID before the
// browser is redirected to wa.me — the record of intent (and the ID shown to the
// visitor) even if they never actually send the prefilled WhatsApp message. Mirrors
// the save-then-redirect shape already used by /api/inquiries.
export async function POST(request: Request) {
  try {
    // Content-Length is only ever an optional fast-path — a non-browser client can omit
    // it, understate it, or use chunked transfer-encoding with no length header at all,
    // so it must never be the only thing standing between an oversized body and
    // JSON.parse. Real enforcement is readBodyWithLimit's byte-counted stream read below,
    // which works identically whether or not this header is present or accurate.
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const bodyRead = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (!bodyRead.ok) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches the shape
    // request.json() used to return; every field below is still narrowed before use.
    let body: any = null;
    try {
      body = bodyRead.text ? JSON.parse(bodyRead.text) : null;
    } catch {
      body = null;
    }

    const type = body?.type;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const itemName = typeof body?.itemName === 'string' ? body.itemName.trim() : '';
    const destination = typeof body?.destination === 'string' ? body.destination.trim() : undefined;
    const dates = typeof body?.dates === 'string' ? body.dates.trim() : undefined;
    const travelers = typeof body?.travelers === 'string' ? body.travelers.trim() : undefined;

    // email/details are typed leniently above only for name/phone/itemName — those are
    // *required*, so a wrong type already fails the empty-string check below. email and
    // details are optional, so the same "coerce a wrong type to undefined" approach would
    // silently accept (and drop) a malformed value instead of rejecting it — a caller
    // passing e.g. email: 12345 or details: "oops" gets no error and no indication their
    // field was ignored. Both are validated explicitly instead: present-and-wrong-type is
    // a 400, absent-or-null is treated as "not provided".
    const rawEmail = body?.email;
    if (rawEmail !== undefined && typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'email must be a string' }, { status: 400 });
    }
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : undefined;

    const rawDetails = body?.details;
    const detailsIsPlainObject = rawDetails !== null && typeof rawDetails === 'object' && !Array.isArray(rawDetails);
    if (rawDetails !== undefined && rawDetails !== null && !detailsIsPlainObject) {
      return NextResponse.json({ error: 'details must be an object' }, { status: 400 });
    }
    const details = detailsIsPlainObject ? rawDetails : undefined;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    if (!itemName) {
      return NextResponse.json({ error: 'itemName is required' }, { status: 400 });
    }
    // Optional — an absent/undefined email is valid; a present-but-malformed one isn't.
    if (email && (email.length > 200 || !EMAIL_PATTERN.test(email))) {
      return NextResponse.json({ error: 'email must be a valid email address' }, { status: 400 });
    }
    if (details !== undefined && !isSafeDetailsShape(details, 0)) {
      return NextResponse.json({ error: 'details payload is too large or deeply nested' }, { status: 400 });
    }

    await connectDB();
    const referenceId = await generateBookingId();

    // See models/BookingRequest.ts for the `details.transportStatus` convention this
    // seeds — a future internal tool can advance it through a richer lifecycle without
    // this shared model's own `status` needing to fork per domain.
    const enrichedDetails = type === 'transport' ? { ...details, transportStatus: 'REQUESTED' } : details;

    const bookingRequest = await BookingRequest.create({
      referenceId,
      type,
      name: name.slice(0, 200),
      phone: phone.slice(0, 30),
      email: email?.slice(0, 200),
      itemName: itemName.slice(0, 200),
      destination: destination?.slice(0, 200),
      dates: dates?.slice(0, 100),
      travelers: travelers?.slice(0, 100),
      details: enrichedDetails
    });

    // Scheduled for after the response is sent — the visitor gets their reference ID (and
    // is about to be redirected to WhatsApp) immediately, without waiting on SMTP, which
    // can take seconds when slow or misconfigured. sendBookingConfirmationEmails never
    // throws (see lib/mailer.ts), so there's nothing here to catch.
    after(() =>
      sendBookingConfirmationEmails({
        referenceId: bookingRequest.referenceId,
        type,
        name: bookingRequest.name,
        email: bookingRequest.email,
        phone: bookingRequest.phone,
        itemName: bookingRequest.itemName,
        destination: bookingRequest.destination,
        dates: bookingRequest.dates,
        travelers: bookingRequest.travelers
      })
    );

    return NextResponse.json({ referenceId: bookingRequest.referenceId }, { status: 201 });
  } catch (error) {
    console.error('Failed to save booking request', error);
    return NextResponse.json({ error: 'Failed to save booking request' }, { status: 500 });
  }
}

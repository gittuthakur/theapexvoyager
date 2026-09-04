import { NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BookingRequest, type BookingRequestType } from '@/models/BookingRequest';
import { generateBookingId } from '@/lib/bookingId';
import { sendBookingConfirmationEmails, type BookingConfirmationEmailInput } from '@/lib/mailer';
import { getPackageBySlug } from '@/lib/packages';
import { calculateBookingPrice, type BookingConfig } from '@/lib/pricing';
import { priceJourney } from '@/lib/tripPlannerPricing';
import { STAY_TYPE_OPTIONS, TRANSPORT_MODES, EXPERIENCE_OPTIONS } from '@/config/tripPlanner.config';
import type { JourneyParams, StayTypeId, TransportModeId, ExperienceId } from '@/types/tripPlanner';

const VALID_TYPES: BookingRequestType[] = ['stay', 'journey', 'tour', 'experience', 'transport', 'expert'];

// A `type: 'journey'` request means one of two structurally different things — a
// catalog Journey Detail booking (PackageBookingModal.tsx, tied to a real Journey
// document via `details.slug`) or a Trip Planner-generated request (ChoiceCard.tsx,
// a client-composed tier with no catalog document behind it at all). Explicit and
// default-deny: an unrecognized `details.source` is rejected outright, and an absent
// one keeps the original, fully-hardened catalog behavior — only an exact
// `'trip-planner'` value opts into the separate (still server-priced) path below. This
// is deliberately the opposite of inferring the source from payload shape (e.g.
// "missing slug => trip planner"), which would let a catalog-shaped attack simply drop
// `slug` to escape the catalog path's authority checks.
const JOURNEY_SOURCES = new Set(['catalog', 'trip-planner']);

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

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** The business's own "today", independent of the server host's OS timezone (Vercel runs
 *  UTC) — this site only serves India-based travel, so IST is the one timezone every
 *  travelDate should be judged against, using the same ISO YYYY-MM-DD string-comparison
 *  convention lib/pricing.ts already uses for seasonal pricing windows. IST has no DST,
 *  so a fixed +5:30 offset is exact, not an approximation. */
function todayISOInIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Rejects a structurally-plausible but impossible date (e.g. "2026-02-30", which
 *  `new Date(...)` would otherwise silently roll over to March 2) by round-tripping the
 *  parsed value back through its UTC fields. */
function isValidCalendarDateISO(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
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

    // A journey booking's price/name/option labels are entirely client-computed (see
    // PackageBookingModal.tsx's calculateBookingPrice() call) — none of that is
    // trustworthy on its own, since a client can send any total, any itemName, any
    // slug. Re-derive every one of those from the Journey's own MongoDB document and
    // the SAME calculateBookingPrice() formula the client used, so what's actually
    // persisted always reflects the authoritative catalogue rather than whatever the
    // request claimed. Scoped to `type === 'journey'` only — every other booking type
    // (stay/tour/experience/transport/expert) keeps its existing, unchanged behavior.
    let resolvedItemName = itemName;
    let resolvedDestination = destination;
    let journeyDetails: Record<string, unknown> | undefined = details;
    let emailExtras: Partial<BookingConfirmationEmailInput> = {};

    if (type === 'journey') {
      const rawSource = typeof details?.source === 'string' ? details.source : undefined;
      if (rawSource !== undefined && !JOURNEY_SOURCES.has(rawSource)) {
        return NextResponse.json({ error: `details.source must be one of: ${[...JOURNEY_SOURCES].join(', ')}` }, { status: 400 });
      }
      const journeySource = rawSource === 'trip-planner' ? 'trip-planner' : 'catalog';

      if (journeySource === 'trip-planner') {
        // Trip Planner requests (ChoiceCard.tsx) aren't tied to any catalog Journey
        // document — there's no slug, no stay/transport/pace *options list* to validate
        // an id against. What they DO have is `details.params`, the same flat primitive
        // shape lib/tripPlannerPricing.ts's priceJourney() already prices client-side —
        // so the server re-runs that exact pure function against server-normalized
        // inputs, the same authority principle as the catalog branch below, just against
        // a different (non-DB) source of truth.
        const rawParams = details?.params;
        if (!rawParams || typeof rawParams !== 'object' || Array.isArray(rawParams)) {
          return NextResponse.json({ error: 'details.params is required for trip-planner journey requests' }, { status: 400 });
        }
        const p = rawParams as Record<string, unknown>;

        const requestedStayTypeId = typeof p.stayTypeId === 'string' ? p.stayTypeId : undefined;
        const stayTypeId = (
          STAY_TYPE_OPTIONS.some((option) => option.id === requestedStayTypeId) ? requestedStayTypeId : STAY_TYPE_OPTIONS[0].id
        ) as StayTypeId;

        const requestedTransportModeId = typeof p.transportModeId === 'string' ? p.transportModeId : undefined;
        const transportModeId = (
          TRANSPORT_MODES.some((option) => option.id === requestedTransportModeId) ? requestedTransportModeId : TRANSPORT_MODES[0].id
        ) as TransportModeId;

        const requestedExperienceIds = Array.isArray(p.experienceIds)
          ? p.experienceIds.filter((id: unknown): id is string => typeof id === 'string')
          : [];
        const experienceIds = requestedExperienceIds.filter((id: string) =>
          EXPERIENCE_OPTIONS.some((option) => option.id === id)
        ) as ExperienceId[];

        const nightsRaw = Number(p.nights);
        const travellerCountRaw = Number(p.travellerCount);
        const roomsRaw = Number(p.rooms);

        const normalizedParams: JourneyParams = {
          nights: Number.isFinite(nightsRaw) && nightsRaw > 0 ? Math.floor(nightsRaw) : 1,
          travellerCount: Number.isFinite(travellerCountRaw) && travellerCountRaw > 0 ? Math.floor(travellerCountRaw) : 1,
          rooms: Number.isFinite(roomsRaw) && roomsRaw > 0 ? Math.floor(roomsRaw) : 1,
          stayTypeId,
          transportModeId,
          experienceIds,
          guideIncluded: p.guideIncluded === true,
          mealsIncluded: p.mealsIncluded === true
        };

        const priced = priceJourney(normalizedParams);
        const tier = typeof details?.tier === 'string' ? details.tier.slice(0, 100) : undefined;

        // No resolvedItemName/resolvedDestination re-derivation here — unlike catalog,
        // there is no authoritative document to derive them from. itemName/destination
        // stay exactly what the client sent (already required, non-empty strings by the
        // checks above); only the price-bearing fields below are server-recalculated.
        journeyDetails = {
          ...details,
          source: 'trip-planner',
          tier,
          params: normalizedParams,
          breakdown: priced.breakdown,
          total: priced.total,
          perPerson: priced.perPerson
        };

        emailExtras = {
          stayLabel: STAY_TYPE_OPTIONS.find((option) => option.id === stayTypeId)?.label,
          transportLabel: TRANSPORT_MODES.find((option) => option.id === transportModeId)?.label,
          addOns: experienceIds.map((id) => EXPERIENCE_OPTIONS.find((option) => option.id === id)?.label ?? id),
          total: priced.total
        };
      } else {
        const slug = typeof details?.slug === 'string' ? details.slug : undefined;
        if (!slug) {
          return NextResponse.json({ error: 'details.slug is required for journey bookings' }, { status: 400 });
        }

        const pkg = await getPackageBySlug(slug);
        if (!pkg) {
          return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
        }

        // Validated before anything is persisted — a missing/malformed/impossible/past date
        // must reject with no BookingRequest.create(), no reference, and no email, same as
        // every other pre-persistence validation failure above.
        const travelDateRaw = typeof details?.travelDate === 'string' ? details.travelDate.trim() : '';
        if (!travelDateRaw || !isValidCalendarDateISO(travelDateRaw)) {
          return NextResponse.json({ error: 'travelDate must be a valid date (YYYY-MM-DD)' }, { status: 400 });
        }
        if (travelDateRaw < todayISOInIST()) {
          return NextResponse.json({ error: 'travelDate cannot be in the past' }, { status: 400 });
        }

        const adultsRaw = Number(details?.adults);
        const childrenRaw = Number(details?.children);
        const requestedStayId = typeof details?.stayOptionId === 'string' ? details.stayOptionId : undefined;
        const requestedTransportId = typeof details?.transportOptionId === 'string' ? details.transportOptionId : undefined;
        const requestedPaceId = typeof details?.paceId === 'string' ? details.paceId : undefined;
        const requestedAddOnIds = Array.isArray(details?.addOnIds)
          ? details.addOnIds.filter((id: unknown): id is string => typeof id === 'string')
          : [];

        const config: BookingConfig = {
          adults: Number.isFinite(adultsRaw) && adultsRaw > 0 ? Math.floor(adultsRaw) : 1,
          children: Number.isFinite(childrenRaw) && childrenRaw > 0 ? Math.floor(childrenRaw) : 0,
          travelDate: travelDateRaw,
          // Only a stay/transport/pace/add-on id that actually belongs to THIS journey is
          // honored — anything else (missing, or copied from a different journey) falls
          // back to the same "first option" default calculateBookingPrice() itself already
          // uses when a config field doesn't match, never a client-invented option.
          stayOptionId: pkg.stayOptions?.some((option) => option.id === requestedStayId)
            ? (requestedStayId as string)
            : (pkg.stayOptions?.[0]?.id ?? ''),
          transportOptionId: pkg.transportOptions?.some((option) => option.id === requestedTransportId)
            ? requestedTransportId
            : undefined,
          paceId: pkg.pace?.some((option) => option.id === requestedPaceId) ? requestedPaceId : undefined,
          addOnIds: requestedAddOnIds.filter((id: string) => pkg.addOns?.some((option) => option.id === id))
        };

        const breakdown = calculateBookingPrice(pkg, config);

        resolvedItemName = pkg.name;
        resolvedDestination = pkg.destination;
        journeyDetails = {
          ...details,
          source: 'catalog',
          slug: pkg.slug,
          adults: config.adults,
          children: config.children,
          stayOptionId: config.stayOptionId,
          transportOptionId: config.transportOptionId,
          paceId: config.paceId,
          addOnIds: config.addOnIds,
          stayLabel: pkg.stayOptions?.find((option) => option.id === config.stayOptionId)?.label,
          transportLabel: pkg.transportOptions?.find((option) => option.id === config.transportOptionId)?.label,
          paceLabel: pkg.pace?.find((option) => option.id === config.paceId)?.label,
          addOns: pkg.addOns?.filter((option) => config.addOnIds.includes(option.id)).map((option) => option.label),
          total: breakdown.total
        };

        // Same authority principle as the persisted record above — the email reflects the
        // server-recalculated breakdown, never the client-computed values the request
        // arrived with. pickupLocation/specialRequest have no authoritative re-derivation
        // (free text, not price/identity data); journeyDetails passes both through from
        // `details` unchanged (see the spread above), so reading them straight off `details`
        // gives the identical value that ends up persisted.
        emailExtras = {
          stayLabel: breakdown.stayLabel,
          transportLabel: breakdown.transportLabel,
          paceLabel: breakdown.paceLabel,
          addOns: breakdown.addOnLines.map((line) => line.label),
          total: breakdown.total,
          pickupLocation: typeof details?.pickupLocation === 'string' ? details.pickupLocation : undefined,
          specialRequest: typeof details?.specialRequest === 'string' ? details.specialRequest : undefined
        };
      }
    }

    await connectDB();
    const referenceId = await generateBookingId();

    // See models/BookingRequest.ts for the `details.transportStatus` convention this
    // seeds — a future internal tool can advance it through a richer lifecycle without
    // this shared model's own `status` needing to fork per domain.
    const enrichedDetails = type === 'transport' ? { ...journeyDetails, transportStatus: 'REQUESTED' } : journeyDetails;

    const bookingRequest = await BookingRequest.create({
      referenceId,
      type,
      name: name.slice(0, 200),
      phone: phone.slice(0, 30),
      email: email?.slice(0, 200),
      itemName: resolvedItemName.slice(0, 200),
      destination: resolvedDestination?.slice(0, 200),
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
        travelers: bookingRequest.travelers,
        ...emailExtras
      })
    );

    return NextResponse.json({ referenceId: bookingRequest.referenceId }, { status: 201 });
  } catch (error) {
    console.error('Failed to save booking request', error);
    return NextResponse.json({ error: 'Failed to save booking request' }, { status: 500 });
  }
}

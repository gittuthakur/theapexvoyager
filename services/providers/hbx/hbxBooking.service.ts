import { HBX_SOURCE_MARKET } from '@/config/hbxEnvironment.config';
import { hbxFetch, isHbxConfigured } from './hbx.client';
import { HbxApiError } from './hbx.errors';
import { logHbxError } from './hbx.errors';
import type { HbxBookingRequestBody, HbxBookingResponse, HbxHolder, HbxPax } from './hbx.types';

// Hotelbeds' certification documentation requires the Booking Confirmation response
// timeout specifically to be >= 60 seconds — it is the one operation that finalizes a
// real, supplier-side transaction, unlike a plain Availability/CheckRate read or even a
// Booking Detail/Cancellation call. Deliberately NOT applied to every HBX request (see
// hbx.client.ts's own doc comment on REQUEST_TIMEOUT_MS): only createHbxBooking below
// uses this value.
const BOOKING_CONFIRMATION_TIMEOUT_MS = 60_000;
// Booking Detail/Cancellation keep their own, separate, already-longer-than-default
// timeout (unchanged from before this fix) — real operations, but not the certification-
// mandated "Booking Confirmation" step itself.
const BOOKING_LOOKUP_TIMEOUT_MS = 30_000;

const BOOKING_PATH = '/hotel-api/1.0/bookings';

export interface CreateHbxBookingInput {
  holder: HbxHolder;
  rooms: Array<{ rateKey: string; paxes: HbxPax[] }>;
  clientReference: string;
  remark?: string;
}

export interface HbxBookingSummary {
  reference: string;
  /** Present only after a cancellation. */
  cancellationReference?: string;
  clientReference?: string;
  creationDate?: string;
  status: string;
  holder: HbxHolder;
  hotelCode: number;
  hotelName?: string;
  currency: string;
  checkIn?: string;
  checkOut?: string;
  rooms: Array<{
    code?: string;
    name?: string;
    boardCode?: string;
    boardName?: string;
    net?: string;
    paxes?: HbxPax[];
    /** Field names match this codebase's own CancellationPolicy convention
     *  (services/pricing/stayPricing.types.ts), NOT HBX's raw `amount`/`from` — fixed
     *  2026-09-28 after this exact mismatch caused a real persisted-booking write to fail
     *  Mongoose validation during certification-readiness verification. */
    cancellationPolicies?: Array<{ chargeAmount: string; chargeFrom: string }>;
    rateCommentsId?: string;
    rateComments?: string;
  }>;
  totalNet?: string;
  /** The genuine, identifiable supplier fulfilling this booking — required for a
   *  voucher; never invented when Hotelbeds doesn't return it. */
  supplierName?: string;
  supplierVatNumber?: string;
}

export type CreateHbxBookingResult = { ok: true; booking: HbxBookingSummary } | { ok: false; reason: 'NOT_CONFIGURED' | 'PROVIDER_ERROR'; error?: string };
export type GetHbxBookingResult = { ok: true; booking: HbxBookingSummary } | { ok: false; reason: 'NOT_CONFIGURED' | 'NOT_FOUND' | 'PROVIDER_ERROR'; error?: string };
export type CancelHbxBookingResult =
  | { ok: true; status: string; cancellationReference?: string }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'NOT_FOUND' | 'PROVIDER_ERROR'; error?: string };

function toSummary(response: HbxBookingResponse): HbxBookingSummary {
  const { booking } = response;
  return {
    reference: booking.reference,
    cancellationReference: booking.cancellationReference,
    clientReference: booking.clientReference,
    creationDate: booking.creationDate,
    status: booking.status,
    holder: booking.holder,
    hotelCode: booking.hotel.code,
    hotelName: booking.hotel.name,
    currency: booking.hotel.currency,
    checkIn: booking.hotel.checkIn,
    checkOut: booking.hotel.checkOut,
    // A confirmed booking's room always carries exactly one rate, nested under
    // `room.rates[0]` — never flattened onto the room itself (confirmed against a real
    // captured response; see hbx.types.ts's HbxBookingRoomRate doc comment).
    rooms: booking.hotel.rooms.map((room) => {
      const rate = room.rates[0];
      return {
        code: room.code,
        name: room.name,
        boardCode: rate?.boardCode,
        boardName: rate?.boardName,
        net: rate?.net,
        paxes: room.paxes,
        cancellationPolicies: rate?.cancellationPolicies?.map((policy) => ({ chargeAmount: policy.amount, chargeFrom: policy.from })),
        rateCommentsId: rate?.rateCommentsId,
        rateComments: rate?.rateComments
      };
    }),
    totalNet: booking.totalNet ?? booking.hotel.totalNet,
    supplierName: booking.hotel.supplier?.name,
    supplierVatNumber: booking.hotel.supplier?.vatNumber
  };
}

/**
 * Creates a real Hotelbeds reservation — POST /hotel-api/1.0/bookings. Only ever called
 * by services/pricing/hbxBookingWorkflow.service.ts, and only with the FINAL valid
 * rateKey (the original Availability rateKey for a 'BOOKABLE' rate, or the CheckRate-
 * revalidated rateKey for a 'RECHECK' rate) — never a stale one. `clientReference` is the
 * caller's own idempotency-style reference, not a Hotelbeds value.
 */
export async function createHbxBooking(input: CreateHbxBookingInput): Promise<CreateHbxBookingResult> {
  if (!isHbxConfigured()) return { ok: false, reason: 'NOT_CONFIGURED' };

  const body: HbxBookingRequestBody = {
    holder: input.holder,
    rooms: input.rooms,
    clientReference: input.clientReference,
    sourceMarket: HBX_SOURCE_MARKET,
    remark: input.remark
  };

  try {
    const response = await hbxFetch<HbxBookingResponse>(BOOKING_PATH, { method: 'POST', body, timeoutMs: BOOKING_CONFIRMATION_TIMEOUT_MS });
    return { ok: true, booking: toSummary(response) };
  } catch (error) {
    logHbxError('createHbxBooking', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, reason: 'PROVIDER_ERROR', error: message };
  }
}

/** Retrieves an existing Hotelbeds booking by its own reference — GET
 *  /hotel-api/1.0/bookings/{reference}. Never used to look up a booking this codebase
 *  didn't itself create; the reference always comes from a prior createHbxBooking result
 *  or from models/HbxBooking.ts. */
export async function getHbxBookingDetail(reference: string): Promise<GetHbxBookingResult> {
  if (!isHbxConfigured()) return { ok: false, reason: 'NOT_CONFIGURED' };

  try {
    const response = await hbxFetch<HbxBookingResponse>(`${BOOKING_PATH}/${encodeURIComponent(reference)}`, { method: 'GET', timeoutMs: BOOKING_LOOKUP_TIMEOUT_MS });
    return { ok: true, booking: toSummary(response) };
  } catch (error) {
    logHbxError('getHbxBookingDetail', error);
    if (error instanceof HbxApiError && error.status === 404) return { ok: false, reason: 'NOT_FOUND' };
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, reason: 'PROVIDER_ERROR', error: message };
  }
}

/** Cancels an existing Hotelbeds booking — DELETE
 *  /hotel-api/1.0/bookings/{reference}?cancellationFlag=CANCELLATION. `cancellationFlag`
 *  is deliberately always the real, immediate cancellation value here — never the
 *  cost-simulation-only mode — because this function's only purpose is to genuinely
 *  cancel a booking this codebase itself created (including cleaning up its own TEST
 *  verification bookings), never to preview a cancellation's cost as a side effect of
 *  browsing. */
export async function cancelHbxBooking(reference: string): Promise<CancelHbxBookingResult> {
  if (!isHbxConfigured()) return { ok: false, reason: 'NOT_CONFIGURED' };

  try {
    const response = await hbxFetch<HbxBookingResponse>(`${BOOKING_PATH}/${encodeURIComponent(reference)}?cancellationFlag=CANCELLATION`, {
      method: 'DELETE',
      timeoutMs: BOOKING_LOOKUP_TIMEOUT_MS
    });
    return { ok: true, status: response.booking.status, cancellationReference: response.booking.cancellationReference };
  } catch (error) {
    logHbxError('cancelHbxBooking', error);
    if (error instanceof HbxApiError && error.status === 404) return { ok: false, reason: 'NOT_FOUND' };
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, reason: 'PROVIDER_ERROR', error: message };
  }
}

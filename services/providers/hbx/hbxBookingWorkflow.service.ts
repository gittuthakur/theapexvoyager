import { connectDB } from '@/lib/mongodb';
import { HbxBooking, generateVoucherAccessToken } from '@/models/HbxBooking';
import { getHbxEnvironment } from './hbx.client';
import { checkRate } from './hbxCheckRate.service';
import { createHbxBooking, getHbxBookingDetail, cancelHbxBooking, type HbxBookingSummary } from './hbxBooking.service';
import { getHotelContentDetail } from './hbxHotels.service';
import { resolveRateCommentsById } from './hbxRateComments.service';
import type { HbxHolder, HbxPax } from './hbx.types';
import type { NormalizedRate } from '../../pricing/stayPricing.types';

/**
 * THE certification-required workflow: Availability -> (CheckRate only if
 * rate.rateType === 'RECHECK') -> Booking Confirmation. This function is the ONLY place
 * in the codebase that decides whether CheckRate runs — every selected room's rate is
 * inspected individually, so a multi-room booking can mix 'BOOKABLE' and 'RECHECK' rates
 * correctly. Never calls Availability itself (it only ever accepts already-fetched
 * NormalizedRate objects a caller obtained earlier), so Availability can never be
 * accidentally repeated between steps.
 *
 * Fail-closed exactly like the pricing safety gate: refuses to proceed at all when
 * getHbxEnvironment() is 'unknown' — a real booking is only ever attempted against an
 * explicitly classified 'test' or 'production' environment, never an ambiguous one.
 */

export interface RoomSelection {
  /** The exact NormalizedRate the customer selected for this room, as returned by a
   *  prior Availability call — its rateType decides whether CheckRate runs, and its
   *  environment is what gets stamped onto the persisted booking record. */
  selectedRate: NormalizedRate;
  paxes: HbxPax[];
}

export interface ConfirmBookingInput {
  holder: HbxHolder;
  rooms: RoomSelection[];
  clientReference: string;
  remark?: string;
}

export type ConfirmBookingResult =
  | { ok: true; booking: HbxBookingSummary; recheckedRoomCount: number; voucherAccessToken?: string }
  | { ok: false; reason: 'ENVIRONMENT_UNKNOWN' | 'NO_ROOMS' | 'RECHECK_FAILED' | 'PROVIDER_ERROR' | 'RATE_COMMENTS_UNRESOLVED'; error?: string };

export async function confirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
  const environment = getHbxEnvironment();
  if (environment === 'unknown') return { ok: false, reason: 'ENVIRONMENT_UNKNOWN' };

  if (input.rooms.length === 0) return { ok: false, reason: 'NO_ROOMS' };

  let recheckedRoomCount = 0;
  const finalRooms: Array<{ rateKey: string; paxes: HbxPax[] }> = [];
  // Hotelbeds certification requires any applicable rate comments to be resolved and
  // available BEFORE confirmation — never invented, never silently dropped. Indexed
  // parallel to finalRooms/input.rooms (same order, no reordering ever happens) so
  // persistBooking can attach the right comment to the right room even when the real
  // Booking Confirmation response itself comes back thin on comment text.
  const roomRateComments: Array<string | undefined> = [];

  for (const room of input.rooms) {
    if (room.selectedRate.rateType === 'RECHECK') {
      const checkResult = await checkRate(room.selectedRate.rateKey ?? '', room.selectedRate.nightCount);
      if (!checkResult.ok) {
        return { ok: false, reason: 'RECHECK_FAILED', error: checkResult.error ?? checkResult.reason };
      }
      recheckedRoomCount += 1;
      finalRooms.push({ rateKey: checkResult.rate.rateKey ?? '', paxes: room.paxes });
      // CheckRate's own response is the one live-verified source of rateComments for a
      // just-revalidated 'RECHECK' rate (2026-09-28) — never fetched a second time via
      // resolveRateCommentsById, since CheckRate already returned whatever full text HBX
      // has for this exact rate.
      roomRateComments.push(checkResult.rate.rateComments);
    } else {
      // 'BOOKABLE' (or any other/undefined rateType) skips CheckRate entirely — the
      // original Availability rateKey is used as-is, never re-validated.
      finalRooms.push({ rateKey: room.selectedRate.rateKey ?? '', paxes: room.paxes });

      if (room.selectedRate.rateComments) {
        roomRateComments.push(room.selectedRate.rateComments);
      } else if (room.selectedRate.rateCommentsId) {
        // A 'BOOKABLE' rate that only carries an id, never full text (never observed on
        // real Availability data as of 2026-09-28, but structurally possible per HBX's
        // documented contract) — must be resolved via the Content API here.
        // Confirmation is refused, not silently allowed through with an unresolved
        // mandatory comment, if that resolution fails.
        const resolved = await resolveRateCommentsById(room.selectedRate.rateCommentsId);
        if (!resolved) {
          return {
            ok: false,
            reason: 'RATE_COMMENTS_UNRESOLVED',
            error: `Could not resolve mandatory rate comments (rateCommentsId=${room.selectedRate.rateCommentsId}) before confirmation`
          };
        }
        roomRateComments.push(resolved);
      } else {
        // Genuinely no rate comments exist for this rate at all (the common real case per
        // the 2026-09-28 live Availability scan) — never invented, never blocked.
        roomRateComments.push(undefined);
      }
    }
  }

  const bookingResult = await createHbxBooking({ holder: input.holder, rooms: finalRooms, clientReference: input.clientReference, remark: input.remark });
  if (!bookingResult.ok) {
    return { ok: false, reason: 'PROVIDER_ERROR', error: bookingResult.error };
  }

  // A genuine HBX reservation now exists — its reference must never be lost even if our
  // own persistence write fails for any reason (e.g. a schema mismatch). Confirmed as a
  // real risk during certification-readiness verification: an earlier version let a
  // persistence error propagate and crash the caller before it ever saw the reference,
  // leaving a real booking with no local record and no way to find it without querying
  // Hotelbeds' own booking list directly. The booking result is always returned; a
  // persistence failure is only ever logged, never allowed to hide the reference.
  let voucherAccessToken: string | undefined;
  try {
    voucherAccessToken = await persistBooking(bookingResult.booking, environment, input.rooms[0].selectedRate.providerHotelId, roomRateComments);
  } catch (error) {
    console.error(`[hbx] Failed to persist booking ${bookingResult.booking.reference} — the HBX reservation itself succeeded and must be tracked manually:`, error);
  }

  return { ok: true, booking: bookingResult.booking, recheckedRoomCount, voucherAccessToken };
}

/** Returns the generated voucher access token so the immediate caller can hand the
 *  customer a working voucher link right away, without a second database round trip.
 *  `roomRateComments` is the text confirmBooking already resolved (and gated on) BEFORE
 *  confirmation, indexed the same as `booking.rooms` — used as a fallback for any room
 *  whose real Booking Confirmation response comes back without its own `rateComments`
 *  text, so a voucher can never end up silently missing an applicable comment that was
 *  in fact resolved and shown to the customer pre-booking. */
async function persistBooking(
  booking: HbxBookingSummary,
  environment: 'test' | 'unknown' | 'production',
  providerHotelId: string,
  roomRateComments: Array<string | undefined> = []
): Promise<string> {
  await connectDB();

  // Best-effort only — a Booking Confirmation response never carries hotel address/
  // phone/category/destination itself (confirmed against a real captured response), and
  // this lookup must never block or fail a booking that already succeeded at Hotelbeds.
  const contentDetail = await getHotelContentDetail(Number(providerHotelId)).catch(() => null);

  const voucherAccessToken = generateVoucherAccessToken();

  await HbxBooking.create({
    reference: booking.reference,
    clientReference: booking.clientReference ?? '',
    status: booking.status,
    environment,
    providerHotelId,
    hotelName: booking.hotelName,
    hotelAddress: contentDetail?.address,
    hotelCity: contentDetail?.city,
    hotelPostalCode: contentDetail?.postalCode,
    hotelCategoryDescription: contentDetail?.categoryDescription,
    hotelPhone: contentDetail?.phone,
    destinationName: contentDetail?.destinationName,
    voucherAccessToken,
    currency: booking.currency,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    holderName: booking.holder.name,
    holderSurname: booking.holder.surname,
    rooms: booking.rooms.map((room, index) => ({
      code: room.code,
      name: room.name,
      boardCode: room.boardCode,
      boardName: room.boardName,
      netAmount: room.net,
      paxes: room.paxes ?? [],
      cancellationPolicies: room.cancellationPolicies ?? [],
      rateCommentsId: room.rateCommentsId,
      rateComments: room.rateComments ?? roomRateComments[index]
    })),
    totalNetAmount: booking.totalNet,
    supplierName: booking.supplierName,
    supplierVatNumber: booking.supplierVatNumber
  });

  return voucherAccessToken;
}

export type RetrieveBookingResult = { ok: true; booking: HbxBookingSummary } | { ok: false; reason: 'NOT_FOUND' | 'PROVIDER_ERROR' | 'NOT_CONFIGURED'; error?: string };

/** Retrieves the CURRENT state directly from Hotelbeds (never just replays the locally
 *  persisted copy) — the persisted models/HbxBooking.ts record is our own audit trail,
 *  not the source of truth for a booking's live status. */
export async function retrieveBooking(reference: string): Promise<RetrieveBookingResult> {
  const result = await getHbxBookingDetail(reference);
  if (!result.ok) return result;
  return { ok: true, booking: result.booking };
}

export type CancelBookingResult = { ok: true; status: string } | { ok: false; reason: 'NOT_FOUND' | 'PROVIDER_ERROR' | 'NOT_CONFIGURED'; error?: string };

/** Cancels with Hotelbeds AND updates our own persisted record's status — the persisted
 *  copy must never silently keep showing a stale "CONFIRMED" status after a real
 *  cancellation succeeds. */
export async function cancelBooking(reference: string): Promise<CancelBookingResult> {
  const result = await cancelHbxBooking(reference);
  if (result.ok) {
    await connectDB();
    await HbxBooking.updateOne({ reference }, { status: result.status, cancellationReference: result.cancellationReference });
  }
  return result;
}

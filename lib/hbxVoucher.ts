import { connectDB } from '@/lib/mongodb';
import { HbxBooking, type HbxBookingDocument } from '@/models/HbxBooking';

/**
 * The ONLY function allowed to read an HbxBooking for voucher display. Requires an EXACT
 * match on both `reference` (a real, guessable/enumerable Hotelbeds identifier) AND
 * `voucherAccessToken` (a random, unguessable secret — see models/HbxBooking.ts) in a
 * single query. Never queries by `reference` alone and never reveals — via timing,
 * response shape, or otherwise — whether a given `reference` exists when the token is
 * wrong or missing: a wrong token and a nonexistent reference both resolve to the same
 * `null`, so this can never be used to enumerate real booking references.
 */
export async function getVoucherBooking(reference: string, token: string | undefined): Promise<HbxBookingDocument | null> {
  if (!reference || !token) return null;

  await connectDB();
  return HbxBooking.findOne({ reference, voucherAccessToken: token }).lean<HbxBookingDocument>();
}

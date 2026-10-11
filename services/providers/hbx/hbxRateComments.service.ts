import { hbxFetch, isHbxConfigured } from './hbx.client';
import { logHbxError } from './hbx.errors';
import { checkRate } from './hbxCheckRate.service';
import type { NormalizedRate } from '../../pricing/stayPricing.types';

/**
 * Hotelbeds certification requires applicable rate comments/contract remarks to be shown
 * to the customer BEFORE booking confirmation — this is the one function that must be
 * called (and its `comments` displayed) before a caller ever invokes
 * hbxBookingWorkflow.service.ts's confirmBooking. Never invents comment text; an empty
 * `comments` array means "none returned by HBX for this rate", never "not checked yet".
 *
 * Deliberately a SEPARATE function from confirmBooking, not folded into it — confirmBooking
 * already has its own live-verified CheckRate-only-for-RECHECK branching (2026-09-28
 * certification-readiness verification); this function does not change that logic at all.
 * A real two-step customer flow (preview comments -> customer confirms -> book) may call
 * CheckRate twice for a 'RECHECK' rate (once here, once again inside confirmBooking) —
 * this is an accepted, documented tradeoff: CheckRate is HBX's own live re-validation
 * step, explicitly safe to call more than once, not a one-time-use lock.
 */
export type RateCommentsSource = 'AVAILABILITY_TEXT' | 'CHECKRATE_TEXT' | 'CONTENT_API_RESOLVED' | 'NONE_AVAILABLE' | 'RESOLUTION_FAILED';

export interface ResolvedRateComments {
  /** Every applicable comment string HBX returned — never truncated to one, never
   *  invented when empty. */
  comments: string[];
  source: RateCommentsSource;
}

/**
 * UNVERIFIED against live data. During the 2026-09-28 certification-readiness
 * verification, a real Availability scan across 4 destination/date combinations never
 * once returned a `rateCommentsId` (or `rateComments`) on a 'BOOKABLE' rate in this
 * account's TEST inventory, so this exact endpoint/response shape could not be confirmed
 * the way every other HBX call in this codebase was (see this file's own doc comment
 * trail and hbx.types.ts's own "confirmed against a real captured response" convention).
 * Implemented per Hotelbeds' documented Content API contract for resolving a rate
 * comment id to its full text; degrades safely to `null` on any failure or unexpected
 * shape — NEVER invents comment text. Confirm this path against real data (a genuine
 * rateCommentsId) before relying on it for a real certification submission.
 */
export async function resolveRateCommentsById(rateCommentsId: string): Promise<string | null> {
  if (!isHbxConfigured()) return null;

  try {
    const response = await hbxFetch<{ rateComments?: { comments?: Array<{ text?: string }> } }>(
      `/hotel-content-api/1.0/types/rateComments/${encodeURIComponent(rateCommentsId)}`
    );
    const text = response.rateComments?.comments
      ?.map((comment) => comment.text)
      .filter((value): value is string => Boolean(value))
      .join(' ');
    return text || null;
  } catch (error) {
    logHbxError('resolveRateCommentsById', error);
    return null;
  }
}

/**
 * Resolves whatever applicable rate comments exist for a specific selected rate, ready
 * to display to a customer before they confirm. Respects the rate's own check-in/
 * check-out context implicitly — comments are only ever resolved for the exact rate the
 * customer selected (itself already scoped to one specific stay), never looked up
 * generically outside that context.
 */
export async function resolveApplicableRateComments(rate: NormalizedRate): Promise<ResolvedRateComments> {
  if (rate.rateType === 'RECHECK') {
    const result = await checkRate(rate.rateKey ?? '', rate.nightCount);
    if (!result.ok) return { comments: [], source: 'RESOLUTION_FAILED' };
    return { comments: result.rate.rateComments ? [result.rate.rateComments] : [], source: 'CHECKRATE_TEXT' };
  }

  if (rate.rateComments) {
    return { comments: [rate.rateComments], source: 'AVAILABILITY_TEXT' };
  }

  if (rate.rateCommentsId) {
    const resolved = await resolveRateCommentsById(rate.rateCommentsId);
    if (resolved) return { comments: [resolved], source: 'CONTENT_API_RESOLVED' };
    return { comments: [], source: 'RESOLUTION_FAILED' };
  }

  return { comments: [], source: 'NONE_AVAILABLE' };
}

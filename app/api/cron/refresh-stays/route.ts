import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { StaysRefreshRun } from '@/models/StaysRefreshRun';
import { refreshAllConfiguredStays } from '@/lib/staysRefresh';

// A 'running' document older than this is treated as a crashed/killed invocation
// (serverless timeout, deploy interruption, ...) rather than a genuinely in-flight run —
// otherwise a single crash would permanently lock out every future refresh. Comfortably
// above how long a refresh under the current manifest (config/staysRefreshManifest.
// config.ts) is expected to take at REFRESH_CONCURRENCY=5 (lib/staysRefresh.ts).
const STALE_RUN_THRESHOLD_MS = 30 * 60 * 1000;

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;
}

// Vercel Cron sends this exact header on every real scheduled invocation (see
// vercel.json) — verifying it is what stops an arbitrary internet caller from triggering
// a real Google Places spend on demand simply by requesting this URL. Deliberately NOT a
// user-agent check (Part 6 of the Phase 1 brief: cost control must be architectural, not
// UA-based) — this is a shared-secret check on an endpoint that, by construction, is the
// only place in the app allowed to import lib/staysRefresh.ts at all.
//
// Deliberately reads ONLY the Authorization header — a query-string `?secret=...` is
// never accepted, even if it matched, because query strings routinely end up in access
// logs, browser history and Referer headers, which would defeat the point of a secret.
// The secret itself is also never included in any response body or console.log call
// anywhere in this route — only the fact that a check passed or failed is ever recorded.
function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed — an unconfigured secret must never mean "open"
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // Self-healing lock cleanup — see STALE_RUN_THRESHOLD_MS's own comment.
  await StaysRefreshRun.updateMany(
    { status: 'running', startedAt: { $lt: new Date(Date.now() - STALE_RUN_THRESHOLD_MS) } },
    {
      $set: { status: 'failed', completedAt: new Date() },
      $push: { runErrors: { destinationSlug: '*', stayType: '*', message: 'Marked failed: exceeded the 30-minute safety timeout' } }
    }
  );

  let runDoc;
  try {
    runDoc = await StaysRefreshRun.create({
      startedAt: new Date(),
      status: 'running',
      manifestTagCount: 0,
      searchGroupCount: 0,
      dueGroupCount: 0,
      searchGroupsAttempted: 0,
      searchGroupsSkippedForBudget: 0,
      destinationsProcessed: 0,
      googleRequestCount: 0,
      recordsUpserted: 0,
      budgetLimited: false,
      runErrors: []
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ error: 'A stays refresh is already running' }, { status: 409 });
    }
    throw error;
  }

  try {
    const summary = await refreshAllConfiguredStays();
    // 'partial' whenever anything less than a full, clean run happened — a per-group
    // error, or the budget cutting the run short before every configured group ran.
    // Existing MongoDB data is never invalidated by either condition (see
    // lib/staysRefresh.ts — every write is upsert-only); 'partial' communicates
    // "refreshed less than the full manifest this cycle", not "public data is stale/bad".
    const status = summary.errors.length === 0 && !summary.budgetLimited ? 'completed' : 'partial';
    await StaysRefreshRun.findByIdAndUpdate(runDoc._id, {
      completedAt: new Date(),
      status,
      manifestTagCount: summary.manifestTagCount,
      searchGroupCount: summary.searchGroupCount,
      dueGroupCount: summary.dueGroupCount,
      searchGroupsAttempted: summary.searchGroupsAttempted,
      searchGroupsSkippedForBudget: summary.searchGroupsSkippedForBudget,
      destinationsProcessed: summary.destinationsProcessed,
      googleRequestCount: summary.googleRequestCount,
      recordsUpserted: summary.recordsUpserted,
      budgetLimited: summary.budgetLimited,
      runErrors: summary.errors
    });
    return NextResponse.json({ runId: String(runDoc._id), status, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'UNKNOWN_ERROR';
    await StaysRefreshRun.findByIdAndUpdate(runDoc._id, {
      completedAt: new Date(),
      status: 'failed',
      runErrors: [{ destinationSlug: '*', stayType: '*', message }]
    });
    console.error('Stays refresh run failed', error);
    return NextResponse.json({ error: 'Refresh failed', runId: String(runDoc._id) }, { status: 500 });
  }
}

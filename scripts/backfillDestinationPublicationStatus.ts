/**
 * ONE-TIME backfill: sets `status: 'published'` on every EXISTING Destination document
 * that doesn't already have a `status` field set. models/Destination.ts now defaults
 * new/unset Destinations to `status: 'draft'` (the Phase 3B draft/publish workflow) —
 * every public query (lib/destinations.ts, app/sitemap.ts, proxy.ts,
 * services/regions/regionHub.service.ts) filters on `status: 'published'`, so WITHOUT
 * this backfill every currently-live destination would disappear from the site the
 * moment that filtering code deploys.
 *
 * Unlike scripts/backfillJourneyPublicationStatus.ts (which targeted 6 explicitly-named
 * slugs), this targets EVERY document lacking the field at all — there is no fixed
 * short list here; the entire existing curated catalogue (~70 destinations at the time
 * this script was written) is, by definition, already-legitimate live content.
 *
 * SAFETY:
 *  - The selector is `{ status: { $exists: false } }` — a document that already has ANY
 *    status value (including an already-'draft' one, e.g. a Ladakh destination seeded
 *    after this script's first run) is never touched. Re-running after a successful
 *    backfill finds nothing left to do.
 *  - $set on `status` alone — never a full-document replace — so no other field is
 *    touched on any document.
 *  - Defaults to a DRY RUN: reports counts but writes nothing unless invoked with
 *    --execute.
 *  - Never creates or deletes any document.
 *
 * Usage:
 *   npx tsx scripts/backfillDestinationPublicationStatus.ts             (dry run — default)
 *   npx tsx scripts/backfillDestinationPublicationStatus.ts --execute    (applies the backfill)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Destination publication-status backfill — mode: ${execute ? 'EXECUTE (will write status field)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  const total = await Destination.countDocuments();
  const withoutStatus = await Destination.countDocuments({ status: { $exists: false } });
  const alreadyPublished = await Destination.countDocuments({ status: 'published' });
  const alreadyDraft = await Destination.countDocuments({ status: 'draft' });

  console.log(`\nTotal Destination documents:      ${total}`);
  console.log(`Without a status field (to fix):  ${withoutStatus}`);
  console.log(`Already published:                 ${alreadyPublished}`);
  console.log(`Already draft (untouched):         ${alreadyDraft}`);

  if (withoutStatus === 0) {
    console.log('\nNothing to do — every document already has a status.');
    await mongoose.disconnect();
    return;
  }

  if (execute) {
    const result = await Destination.updateMany({ status: { $exists: false } }, { $set: { status: 'published' } });
    console.log(`\nUpdated ${result.modifiedCount} document(s) to status: 'published'.`);
  } else {
    console.log(`\nDRY RUN — would set ${withoutStatus} document(s) to status: 'published'. Re-run with --execute to apply.`);
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Destination publication-status backfill failed:', error);
    process.exit(1);
  });
}

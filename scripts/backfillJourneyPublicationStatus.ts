/**
 * ONE-TIME backfill: sets `status: 'published'` on the 6 legitimate, already-live
 * Journey documents. models/Journey.ts now defaults new/unset Journeys to `status:
 * 'draft'` (the Phase 2 draft/publish workflow) — every public query (lib/packages.ts,
 * app/sitemap.ts, proxy.ts, services/regions/regionHub.service.ts) filters on `status:
 * 'published'`, so WITHOUT this backfill the 6 real, currently-public journeys would
 * disappear from the live site the moment that filtering code deploys.
 *
 * SAFETY:
 *  - Touches ONLY the 6 explicitly-named real slugs below — never a blanket
 *    "set every Journey to published" operation, which would also publish any draft.
 *  - $set on `status` alone — never a full-document replace, so no other field is
 *    touched (see scripts/seed.ts's own doc comment on why a full replace is risky).
 *  - Idempotent: re-running finds each already `status: 'published'` and reports
 *    "already correct" rather than erroring or double-writing.
 *  - Defaults to a DRY RUN: reports what it would change but writes nothing unless
 *    invoked with --execute.
 *  - Never creates, deletes, or modifies any other field on any Journey document.
 *
 * Usage:
 *   npx tsx scripts/backfillJourneyPublicationStatus.ts             (dry run — default)
 *   npx tsx scripts/backfillJourneyPublicationStatus.ts --execute    (applies the backfill)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';

// The exact 6 live, legitimate public Journeys — verified directly against
// config/packages.config.ts (the seed source of truth) before writing this script, not
// assumed from memory or display-name guesses.
const LEGITIMATE_PUBLIC_SLUGS = [
  'manali-premium-escape',
  'kashmir-signature-journey',
  'spiti-valley-adventure',
  'himachal-himalayan-explorer',
  'dharamshala-dalhousie-escape',
  'uttarakhand-explorer'
];

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Journey publication-status backfill — mode: ${execute ? 'EXECUTE (will write status field)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  let alreadyCorrect = 0;
  let toUpdate = 0;
  let missing = 0;

  for (const slug of LEGITIMATE_PUBLIC_SLUGS) {
    const doc = await Journey.findOne({ slug }).select('slug status').lean<{ slug: string; status?: string } | null>();
    if (!doc) {
      console.log(`  MISSING: "${slug}" — no Journey document exists with this slug. Not created by this script.`);
      missing += 1;
      continue;
    }
    if (doc.status === 'published') {
      console.log(`  Already correct: "${slug}" (status: published)`);
      alreadyCorrect += 1;
      continue;
    }
    console.log(`  ${execute ? 'Setting' : 'Would set'}: "${slug}" — current status: ${doc.status ?? '(unset — defaults to draft)'} -> published`);
    toUpdate += 1;
    if (execute) {
      await Journey.updateOne({ slug }, { $set: { status: 'published' } });
    }
  }

  console.log(`\nSummary: ${alreadyCorrect} already correct, ${toUpdate} ${execute ? 'updated' : 'would be updated'}, ${missing} missing.`);
  if (!execute && toUpdate > 0) {
    console.log('DRY RUN — re-run with --execute to actually apply this.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Journey publication-status backfill failed:', error);
    process.exit(1);
  });
}

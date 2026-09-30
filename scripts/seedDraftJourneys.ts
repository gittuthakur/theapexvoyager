/**
 * Idempotent DRAFT-ONLY seed for the Phase 2 package-expansion candidates
 * (config/draftJourneys.config.ts). Every document this writes has `status: 'draft'` —
 * see models/Journey.ts's pre-validate hook, which makes it impossible for any of these
 * to pass validation as 'published' in their current (no price/inclusions/exclusions)
 * state, and lib/packages.ts / app/sitemap.ts / proxy.ts, which all filter to
 * `status: 'published'` only, so a draft written by this script is invisible on every
 * public surface — PROVIDED the draft/publish filtering code (Phase 2) is already
 * deployed. See this script's own safety note below before running it.
 *
 * SAFETY:
 *  - Upserts by `slug` using `$set` on exactly the draft's own fields — never a full
 *    document replace, so nothing else on an existing document is touched.
 *  - Refuses to touch any slug that matches a LIVE, published package's slug (defense in
 *    depth on top of config/draftJourneys.config.test.ts's own compile-time check).
 *  - Every write is forced to `status: 'draft'` regardless of what's already in the
 *    config object — this script can never accidentally publish anything.
 *  - Defaults to a DRY RUN: reports what it would create/update, writes nothing unless
 *    invoked with --execute.
 *  - Never deletes a document.
 *
 * SEQUENCING WARNING — read before running with --execute:
 *   This project has ONE MongoDB database shared by local development and production
 *   (see lib/stays.ts's own comment on this). If the Phase 2 draft/publish filtering
 *   code (models/Journey.ts, lib/packages.ts, app/sitemap.ts, proxy.ts,
 *   services/regions/regionHub.service.ts) has NOT yet been deployed, the
 *   CURRENTLY-LIVE code has no `status` filter at all — it would serve any draft this
 *   script creates on the public site immediately. Only run --execute after that
 *   filtering code is deployed and confirmed live, or seed against a separate, genuinely
 *   non-shared database.
 *
 * Usage:
 *   npx tsx scripts/seedDraftJourneys.ts             (dry run — default)
 *   npx tsx scripts/seedDraftJourneys.ts --execute     (writes the drafts)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';
import { draftJourneys } from '../config/draftJourneys.config';
import { packages as livePackages } from '../config/packages.config';

const LIVE_SLUGS = new Set(livePackages.map((p) => p.slug));

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Draft Journey seed — mode: ${execute ? 'EXECUTE (will write documents)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const refused: string[] = [];

  for (const journey of draftJourneys) {
    if (LIVE_SLUGS.has(journey.slug)) {
      console.error(`  REFUSING: "${journey.slug}" collides with a live, published package slug — not touched.`);
      refused.push(journey.slug);
      continue;
    }

    const existing = await Journey.findOne({ slug: journey.slug }).select('slug status').lean<{ slug: string; status?: string } | null>();
    const { status: _status, ...rest } = journey;
    const setDoc = { ...rest, status: 'draft' as const };

    if (!existing) {
      console.log(`  ${execute ? 'Creating' : 'Would create'}: "${journey.slug}" (status: draft)`);
      created += 1;
    } else if (existing.status !== 'draft') {
      console.log(
        `  ${execute ? 'Updating' : 'Would update'}: "${journey.slug}" — existing status was "${existing.status}", forcing back to draft.`
      );
      updated += 1;
    } else {
      console.log(`  Already present as draft: "${journey.slug}" — content refreshed from config, status unchanged.`);
      unchanged += 1;
    }

    if (execute) {
      await Journey.findOneAndUpdate({ slug: journey.slug }, { $set: setDoc }, { upsert: true });
    }
  }

  console.log(
    `\nSummary: ${created} ${execute ? 'created' : 'would be created'}, ${updated} ${execute ? 'updated' : 'would be updated'}, ${unchanged} already correct, ${refused.length} refused.`
  );
  if (!execute) {
    console.log('DRY RUN — re-run with --execute to actually apply this. Read this script\'s SEQUENCING WARNING first.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Draft Journey seed failed:', error);
    process.exit(1);
  });
}

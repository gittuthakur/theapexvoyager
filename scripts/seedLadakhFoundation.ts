/**
 * Idempotent DRAFT-ONLY seed for the Ladakh Region + 8 Destinations
 * (config/ladakhFoundation.config.ts). Every document this writes has `status: 'draft'`
 * — see models/Destination.ts and models/Region.ts's pre-existing publication-status
 * fields, and lib/destinations.ts/app/sitemap.ts/proxy.ts/services/regions/
 * regionHub.service.ts, which all filter to `status: 'published'` only. A draft written
 * by this script is invisible on every public surface — PROVIDED the Destination
 * publication-status filtering code (Phase 3B) is already deployed and verified. See
 * this script's own safety note below before running it.
 *
 * SAFETY:
 *  - Upserts by `slug` using `$set` on exactly each draft's own fields — never a full
 *    document replace.
 *  - Every write is forced to `status: 'draft'` regardless of what's already in the
 *    config object — this script can never accidentally publish anything, mirroring
 *    scripts/seedDraftJourneys.ts's identical guarantee for Journey.
 *  - Defaults to a DRY RUN: reports what it would create/update, writes nothing unless
 *    invoked with --execute.
 *  - Never deletes a document.
 *
 * SEQUENCING WARNING — read before running with --execute:
 *   This project has ONE MongoDB database shared by local development and production.
 *   If the Destination publication-status filtering code (models/Destination.ts,
 *   lib/destinations.ts, app/sitemap.ts, proxy.ts, services/regions/
 *   regionHub.service.ts) has NOT yet been deployed, the CURRENTLY-LIVE code has no
 *   `status` filter on Destination queries at all — it would serve any draft this
 *   script creates on the public site immediately. Only run --execute after that
 *   filtering code is deployed and confirmed live (mirrors the exact sequencing this
 *   session already applied for the Journey draft/publish workflow).
 *
 * Usage:
 *   npx tsx scripts/seedLadakhFoundation.ts             (dry run — default)
 *   npx tsx scripts/seedLadakhFoundation.ts --execute     (writes the drafts)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Region } from '../models/Region';
import { Destination } from '../models/Destination';
import { ladakhRegionDraft, ladakhDestinationDrafts } from '../config/ladakhFoundation.config';

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Ladakh foundation seed — mode: ${execute ? 'EXECUTE (will write documents)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  // --- Region ---
  const { status: _regionStatus, ...regionRest } = ladakhRegionDraft;
  const regionSetDoc = { ...regionRest, status: 'draft' as const };
  const existingRegion = await Region.findOne({ slug: ladakhRegionDraft.slug }).select('slug status').lean<{ slug: string; status?: string } | null>();
  if (!existingRegion) {
    console.log(`  ${execute ? 'Creating' : 'Would create'} Region: "${ladakhRegionDraft.slug}" (status: draft)`);
  } else {
    console.log(`  ${execute ? 'Updating' : 'Would update'} Region: "${ladakhRegionDraft.slug}" — existing status: ${existingRegion.status}, forcing to draft.`);
  }
  if (execute) {
    await Region.findOneAndUpdate({ slug: ladakhRegionDraft.slug }, { $set: regionSetDoc }, { upsert: true });
  }

  // --- Destinations ---
  let created = 0;
  let updated = 0;
  for (const destination of ladakhDestinationDrafts) {
    const { requiresPriorAcclimatisation: _flag, ...destinationRest } = destination;
    const setDoc = { ...destinationRest, status: 'draft' as const };
    const existing = await Destination.findOne({ slug: destination.slug }).select('slug status').lean<{ slug: string; status?: string } | null>();
    if (!existing) {
      console.log(`  ${execute ? 'Creating' : 'Would create'} Destination: "${destination.slug}" (status: draft)`);
      created += 1;
    } else {
      console.log(`  ${execute ? 'Updating' : 'Would update'} Destination: "${destination.slug}" — existing status: ${existing.status}, forcing to draft.`);
      updated += 1;
    }
    if (execute) {
      await Destination.findOneAndUpdate({ slug: destination.slug }, { $set: setDoc }, { upsert: true });
    }
  }

  console.log(`\nDestinations summary: ${created} ${execute ? 'created' : 'would be created'}, ${updated} ${execute ? 'updated' : 'would be updated'}.`);
  if (!execute) {
    console.log('DRY RUN — re-run with --execute to actually apply this. Read this script\'s SEQUENCING WARNING first.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Ladakh foundation seed failed:', error);
    process.exit(1);
  });
}

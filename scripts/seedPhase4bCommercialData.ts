/**
 * Idempotent, NARROWLY-SCOPED production update for EXACTLY the 10 Phase 4/4A/4B
 * target Journey slugs (config/draftJourneys.config.ts). Updates COMMERCIAL DATA ONLY
 * — pickupInfo, dropInfo, mealPlan, transportType, hotelCategoryDescription,
 * minTravellers, roomsIncluded, inclusions, exclusions, usesGeneralCancellationPolicy,
 * priceBasis, importantNotes, and itinerary (the last two carry the Kashmir Family
 * Tour houseboat resolution and the resolved pickup/drop notes for the other flagged
 * packages). Deliberately does NOT touch `status` — see models/Journey.ts and
 * docs/phase-4b-final-commercial-approval.md: publication remains a separate, future,
 * manual decision.
 *
 * SAFETY:
 *  - Refuses (does not upsert) any slug not already present in the database — these 10
 *    were already seeded as drafts in Phase 3C; this script only ever updates existing
 *    documents, never creates one.
 *  - Refuses any of the 10 slugs that collides with a live, published package slug
 *    (defense in depth, mirrors scripts/seedDraftJourneys.ts).
 *  - `$set` on an explicit, named field allow-list only — never a full document
 *    replace, never touches `status`, `price`, or any field outside this allow-list.
 *  - Defaults to a DRY RUN: reports what it would update, writes nothing unless invoked
 *    with --execute.
 *
 * Usage:
 *   npx tsx scripts/seedPhase4bCommercialData.ts             (dry run — default)
 *   npx tsx scripts/seedPhase4bCommercialData.ts --execute     (writes the updates)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';
import { draftJourneys } from '../config/draftJourneys.config';
import { packages as livePackages } from '../config/packages.config';

const TARGET_SLUGS = [
  'shimla-manali-tour-package',
  'kinnaur-spiti-circuit',
  'kasol-kheerganga-tosh',
  'jibhi-tirthan-valley',
  'kashmir-family-tour',
  'kashmir-pahalgam-gulmarg-sonamarg-tour',
  'char-dham-yatra',
  'kedarnath-badrinath-yatra',
  'nainital-corbett-mussoorie-tour',
  'auli-chopta-tungnath-tour'
] as const;

const LIVE_SLUGS = new Set(livePackages.map((p) => p.slug));

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Phase 4B commercial-data seed — mode: ${execute ? 'EXECUTE (will write documents)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  let updated = 0;
  let skipped = 0;
  const conflicts: string[] = [];

  for (const slug of TARGET_SLUGS) {
    if (LIVE_SLUGS.has(slug)) {
      console.error(`  REFUSING: "${slug}" collides with a live, published package slug — not touched.`);
      conflicts.push(slug);
      continue;
    }

    const journey = draftJourneys.find((j) => j.slug === slug);
    if (!journey) {
      console.error(`  REFUSING: "${slug}" not found in config/draftJourneys.config.ts — not touched.`);
      conflicts.push(slug);
      continue;
    }

    const existing = await Journey.findOne({ slug }).select('slug status').lean<{ slug: string; status?: string } | null>();
    if (!existing) {
      console.error(`  SKIPPING: "${slug}" does not exist in the database yet — this script only updates existing documents.`);
      skipped += 1;
      continue;
    }

    const setDoc = {
      pickupInfo: journey.pickupInfo,
      dropInfo: journey.dropInfo,
      mealPlan: journey.mealPlan,
      transportType: journey.transportType,
      hotelCategoryDescription: journey.hotelCategoryDescription,
      minTravellers: journey.minTravellers,
      roomsIncluded: journey.roomsIncluded,
      inclusions: journey.inclusions,
      exclusions: journey.exclusions,
      usesGeneralCancellationPolicy: journey.usesGeneralCancellationPolicy,
      priceBasis: journey.priceBasis,
      importantNotes: journey.importantNotes,
      itinerary: journey.itinerary
    };

    console.log(`  ${execute ? 'Updating' : 'Would update'}: "${slug}" (commercial data only — existing status "${existing.status}" left untouched)`);
    updated += 1;

    if (execute) {
      await Journey.updateOne({ slug }, { $set: setDoc });
    }
  }

  console.log(
    `\nSummary: ${updated} ${execute ? 'updated' : 'would be updated'}, ${skipped} skipped (not found), ${conflicts.length} refused (conflict).`
  );
  if (!execute) {
    console.log('DRY RUN — re-run with --execute to actually apply this.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Phase 4B commercial-data seed failed:', error);
    process.exit(1);
  });
}

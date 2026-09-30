/**
 * Idempotent, EXACT-ALLOWLIST production update for the 10 Phase 4C target Journey
 * slugs (config/draftJourneys.config.ts). Updates the `image` field ONLY — see
 * docs/phase-4c-r-blocker-recovery.md for how each image was resolved (a real,
 * already-published curated Destination photo, never fabricated, never the Ladakh
 * placeholder). Deliberately does NOT touch `status`, `price`, or any commercial field.
 *
 * SAFETY:
 *  - Refuses (does not upsert) any slug not already present in the database.
 *  - Refuses any of the 10 slugs that collides with a live, published package slug.
 *  - `$set: { image }` only — a single-field update, never a full document replace.
 *  - Defaults to a DRY RUN: reports what it would update, writes nothing unless invoked
 *    with --execute.
 *
 * Usage:
 *   npx tsx scripts/seedPhase4cImages.ts             (dry run — default)
 *   npx tsx scripts/seedPhase4cImages.ts --execute     (writes the updates)
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
  console.log(`Phase 4C image seed — mode: ${execute ? 'EXECUTE (will write documents)' : 'DRY RUN (inspect only, no changes)'}`);

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
    if (!journey || !journey.image) {
      console.error(`  REFUSING: "${slug}" has no resolved image in config/draftJourneys.config.ts — not touched.`);
      conflicts.push(slug);
      continue;
    }

    const existing = await Journey.findOne({ slug }).select('slug status image').lean<{ slug: string; status?: string; image?: string } | null>();
    if (!existing) {
      console.error(`  SKIPPING: "${slug}" does not exist in the database yet — this script only updates existing documents.`);
      skipped += 1;
      continue;
    }

    console.log(
      `  ${execute ? 'Updating' : 'Would update'}: "${slug}" image "${existing.image ?? '(none)'}" -> "${journey.image}" (status "${existing.status}" left untouched)`
    );
    updated += 1;

    if (execute) {
      await Journey.updateOne({ slug }, { $set: { image: journey.image } });
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
    console.error('Phase 4C image seed failed:', error);
    process.exit(1);
  });
}

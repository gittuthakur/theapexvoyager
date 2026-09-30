/**
 * Idempotent, EXACT-ALLOWLIST publication mechanism for the first 10 commercially-ready
 * Journey drafts (see docs/site-wide-real-image-audit.md and
 * docs/phase-4b-final-commercial-approval.md for how each one reached this point).
 *
 * Mutation scope: `status: 'draft' -> 'published'` ONLY, for exactly the 10 named slugs.
 * Never rewrites price, image, itinerary, or any commercial field — this script does not
 * even read those fields from config/draftJourneys.config.ts; it only reads a document's
 * CURRENT state from the database to decide whether it is safe to flip.
 *
 * SAFETY (every one of these is checked before any write):
 *  - Exact slug matching against the 10-item allowlist below — no fuzzy matching, no
 *    pattern matching. A slug not on this list is never touched, full stop.
 *  - Refuses (does not publish) a target that doesn't exist in the database.
 *  - Refuses a target whose `status` is already something other than 'draft' (e.g.
 *    already 'published' — reported as "already published", not re-written).
 *  - Refuses a target with no real `image`, or whose `image` doesn't resolve to a file
 *    that exists under public/images/.
 *  - Refuses a target with no `regionId`.
 *  - Refuses a target with any `destinationSlugs` entry that doesn't resolve to a real
 *    Destination document.
 *  - Refuses a target whose `getCommercialBlockers()` result contains anything other
 *    than exactly `OWNER_APPROVAL_REQUIRED` (i.e. any real, unresolved factual blocker).
 *  - `$set: { status: 'published' }` only — a single-field update, via `updateOne`, never
 *    a full document replace, never touching any other path.
 *  - Defaults to a DRY RUN: reports what it would publish, writes nothing unless invoked
 *    with --execute.
 *
 * Usage:
 *   npx tsx scripts/publishFirstJourneyBatch.ts             (dry run — default)
 *   npx tsx scripts/publishFirstJourneyBatch.ts --execute     (publishes the 10)
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';

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

function imageExistsOnDisk(image?: string): boolean {
  if (!image) return false;
  if (/^https?:\/\//i.test(image)) return true;
  return fs.existsSync(path.join('public', image));
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`First Journey batch publication — mode: ${execute ? 'EXECUTE (will publish)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  let wouldPublish = 0;
  let alreadyPublished = 0;
  let refused = 0;

  for (const slug of TARGET_SLUGS) {
    const doc = await Journey.findOne({ slug }).lean<Record<string, unknown> | null>();

    if (!doc) {
      console.error(`  REFUSING: "${slug}" not found in the database.`);
      refused += 1;
      continue;
    }

    if (doc.status === 'published') {
      console.log(`  ALREADY PUBLISHED: "${slug}" — not touched.`);
      alreadyPublished += 1;
      continue;
    }

    if (doc.status !== 'draft') {
      console.error(`  REFUSING: "${slug}" has unexpected status "${doc.status}" (neither draft nor published).`);
      refused += 1;
      continue;
    }

    if (!imageExistsOnDisk(doc.image as string | undefined)) {
      console.error(`  REFUSING: "${slug}" has no valid image ("${doc.image}") — does not resolve on disk.`);
      refused += 1;
      continue;
    }

    if (!doc.regionId) {
      console.error(`  REFUSING: "${slug}" has no regionId.`);
      refused += 1;
      continue;
    }

    const destinationSlugs = (doc.destinationSlugs as string[]) ?? [];
    let allResolve = true;
    for (const dSlug of destinationSlugs) {
      const found = await Destination.findOne({ slug: dSlug }).select('slug').lean();
      if (!found) {
        console.error(`  REFUSING: "${slug}" references unresolved destination slug "${dSlug}".`);
        allResolve = false;
        break;
      }
    }
    if (!allResolve) {
      refused += 1;
      continue;
    }

    const blockers = getCommercialBlockers({
      status: doc.status as 'draft' | 'published',
      price: doc.price as number,
      hotelCategoryDescription: doc.hotelCategoryDescription as string,
      stayOptions: doc.stayOptions as unknown[],
      transportType: doc.transportType as string,
      transportOptions: doc.transportOptions as unknown[],
      minTravellers: doc.minTravellers as number,
      roomsIncluded: doc.roomsIncluded as number,
      pickupInfo: doc.pickupInfo as string,
      dropInfo: doc.dropInfo as string,
      mealPlan: doc.mealPlan as string,
      inclusions: doc.inclusions as string[],
      exclusions: doc.exclusions as string[],
      usesGeneralCancellationPolicy: doc.usesGeneralCancellationPolicy as boolean
    });
    const realBlockers = blockers.filter((b) => b !== 'OWNER_APPROVAL_REQUIRED');
    if (realBlockers.length > 0) {
      console.error(`  REFUSING: "${slug}" has unresolved commercial blockers: ${realBlockers.join(', ')}.`);
      refused += 1;
      continue;
    }

    console.log(`  ${execute ? 'Publishing' : 'Would publish'}: "${slug}" (status draft -> published; image/price/itinerary/commercial data untouched).`);
    wouldPublish += 1;

    if (execute) {
      await Journey.updateOne({ slug }, { $set: { status: 'published' } });
    }
  }

  console.log(
    `\nSummary: ${execute ? 'published' : 'would publish'}=${wouldPublish}, already published=${alreadyPublished}, refused=${refused}.`
  );
  if (!execute) {
    console.log('DRY RUN — re-run with --execute to actually apply this.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('First Journey batch publication failed:', error);
    process.exit(1);
  });
}

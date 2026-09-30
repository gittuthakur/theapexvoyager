/**
 * Idempotent, EXACT-ALLOWLIST production update for the 3 P1 live-package image fixes
 * identified in docs/site-wide-real-image-audit.md. Updates the `image` field ONLY, for
 * exactly these 3 already-published Journey slugs — never `status`, never price, never
 * any other field. These 3 are already `status: 'published'` and stay that way; this is
 * a correction to already-live content, not a publication action.
 *
 * Usage:
 *   npx tsx scripts/seedPhase4dLivePackageImages.ts             (dry run — default)
 *   npx tsx scripts/seedPhase4dLivePackageImages.ts --execute     (writes the updates)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';
import { packages as livePackages } from '../config/packages.config';

const TARGET_SLUGS = ['kashmir-signature-journey', 'himachal-himalayan-explorer', 'uttarakhand-explorer'] as const;

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`Phase 4D live-package image fix — mode: ${execute ? 'EXECUTE (will write documents)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();

  let updated = 0;
  let skipped = 0;

  for (const slug of TARGET_SLUGS) {
    const configPkg = livePackages.find((p) => p.slug === slug);
    if (!configPkg) {
      console.error(`  REFUSING: "${slug}" not found in config/packages.config.ts — not touched.`);
      skipped += 1;
      continue;
    }

    const existing = await Journey.findOne({ slug }).select('slug status image').lean<{ slug: string; status?: string; image?: string } | null>();
    if (!existing) {
      console.error(`  SKIPPING: "${slug}" does not exist in the database — not touched.`);
      skipped += 1;
      continue;
    }
    if (existing.status !== 'published') {
      console.error(`  REFUSING: "${slug}" is not currently published (status "${existing.status}") — this script only corrects already-live package images.`);
      skipped += 1;
      continue;
    }

    console.log(`  ${execute ? 'Updating' : 'Would update'}: "${slug}" image "${existing.image}" -> "${configPkg.image}" (status stays "published")`);
    updated += 1;

    if (execute) {
      await Journey.updateOne({ slug }, { $set: { image: configPkg.image } });
    }
  }

  console.log(`\nSummary: ${updated} ${execute ? 'updated' : 'would be updated'}, ${skipped} skipped.`);
  if (!execute) {
    console.log('DRY RUN — re-run with --execute to actually apply this.');
  }

  await mongoose.disconnect();
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('Phase 4D live-package image fix failed:', error);
    process.exit(1);
  });
}

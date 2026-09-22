/**
 * One-time, idempotent backfill of the "The Apex Voyager" → "The Apex Voyager India"
 * brand rename into Destination.seo/Region.seo — the two fields that are read straight
 * from MongoDB at request time (see app/destinations/[slug]/page.tsx's
 * `destination.seo?.title ?? ...` and app/regions/[slug]/page.tsx's `region.seo.title`),
 * so the Phase 1 rename of config/destinations.config.ts and config/regions.config.ts
 * never reached these two fields' already-seeded values.
 *
 * Deliberately narrow: only `seo.title`/`seo.description`, and only the exact brand
 * substring within them — never a full `seo` object overwrite from config (which would
 * also clobber any hand-edited destination-specific SEO copy that has since diverged
 * from the config file), and never any other field (slug, title, description, price,
 * image, etc). Matches are `/The Apex Voyager(?! India)/g` — a document already saying
 * "The Apex Voyager India" is left untouched, which is what makes a second run a safe
 * no-op (see the dry-run/`--apply` split below).
 *
 * Usage:
 *   npx tsx scripts/backfillBrandNameSeo.ts                 — dry run (default), no writes
 *   npx tsx scripts/backfillBrandNameSeo.ts --apply          — writes, after the same
 *                                                              70 Destination + 3 Region
 *                                                              safety-count assertion the
 *                                                              dry run itself reports
 *   npx tsx scripts/backfillBrandNameSeo.ts --rollback <backup-file>
 *                                                              — restores the exact prior
 *                                                              `seo` object (both fields)
 *                                                              for every document listed
 *                                                              in that backup file
 *
 * Rollback mechanism: before any write, the complete pre-migration `seo` object (title
 * AND description, even if only one changed) for every affected document is saved to
 * scripts/backups/brand-name-seo-backfill-<ISO timestamp>.json. `--rollback` reads that
 * file back and restores each document's `seo` object exactly, by `_id`. Nothing is
 * deleted or dropped — this is a plain JSON export, not a full database dump — but it is
 * a complete, targeted, byte-exact undo for every field this script can possibly change.
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_BRAND_PATTERN = /The Apex Voyager(?! India)/g;
const EXPECTED_DESTINATION_COUNT = 70;
const EXPECTED_REGION_COUNT = 3;
const BACKUP_DIR = path.join(__dirname, 'backups');

type ModelName = 'Destination' | 'Region';
type SeoField = 'seo.title' | 'seo.description';

interface FieldChange {
  field: SeoField;
  before: string;
  after: string;
}

interface DocChange {
  model: ModelName;
  id: string;
  slug: string;
  seoBefore: { title?: string; description?: string };
  changes: FieldChange[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function hasOldBrand(value: string | undefined): boolean {
  if (!value) return false;
  OLD_BRAND_PATTERN.lastIndex = 0;
  return OLD_BRAND_PATTERN.test(value);
}

function replaceOldBrand(value: string): string {
  OLD_BRAND_PATTERN.lastIndex = 0;
  return value.replace(OLD_BRAND_PATTERN, 'The Apex Voyager India');
}

function computeChanges(seo: { title?: string; description?: string } | undefined): FieldChange[] {
  const changes: FieldChange[] = [];
  if (hasOldBrand(seo?.title)) {
    changes.push({ field: 'seo.title', before: seo!.title!, after: replaceOldBrand(seo!.title!) });
  }
  if (hasOldBrand(seo?.description)) {
    changes.push({ field: 'seo.description', before: seo!.description!, after: replaceOldBrand(seo!.description!) });
  }
  return changes;
}

function printDryRunReport(destChanges: DocChange[], regionChanges: DocChange[]) {
  for (const dc of [...destChanges, ...regionChanges]) {
    for (const c of dc.changes) {
      console.log(`[${dc.model}] id=${dc.id} slug=${dc.slug} field=${c.field}`);
      console.log(`  before: ${c.before}`);
      console.log(`  after:  ${c.after}`);
    }
  }
  console.log(`\nDestination documents to change: ${destChanges.length} (expected ${EXPECTED_DESTINATION_COUNT})`);
  console.log(`Region documents to change: ${regionChanges.length} (expected ${EXPECTED_REGION_COUNT})`);
}

async function runRollback(backupFile: string) {
  await connectDB();
  const raw = fs.readFileSync(backupFile, 'utf-8');
  const entries: DocChange[] = JSON.parse(raw);
  console.log(`Rolling back ${entries.length} documents from ${backupFile}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const entry of entries) {
        const Model = entry.model === 'Destination' ? Destination : Region;
        const result = await Model.updateOne({ _id: entry.id }, { $set: { seo: entry.seoBefore } }, { session });
        assert(result.matchedCount === 1, `Rollback: document not found — ${entry.model} ${entry.id} (${entry.slug})`);
        console.log(`Restored ${entry.model} ${entry.slug} (${entry.id})`);
      }
    });
    console.log('Rollback committed.');
  } finally {
    await session.endSession();
  }
  await mongoose.disconnect();
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const rollbackIndex = process.argv.indexOf('--rollback');
  if (rollbackIndex !== -1) {
    const backupFile = process.argv[rollbackIndex + 1];
    assert(backupFile, 'Usage: --rollback <backup-file>');
    await runRollback(backupFile);
    return;
  }

  assert(
    process.argv.slice(2).every((arg) => arg === '--apply'),
    'Unknown argument. Only --apply (or --rollback <file>) is supported.'
  );
  const apply = process.argv.includes('--apply');
  console.log(`Brand name SEO backfill — ${apply ? 'APPLY' : 'DRY RUN'}`);

  await connectDB();

  const destinations = await Destination.find().lean<{ _id: mongoose.Types.ObjectId; slug: string; seo?: { title?: string; description?: string } }[]>();
  const regions = await Region.find().lean<{ _id: mongoose.Types.ObjectId; slug: string; seo?: { title?: string; description?: string } }[]>();

  const destChanges: DocChange[] = destinations
    .map((d) => ({ model: 'Destination' as const, id: String(d._id), slug: d.slug, seoBefore: { title: d.seo?.title, description: d.seo?.description }, changes: computeChanges(d.seo) }))
    .filter((dc) => dc.changes.length > 0);

  const regionChanges: DocChange[] = regions
    .map((r) => ({ model: 'Region' as const, id: String(r._id), slug: r.slug, seoBefore: { title: r.seo?.title, description: r.seo?.description }, changes: computeChanges(r.seo) }))
    .filter((rc) => rc.changes.length > 0);

  printDryRunReport(destChanges, regionChanges);

  if (!apply) {
    console.log('\nDRY RUN — no writes performed. Re-run with --apply to write.');
    await mongoose.disconnect();
    return;
  }

  assert(
    destChanges.length === EXPECTED_DESTINATION_COUNT,
    `Expected exactly ${EXPECTED_DESTINATION_COUNT} Destination documents to change, found ${destChanges.length}. Aborting without writing — re-run the dry run and investigate before retrying --apply.`
  );
  assert(
    regionChanges.length === EXPECTED_REGION_COUNT,
    `Expected exactly ${EXPECTED_REGION_COUNT} Region documents to change, found ${regionChanges.length}. Aborting without writing — re-run the dry run and investigate before retrying --apply.`
  );

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, `brand-name-seo-backfill-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify([...destChanges, ...regionChanges], null, 2));
  console.log(`\nBackup written to ${backupPath}`);
  console.log(`Rollback with: npx tsx scripts/backfillBrandNameSeo.ts --rollback ${backupPath}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const dc of destChanges) {
        const setObj: Record<string, string> = {};
        for (const c of dc.changes) setObj[c.field] = c.after;
        const result = await Destination.updateOne({ _id: dc.id }, { $set: setObj }, { session });
        assert(result.matchedCount === 1 && result.modifiedCount === 1, `Destination update did not modify exactly one document: ${dc.slug}`);
      }
      for (const rc of regionChanges) {
        const setObj: Record<string, string> = {};
        for (const c of rc.changes) setObj[c.field] = c.after;
        const result = await Region.updateOne({ _id: rc.id }, { $set: setObj }, { session });
        assert(result.matchedCount === 1 && result.modifiedCount === 1, `Region update did not modify exactly one document: ${rc.slug}`);
      }
    });
    console.log(`\nTransaction committed: ${destChanges.length} Destination + ${regionChanges.length} Region documents updated.`);
  } finally {
    await session.endSession();
  }

  // Post-apply idempotency proof: re-scan and confirm zero remaining matches.
  const destinationsAfter = await Destination.find().lean<{ slug: string; seo?: { title?: string; description?: string } }[]>();
  const regionsAfter = await Region.find().lean<{ slug: string; seo?: { title?: string; description?: string } }[]>();
  const remainingDest = destinationsAfter.filter((d) => computeChanges(d.seo).length > 0);
  const remainingRegion = regionsAfter.filter((r) => computeChanges(r.seo).length > 0);
  assert(remainingDest.length === 0, `Post-apply verification failed: ${remainingDest.length} Destination documents still contain the old brand.`);
  assert(remainingRegion.length === 0, `Post-apply verification failed: ${remainingRegion.length} Region documents still contain the old brand.`);
  console.log('Post-apply verification: zero remaining old-brand matches in Destination or Region seo fields.');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Brand name SEO backfill failed:', (error as Error).message);
  process.exitCode = 1;
});

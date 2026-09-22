/**
 * One-time, idempotent backfill: adds 'kinnaur' to the 'spiti-valley-adventure'
 * Journey's `destinationSlugs` array, alongside the existing 'spiti-valley' value.
 *
 * Why: Day 1 (Kalpa) and Day 2 (Nako) of this journey's real, already-live itinerary
 * are both Kinnaur-district stops (see config/packages.config.ts) — this makes
 * /destinations/kinnaur correctly surface the journey via the same
 * getPackagesByDestinationSlug() mechanism /destinations/spiti-valley already uses
 * (lib/packages.ts). Chandigarh SEO Phase 2 — see the Phase 1 keyword-mapping audit.
 *
 * Deliberately narrow: touches only `destinationSlugs` on exactly one document —
 * never `name`, `itinerary`, `price`, `duration`, `inclusions`, or any other field.
 * No schema change (destinationSlugs is an existing string[] field on every Journey).
 *
 * Usage:
 *   npx tsx scripts/backfillSpitiKinnaurDestinationSlug.ts                — dry run (default), no writes
 *   npx tsx scripts/backfillSpitiKinnaurDestinationSlug.ts --apply         — writes, after a
 *                                                                           1-document safety assertion
 *   npx tsx scripts/backfillSpitiKinnaurDestinationSlug.ts --rollback <backup-file>
 *                                                                           — restores the exact prior
 *                                                                           destinationSlugs array
 *
 * Rollback: before any write, the complete pre-migration `destinationSlugs` array is
 * saved to scripts/backups/spiti-kinnaur-destinationslug-<ISO timestamp>.json.
 * `--rollback` reads that file back and restores it exactly, by `_id`.
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, 'backups');
const TARGET_SLUG = 'spiti-valley-adventure';
const SLUG_TO_ADD = 'kinnaur';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

interface BackupEntry {
  id: string;
  slug: string;
  destinationSlugsBefore: string[];
}

async function runRollback(backupFile: string) {
  await connectDB();
  const entries: BackupEntry[] = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`Rolling back ${entries.length} document(s) from ${backupFile}`);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const entry of entries) {
        const result = await Journey.updateOne({ _id: entry.id }, { $set: { destinationSlugs: entry.destinationSlugsBefore } }, { session });
        assert(result.matchedCount === 1, `Rollback: document not found — Journey ${entry.id} (${entry.slug})`);
        console.log(`Restored ${entry.slug} (${entry.id}) -> destinationSlugs: ${JSON.stringify(entry.destinationSlugsBefore)}`);
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

  assert(process.argv.slice(2).every((arg) => arg === '--apply'), 'Unknown argument. Only --apply (or --rollback <file>) is supported.');
  const apply = process.argv.includes('--apply');
  console.log(`Spiti->Kinnaur destinationSlugs backfill — ${apply ? 'APPLY' : 'DRY RUN'}`);

  await connectDB();

  const doc = await Journey.findOne({ slug: TARGET_SLUG }).lean<{ _id: mongoose.Types.ObjectId; slug: string; destinationSlugs?: string[] }>();
  assert(doc, `No Journey document found with slug '${TARGET_SLUG}'.`);

  const current = doc.destinationSlugs ?? [];
  const alreadyPresent = current.includes(SLUG_TO_ADD);
  const after = alreadyPresent ? current : [...current, SLUG_TO_ADD];

  console.log(`[Journey] id=${String(doc._id)} slug=${doc.slug} field=destinationSlugs`);
  console.log(`  before: ${JSON.stringify(current)}`);
  console.log(`  after:  ${JSON.stringify(after)}`);

  const changeCount = alreadyPresent ? 0 : 1;
  console.log(`\nDocuments to change: ${changeCount} (expected 1 on first run, 0 on any re-run)`);

  if (!apply) {
    console.log('\nDRY RUN — no writes performed. Re-run with --apply to write.');
    await mongoose.disconnect();
    return;
  }

  if (alreadyPresent) {
    console.log('\nNO WRITE REQUIRED — already applied (idempotent no-op).');
    await mongoose.disconnect();
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, `spiti-kinnaur-destinationslug-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const backupEntry: BackupEntry[] = [{ id: String(doc._id), slug: doc.slug, destinationSlugsBefore: current }];
  fs.writeFileSync(backupPath, JSON.stringify(backupEntry, null, 2));
  console.log(`\nBackup written to ${backupPath}`);
  console.log(`Rollback with: npx tsx scripts/backfillSpitiKinnaurDestinationSlug.ts --rollback ${backupPath}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await Journey.updateOne({ _id: doc._id, slug: TARGET_SLUG }, { $set: { destinationSlugs: after } }, { session });
      assert(result.matchedCount === 1 && result.modifiedCount === 1, `Update did not modify exactly one document: ${TARGET_SLUG}`);
    });
    console.log('\nTransaction committed: 1 Journey document updated.');
  } finally {
    await session.endSession();
  }

  const after_ = await Journey.findOne({ slug: TARGET_SLUG }).lean<{ destinationSlugs?: string[] }>();
  assert(after_?.destinationSlugs?.includes(SLUG_TO_ADD), 'Post-apply verification failed: kinnaur not present after write.');
  assert(after_?.destinationSlugs?.includes('spiti-valley'), 'Post-apply verification failed: spiti-valley unexpectedly removed.');
  console.log('Post-apply verification: destinationSlugs now contains both spiti-valley and kinnaur.');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Spiti->Kinnaur destinationSlugs backfill failed:', (error as Error).message);
  process.exitCode = 1;
});

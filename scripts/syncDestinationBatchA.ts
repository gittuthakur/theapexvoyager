import mongoose from 'mongoose';
import { destinations } from '../config/destinations.config';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';

// The ONLY documents this script is ever allowed to write. Everything else in the
// Destination collection — and every other collection — is out of scope, on purpose:
// this is a narrow Batch-A tool, not a replacement for scripts/seed.ts.
const NEW_SLUGS = ['chail', 'kasauli', 'mcleod-ganj', 'jammu', 'katra', 'patnitop', 'bhaderwah', 'ramnagar-corbett'];
const REVISED_SLUG = 'dharamshala';
const BATCH_A_ALLOWLIST = [...NEW_SLUGS, REVISED_SLUG];

// Fields Phase 3.3/3.4 explicitly identified as stale McLeod-Ganj-era content on the
// existing Dharamshala document that an ordinary upsert will not remove on its own
// (Mongoose's plain-object update only sets keys present in the payload; it never
// deletes keys just because they're absent from the new object). Deliberately does NOT
// include `photos` or other Google-Places enrichment metadata — that's unrelated and
// untouched.
const DHARAMSHALA_UNSET_FIELDS = ['apexPicks', 'hiddenGems'] as const;

function abort(message: string): never {
  console.error('\nABORT:', message);
  console.error('No write was performed.');
  process.exit(1);
}

function setEquals(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const APPLY = process.argv.includes('--apply');
  console.log(`Destination Batch A sync — mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (default, read-only)'}`);

  // ---------------------------------------------------------------------------------
  // TASK 5 — local authored-config safety gates. These never touch the network.
  // ---------------------------------------------------------------------------------
  if (destinations.length !== 46) {
    abort(`authored config has ${destinations.length} Destination entries, expected exactly 46.`);
  }
  const configSlugs = destinations.map((d) => d.slug);
  if (new Set(configSlugs).size !== configSlugs.length) {
    abort('authored config contains duplicate slugs.');
  }
  for (const slug of NEW_SLUGS) {
    const occurrences = configSlugs.filter((s) => s === slug).length;
    if (occurrences !== 1) abort(`config slug '${slug}' occurs ${occurrences} times, expected exactly 1.`);
  }
  if (configSlugs.filter((s) => s === REVISED_SLUG).length !== 1) {
    abort(`config slug '${REVISED_SLUG}' does not occur exactly once.`);
  }
  if (configSlugs.includes('valley-of-flowers')) {
    abort('authored config contains a valley-of-flowers Destination — it must remain Experience-only.');
  }
  console.log('Config safety gates: PASS (46 destinations, unique slugs, Batch-A allowlist present exactly once each, no valley-of-flowers Destination).');

  // The exact pre-Batch-A baseline is DERIVED from the current authored config, not
  // hard-coded separately — it's every current config slug except the 8 brand-new ones.
  const expectedPreBatchSlugs = new Set(configSlugs.filter((s) => !NEW_SLUGS.includes(s)));
  const expectedPostBatchSlugs = new Set(configSlugs);

  await connectDB();
  const dbName = mongoose.connection.db?.databaseName;
  console.log('Connected. Logical database name:', dbName);

  const dbDocs = await Destination.find({}, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
  const dbSlugs = dbDocs.map((d) => d.slug);
  const dbSlugSet = new Set(dbSlugs);
  console.log('Current DB Destination count:', dbSlugs.length);

  // ---------------------------------------------------------------------------------
  // TASK 10 — idempotency: if the DB is already at the exact known post-Batch-A state,
  // do nothing rather than treating 46 documents as an unrecognized/unsafe state.
  // ---------------------------------------------------------------------------------
  if (setEquals(dbSlugSet, expectedPostBatchSlugs)) {
    const dh = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
    const stillStale = DHARAMSHALA_UNSET_FIELDS.filter((f) => dh && f in dh);
    if (stillStale.length === 0) {
      console.log('\nNO WRITE REQUIRED — BATCH A ALREADY APPLIED.');
      await mongoose.disconnect();
      return;
    }
    abort(
      `DB slug set already matches the full post-Batch-A 46-slug state, but Dharamshala still has stale field(s): ${stillStale.join(', ')}. ` +
        'This script does not auto-resume a partially-completed run — needs manual review before rerunning with --apply.'
    );
  }

  // ---------------------------------------------------------------------------------
  // TASK 4 — pre-write DB safety gates. Any state other than "exactly pre-batch" or
  // "exactly post-batch" (handled above) is unrecognized and must abort.
  // ---------------------------------------------------------------------------------
  if (!setEquals(dbSlugSet, expectedPreBatchSlugs)) {
    const dbOnly = dbSlugs.filter((s) => !expectedPreBatchSlugs.has(s));
    const expectedOnly = [...expectedPreBatchSlugs].filter((s) => !dbSlugSet.has(s));
    console.log('DB_ONLY:', JSON.stringify(dbOnly));
    console.log('EXPECTED_ONLY:', JSON.stringify(expectedOnly));
    abort('current DB slug set does not exactly match the expected pre-Batch-A baseline (see DB_ONLY/EXPECTED_ONLY above).');
  }
  if (dbSlugs.length !== 38) abort(`DB Destination count is ${dbSlugs.length}, expected exactly 38.`);
  for (const slug of NEW_SLUGS) {
    if (dbSlugSet.has(slug)) abort(`Batch-A slug '${slug}' already exists in the database.`);
  }
  if (dbSlugSet.has('valley-of-flowers')) abort('a valley-of-flowers Destination document already exists in the database.');
  if (!dbSlugSet.has(REVISED_SLUG)) abort(`'${REVISED_SLUG}' is missing from the database.`);
  const dharamshalaCountInDb = await Destination.countDocuments({ slug: REVISED_SLUG });
  if (dharamshalaCountInDb !== 1) abort(`'${REVISED_SLUG}' exists ${dharamshalaCountInDb} times in the database, expected exactly 1.`);

  console.log('Pre-write DB safety gates: PASS — database is at the exact expected pre-Batch-A 38-document baseline.');

  // ---------------------------------------------------------------------------------
  // Write plan (printed in both dry-run and apply modes)
  // ---------------------------------------------------------------------------------
  console.log('\n--- WRITE PLAN ---');
  for (const slug of NEW_SLUGS) console.log('INSERT (upsert):', slug);
  console.log('UPDATE (approved fields):', REVISED_SLUG);
  console.log('UNSET on', REVISED_SLUG + ':', DHARAMSHALA_UNSET_FIELDS.join(', '));
  console.log('Expected post-state: 46 Destination documents.\n');

  if (!APPLY) {
    console.log('DRY RUN — no writes were performed. Re-run with --apply to execute this exact plan.');
    await mongoose.disconnect();
    return;
  }

  // ===================================================================================
  // APPLY PATH — everything below only runs with an explicit --apply flag.
  // ===================================================================================
  console.log('--apply supplied — beginning writes.');

  const dharamshalaBefore = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
  console.log('Captured pre-write Dharamshala snapshot in memory (', Object.keys(dharamshalaBefore ?? {}).length, 'fields) for rollback — not printed.');

  const regionIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const region of await Region.find({}, { name: 1 }).lean<{ name: string; _id: mongoose.Types.ObjectId }[]>()) {
    regionIdByName.set(region.name, region._id);
  }

  const insertedSlugs: string[] = [];
  let dharamshalaUpdated = false;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const slug of NEW_SLUGS) {
        const destination = destinations.find((d) => d.slug === slug)!;
        const { id, ...rest } = destination;
        const regionId = destination.state ? regionIdByName.get(destination.state) : undefined;
        await Destination.findOneAndUpdate({ slug }, { id, ...rest, regionId }, { upsert: true, session });
        insertedSlugs.push(slug);
      }

      const dharamshalaConfig = destinations.find((d) => d.slug === REVISED_SLUG)!;
      const { id, ...rest } = dharamshalaConfig;
      const regionId = dharamshalaConfig.state ? regionIdByName.get(dharamshalaConfig.state) : undefined;
      await Destination.findOneAndUpdate(
        { slug: REVISED_SLUG },
        {
          $set: { id, ...rest, regionId },
          $unset: Object.fromEntries(DHARAMSHALA_UNSET_FIELDS.map((f) => [f, '']))
        },
        { session }
      );
      dharamshalaUpdated = true;
    });
    console.log('Transaction committed (Atlas replica set — all-or-nothing).');
  } catch (err) {
    console.error('Transaction failed — MongoDB rolled it back automatically, no partial writes committed:', (err as Error).message);
    await session.endSession();
    await mongoose.disconnect();
    process.exit(1);
  }
  await session.endSession();

  // ---------------------------------------------------------------------------------
  // TASK 9 — post-write assertions. Failure here triggers the rollback path below,
  // even though the transaction itself already committed successfully.
  // ---------------------------------------------------------------------------------
  const failures: string[] = [];
  const afterDocs = await Destination.find({}, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
  const afterSlugs = afterDocs.map((d) => d.slug);
  const afterSlugSet = new Set(afterSlugs);

  if (afterSlugs.length !== 46) failures.push(`Destination count is ${afterSlugs.length}, expected 46`);
  if (!setEquals(afterSlugSet, expectedPostBatchSlugs)) failures.push('final DB slug set does not exactly match the expected 46-slug post-batch set');
  if (afterSlugSet.has('valley-of-flowers')) failures.push('valley-of-flowers exists as a Destination');
  for (const slug of NEW_SLUGS) if (!afterSlugSet.has(slug)) failures.push(`Batch-A slug '${slug}' missing after write`);

  const dharamshalaAfter = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
  for (const f of DHARAMSHALA_UNSET_FIELDS) {
    if (dharamshalaAfter && f in dharamshalaAfter) failures.push(`Dharamshala.${f} still present after $unset`);
  }
  if (!dharamshalaAfter || dharamshalaAfter.relatedSlugs === undefined) failures.push('Dharamshala approved fields did not apply as expected');
  if (dharamshalaBefore && 'photos' in dharamshalaBefore && (!dharamshalaAfter || !('photos' in dharamshalaAfter))) {
    failures.push('Dharamshala.photos (unrelated enrichment metadata) was unexpectedly removed');
  }

  if (failures.length > 0) {
    console.error('\nPOST-WRITE ASSERTIONS FAILED:');
    failures.forEach((f) => console.error(' -', f));
    console.error('\nAttempting rollback...');

    let rollbackOk = true;
    try {
      if (insertedSlugs.length > 0) {
        const del = await Destination.deleteMany({ slug: { $in: insertedSlugs } });
        console.log(`Rollback: deleted ${del.deletedCount} newly-inserted Batch-A document(s).`);
      }
      if (dharamshalaUpdated && dharamshalaBefore) {
        const { _id, ...restore } = dharamshalaBefore as Record<string, unknown> & { _id: unknown };
        await Destination.replaceOne({ slug: REVISED_SLUG }, restore);
        console.log('Rollback: restored Dharamshala to its pre-write snapshot.');
      }
    } catch (rollbackErr) {
      rollbackOk = false;
      console.error('ROLLBACK FAILED — manual intervention required:', (rollbackErr as Error).message);
    }

    console.error(rollbackOk ? 'Rollback completed successfully.' : 'Rollback did NOT complete — database is in an inconsistent state.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\nPost-write assertions: ALL PASS.');
  console.log('Destination count = 46, all 46 slugs present exactly once, Batch-A slugs present, valley-of-flowers absent, Dharamshala stale fields removed, Dharamshala.photos untouched.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Unexpected error (sanitized):', (err as Error).message);
  process.exit(1);
});

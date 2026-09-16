import mongoose from 'mongoose';
import { destinations } from '../config/destinations.config';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';

// The ONLY documents this script is ever allowed to write — 9 brand-new Destination
// slugs, nothing existing. Unlike Batch A, there is no revised existing document here,
// so there is no $unset path and no legacy-field cleanup at all in this tool.
const BATCH_B_SLUGS = ['kufri', 'narkanda', 'sarahan', 'kullu', 'naggar', 'palampur', 'pragpur', 'kangra', 'jawalamukhi'];

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
  console.log(`Destination Batch B sync — mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (default, read-only)'}`);

  // ---------------------------------------------------------------------------------
  // TASK 3 — allowlist self-check. Hard-coded, never derived from "DB minus config".
  // ---------------------------------------------------------------------------------
  if (BATCH_B_SLUGS.length !== 9) abort(`BATCH_B_SLUGS has ${BATCH_B_SLUGS.length} entries, expected exactly 9.`);
  if (new Set(BATCH_B_SLUGS).size !== 9) abort('BATCH_B_SLUGS contains a duplicate.');
  if (BATCH_B_SLUGS.includes('shoja')) abort('shoja must not be in the Batch-B allowlist.');
  if (BATCH_B_SLUGS.includes('valley-of-flowers')) abort('valley-of-flowers must not be in the Batch-B allowlist.');

  // ---------------------------------------------------------------------------------
  // TASK 6 — authored-config validation. Never touches the network.
  // ---------------------------------------------------------------------------------
  if (destinations.length !== 55) abort(`authored config has ${destinations.length} Destination entries, expected exactly 55.`);
  const configSlugs = destinations.map((d) => d.slug);
  if (new Set(configSlugs).size !== configSlugs.length) abort('authored config contains duplicate slugs.');
  for (const slug of BATCH_B_SLUGS) {
    const occurrences = configSlugs.filter((s) => s === slug).length;
    if (occurrences !== 1) abort(`config slug '${slug}' occurs ${occurrences} times, expected exactly 1.`);
  }
  if (configSlugs.includes('shoja')) abort('authored config contains a shoja Destination — must not exist.');
  if (configSlugs.includes('valley-of-flowers')) abort('authored config contains a valley-of-flowers Destination — must remain Experience-only.');

  const configSlugSet = new Set(configSlugs);
  for (const slug of BATCH_B_SLUGS) {
    const d = destinations.find((x) => x.slug === slug)!;
    if (d.state !== 'Himachal Pradesh') abort(`'${slug}'.state is '${d.state}', expected 'Himachal Pradesh'.`);
    if (d.toursCount !== 0) abort(`'${slug}'.toursCount is ${d.toursCount}, expected 0.`);
    if (!d.title || !d.category || !d.description || !d.image) abort(`'${slug}' is missing a required schema field (title/category/description/image).`);
    for (const rel of d.relatedSlugs ?? []) {
      if (!configSlugSet.has(rel)) abort(`'${slug}'.relatedSlugs references '${rel}', which does not exist in the authored config.`);
    }
  }
  console.log('Config safety gates: PASS (55 destinations, unique slugs, Batch-B allowlist present exactly once each, all required fields present, 0 broken relatedSlugs, no shoja/valley-of-flowers).');

  // The exact pre-Batch-B baseline is DERIVED from the current authored config — every
  // current config slug except the 9 Batch-B ones — not a separately hard-coded list.
  const expectedPreBatchSlugs = new Set(configSlugs.filter((s) => !BATCH_B_SLUGS.includes(s)));
  const expectedPostBatchSlugs = new Set(configSlugs);
  if (expectedPreBatchSlugs.size !== 46) abort(`derived pre-Batch-B baseline has ${expectedPreBatchSlugs.size} slugs, expected 46.`);

  await connectDB();
  const dbName = mongoose.connection.db?.databaseName;
  console.log('Connected. Logical database name:', dbName);

  const dbDocs = await Destination.find({}, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
  const dbSlugs = dbDocs.map((d) => d.slug);
  const dbSlugSet = new Set(dbSlugs);
  console.log('Current DB Destination count:', dbSlugs.length);

  if (dbSlugs.length !== new Set(dbSlugs).size) {
    const dupes = dbSlugs.filter((s, i) => dbSlugs.indexOf(s) !== i);
    abort(`database contains duplicate Destination slug(s): ${JSON.stringify([...new Set(dupes)])}`);
  }

  // ---------------------------------------------------------------------------------
  // TASK 12 — idempotency: exact known post-Batch-B state -> no-op, not a guess.
  // ---------------------------------------------------------------------------------
  if (setEquals(dbSlugSet, expectedPostBatchSlugs)) {
    const mismatches: string[] = [];
    for (const slug of BATCH_B_SLUGS) {
      const configDoc = destinations.find((d) => d.slug === slug)!;
      const dbDoc = await Destination.findOne({ slug }).lean<Record<string, unknown>>();
      if (!dbDoc) { mismatches.push(`${slug}: missing from DB`); continue; }
      for (const field of ['title', 'state', 'region', 'category', 'toursCount', 'description'] as const) {
        if (JSON.stringify(dbDoc[field]) !== JSON.stringify((configDoc as unknown as Record<string, unknown>)[field])) {
          mismatches.push(`${slug}.${field}: db=${JSON.stringify(dbDoc[field])} != config=${JSON.stringify((configDoc as unknown as Record<string, unknown>)[field])}`);
        }
      }
      if (JSON.stringify(dbDoc.relatedSlugs) !== JSON.stringify(configDoc.relatedSlugs)) {
        mismatches.push(`${slug}.relatedSlugs: db=${JSON.stringify(dbDoc.relatedSlugs)} != config=${JSON.stringify(configDoc.relatedSlugs)}`);
      }
    }
    if (mismatches.length === 0) {
      console.log('\nNO WRITE REQUIRED — BATCH B ALREADY APPLIED.');
      await mongoose.disconnect();
      return;
    }
    console.log('DB slug set matches the post-Batch-B 55-slug set, but field content differs:');
    mismatches.forEach((m) => console.log(' -', m));
    abort('slug set matches but content diverges — this script does not auto-repair a partially-diverged state.');
  }

  // ---------------------------------------------------------------------------------
  // TASK 4 / 13 — pre-write DB safety gates. Anything other than exactly pre-Batch-B
  // (handled here) or exactly post-Batch-B (handled above) is refused.
  // ---------------------------------------------------------------------------------
  if (!setEquals(dbSlugSet, expectedPreBatchSlugs)) {
    const dbOnly = dbSlugs.filter((s) => !expectedPreBatchSlugs.has(s));
    const expectedOnly = [...expectedPreBatchSlugs].filter((s) => !dbSlugSet.has(s));
    console.log('DB_ONLY:', JSON.stringify(dbOnly));
    console.log('EXPECTED_ONLY:', JSON.stringify(expectedOnly));
    abort('current DB slug set does not exactly match the expected pre-Batch-B baseline (see DB_ONLY/EXPECTED_ONLY above).');
  }
  if (dbSlugs.length !== 46) abort(`DB Destination count is ${dbSlugs.length}, expected exactly 46.`);
  for (const slug of BATCH_B_SLUGS) {
    if (dbSlugSet.has(slug)) abort(`Batch-B slug '${slug}' already exists in the database.`);
  }
  if (dbSlugSet.has('shoja')) abort('a shoja Destination document already exists in the database.');
  if (dbSlugSet.has('valley-of-flowers')) abort('a valley-of-flowers Destination document already exists in the database.');

  console.log('Pre-write DB safety gates: PASS — database is at the exact expected pre-Batch-B 46-document baseline.');
  console.log('Batch-B slugs currently absent: 9/9');

  // ---------------------------------------------------------------------------------
  // TASK 5 — region lookup, read-only.
  // ---------------------------------------------------------------------------------
  const regionDocs = await Region.find({}, { name: 1 }).lean<{ name: string; _id: mongoose.Types.ObjectId }[]>();
  const regionIdByName = new Map(regionDocs.map((r) => [r.name, r._id]));
  const himachalRegionId = regionIdByName.get('Himachal Pradesh');
  if (!himachalRegionId) {
    console.log('WARNING: no Region document named exactly "Himachal Pradesh" found — regionId will be left unset for all 9, matching how any other state-without-a-Region-match already behaves in this codebase.');
  } else {
    console.log('Region lookup: "Himachal Pradesh" resolved to', himachalRegionId.toString());
  }

  // ---------------------------------------------------------------------------------
  // Write plan (printed in both dry-run and apply modes)
  // ---------------------------------------------------------------------------------
  console.log('\n--- WRITE PLAN ---');
  for (const slug of BATCH_B_SLUGS) console.log('INSERT (upsert):', slug);
  console.log('Other collection writes: 0 (Region is read-only in this script)');
  console.log('Expected post-state: 55 Destination documents.\n');

  if (!APPLY) {
    console.log('DRY RUN — no writes were performed. Re-run with --apply to execute this exact plan.');
    await mongoose.disconnect();
    return;
  }

  // ===================================================================================
  // APPLY PATH — everything below only runs with an explicit --apply flag.
  // ===================================================================================
  console.log('--apply supplied — beginning writes.');

  const insertedSlugs: string[] = [];
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const slug of BATCH_B_SLUGS) {
        const destination = destinations.find((d) => d.slug === slug)!;
        const { id, ...rest } = destination;
        const regionId = destination.state ? regionIdByName.get(destination.state) : undefined;
        await Destination.findOneAndUpdate({ slug }, { id, ...rest, regionId }, { upsert: true, session });
        insertedSlugs.push(slug);
      }
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
  // TASK 11 — post-write assertions. Failure here triggers rollback, even though the
  // transaction itself already committed successfully.
  // ---------------------------------------------------------------------------------
  const failures: string[] = [];
  const afterDocs = await Destination.find({}, { slug: 1, _id: 0 }).lean<{ slug: string }[]>();
  const afterSlugs = afterDocs.map((d) => d.slug);
  const afterSlugSet = new Set(afterSlugs);

  if (afterSlugs.length !== 55) failures.push(`Destination count is ${afterSlugs.length}, expected 55`);
  if (!setEquals(afterSlugSet, expectedPostBatchSlugs)) failures.push('final DB slug set does not exactly match the expected 55-slug post-batch set');
  if (afterSlugSet.has('shoja')) failures.push('shoja exists as a Destination');
  if (afterSlugSet.has('valley-of-flowers')) failures.push('valley-of-flowers exists as a Destination');
  for (const slug of BATCH_B_SLUGS) if (!afterSlugSet.has(slug)) failures.push(`Batch-B slug '${slug}' missing after write`);

  for (const slug of BATCH_B_SLUGS) {
    const configDoc = destinations.find((d) => d.slug === slug)!;
    const dbDoc = await Destination.findOne({ slug }).lean<Record<string, unknown>>();
    if (!dbDoc) { failures.push(`${slug}: missing after write`); continue; }
    for (const field of ['title', 'state', 'region', 'category', 'toursCount', 'description'] as const) {
      if (JSON.stringify(dbDoc[field]) !== JSON.stringify((configDoc as unknown as Record<string, unknown>)[field])) {
        failures.push(`${slug}.${field} mismatch after write`);
      }
    }
    if (JSON.stringify(dbDoc.relatedSlugs) !== JSON.stringify(configDoc.relatedSlugs)) {
      failures.push(`${slug}.relatedSlugs mismatch after write`);
    }
  }

  if (failures.length > 0) {
    console.error('\nPOST-WRITE ASSERTIONS FAILED:');
    failures.forEach((f) => console.error(' -', f));
    console.error('\nAttempting rollback (delete only the Batch-B slugs this run inserted)...');
    let rollbackOk = true;
    try {
      const del = await Destination.deleteMany({ slug: { $in: insertedSlugs } });
      console.log(`Rollback: deleted ${del.deletedCount} newly-inserted Batch-B document(s).`);
    } catch (rollbackErr) {
      rollbackOk = false;
      console.error('ROLLBACK FAILED — manual intervention required:', (rollbackErr as Error).message);
    }
    console.error(rollbackOk ? 'Rollback completed successfully.' : 'Rollback did NOT complete — database is in an inconsistent state.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\nPost-write assertions: ALL PASS.');
  console.log('Destination count = 55, all 55 slugs present exactly once, Batch-B slugs present, shoja/valley-of-flowers absent.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Unexpected error (sanitized):', (err as Error).message);
  process.exit(1);
});

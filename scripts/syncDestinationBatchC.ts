import mongoose from 'mongoose';
import { destinations } from '../config/destinations.config';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';

// The ONLY documents this script is ever allowed to write — 9 brand-new Destination
// slugs, plus one existing document (spiti-valley) whose `places` entry for Dhankar was
// trimmed to a cross-reference in Phase C3 now that Dhankar is its own Destination.
// Unlike Dharamshala's Batch-A revision, this is a same-shape field update (the `places`
// array is present in both old and new payloads, just with different text in one entry)
// — no $unset path is needed here.
const BATCH_C_SLUGS = ['bharmour', 'tabo', 'dhankar', 'kibber', 'keylong', 'mandi', 'rewalsar', 'renuka-ji', 'paonta-sahib'];
const REVISED_SLUG = 'spiti-valley';

// The only field this script is authorized to change on the existing spiti-valley
// document. Any other divergence between DB and config aborts the run for human review
// rather than being silently overwritten.
const SPITI_OLD_DHANKAR_DESCRIPTION = 'A cliffside monastery and village above the confluence.';
const SPITI_NEW_DHANKAR_DESCRIPTION = 'A cliffside monastery village on the circuit — now its own destination page.';

function abort(message: string): never {
  console.error('\nABORT:', message);
  console.error('No write was performed.');
  process.exit(1);
}

function setEquals(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

/** Deep-compares two plain values for the drift check — order-insensitive for arrays of
 *  primitives/objects is NOT assumed; places/highlights/etc. are ordered content, so a
 *  plain JSON.stringify comparison per-field (as Batch A/B already do) is intentional. */
function fieldsEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Mongoose auto-assigns an `_id` to every array subdocument (highlights/hiddenGems/
 *  places/etc.) unless the schema opts out — the authored config objects never have
 *  one. Strip it recursively before comparing DB content to config content, or every
 *  array-of-objects field falsely looks like drift on every single document. */
function stripMongoIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripMongoIds);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '_id') continue;
      out[k] = stripMongoIds(v);
    }
    return out;
  }
  return value;
}

function contentEqual(a: unknown, b: unknown): boolean {
  return fieldsEqual(stripMongoIds(a), stripMongoIds(b));
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const APPLY = process.argv.includes('--apply');
  console.log(`Destination Batch C sync — mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (default, read-only)'}`);

  // ---------------------------------------------------------------------------------
  // TASK 2/5 — allowlist + authored-config safety gates. Never touch the network.
  // ---------------------------------------------------------------------------------
  if (BATCH_C_SLUGS.length !== 9) abort(`BATCH_C_SLUGS has ${BATCH_C_SLUGS.length} entries, expected exactly 9.`);
  if (new Set(BATCH_C_SLUGS).size !== 9) abort('BATCH_C_SLUGS contains a duplicate.');
  if (BATCH_C_SLUGS.includes('shoja')) abort('shoja must not be in the Batch-C allowlist.');
  if (BATCH_C_SLUGS.includes('valley-of-flowers')) abort('valley-of-flowers must not be in the Batch-C allowlist.');

  if (destinations.length !== 64) abort(`authored config has ${destinations.length} Destination entries, expected exactly 64.`);
  const configSlugs = destinations.map((d) => d.slug);
  if (new Set(configSlugs).size !== configSlugs.length) abort('authored config contains duplicate slugs.');
  for (const slug of BATCH_C_SLUGS) {
    const occurrences = configSlugs.filter((s) => s === slug).length;
    if (occurrences !== 1) abort(`config slug '${slug}' occurs ${occurrences} times, expected exactly 1.`);
  }
  if (configSlugs.filter((s) => s === REVISED_SLUG).length !== 1) {
    abort(`config slug '${REVISED_SLUG}' does not occur exactly once.`);
  }
  if (configSlugs.includes('shoja')) abort('authored config contains a shoja Destination — must not exist.');
  if (configSlugs.includes('valley-of-flowers')) abort('authored config contains a valley-of-flowers Destination — must remain Experience-only.');

  const configSlugSet = new Set(configSlugs);
  for (const slug of BATCH_C_SLUGS) {
    const d = destinations.find((x) => x.slug === slug)!;
    if (d.state !== 'Himachal Pradesh') abort(`'${slug}'.state is '${d.state}', expected 'Himachal Pradesh'.`);
    if (d.toursCount !== 0) abort(`'${slug}'.toursCount is ${d.toursCount}, expected 0.`);
    if (!d.title || !d.category || !d.description || !d.image) abort(`'${slug}' is missing a required schema field (title/category/description/image).`);
    for (const rel of d.relatedSlugs ?? []) {
      if (!configSlugSet.has(rel)) abort(`'${slug}'.relatedSlugs references '${rel}', which does not exist in the authored config.`);
    }
  }
  console.log('Config safety gates: PASS (64 destinations, unique slugs, Batch-C allowlist present exactly once each, all required fields present, 0 broken relatedSlugs, no shoja/valley-of-flowers).');

  // Exact frozen relatedSlugs check (Task 5) — printed for audit visibility.
  const expectedRelated: Record<string, string[]> = {
    bharmour: ['chamba', 'dalhousie'],
    tabo: ['spiti-valley', 'dhankar'],
    dhankar: ['spiti-valley', 'tabo'],
    kibber: ['spiti-valley', 'tabo'],
    keylong: ['manali', 'spiti-valley'],
    mandi: ['rewalsar', 'kullu'],
    rewalsar: ['mandi', 'kullu'],
    'renuka-ji': ['paonta-sahib', 'kasauli'],
    'paonta-sahib': ['renuka-ji', 'kasauli']
  };
  for (const slug of BATCH_C_SLUGS) {
    const d = destinations.find((x) => x.slug === slug)!;
    if (!fieldsEqual(d.relatedSlugs, expectedRelated[slug])) {
      abort(`'${slug}'.relatedSlugs is ${JSON.stringify(d.relatedSlugs)}, expected exactly ${JSON.stringify(expectedRelated[slug])}.`);
    }
  }
  console.log('Frozen relatedSlugs check: PASS — all 9 match the Phase C1 frozen values exactly.');

  // The exact pre-Batch-C baseline is DERIVED from the current authored config — every
  // current config slug except the 9 Batch-C ones — not a separately hard-coded list.
  const expectedPreBatchSlugs = new Set(configSlugs.filter((s) => !BATCH_C_SLUGS.includes(s)));
  const expectedPostBatchSlugs = new Set(configSlugs);
  if (expectedPreBatchSlugs.size !== 55) abort(`derived pre-Batch-C baseline has ${expectedPreBatchSlugs.size} slugs, expected 55.`);

  const spitiConfig = destinations.find((d) => d.slug === REVISED_SLUG)!;
  const spitiDhankarPlace = (spitiConfig.places ?? []).find((p) => p.title === 'Dhankar');
  if (!spitiDhankarPlace) abort(`config '${REVISED_SLUG}' has no 'Dhankar' entry in places — cannot verify the approved Phase C3 cleanup.`);
  if (spitiDhankarPlace.description !== SPITI_NEW_DHANKAR_DESCRIPTION) {
    abort(`config '${REVISED_SLUG}' places.Dhankar.description does not match the frozen Phase C3 text. Found: ${JSON.stringify(spitiDhankarPlace.description)}`);
  }

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
  // TASK 13 — read-only baseline of other collections, purely to prove later that this
  // migration touched Destination (and nothing else). No writes, no scans beyond count.
  // ---------------------------------------------------------------------------------
  const { Journey } = await import('../models/Journey');
  const { Tour } = await import('../models/Tour');
  const { Hotel } = await import('../models/Hotel');
  const { Expert } = await import('../models/Expert');
  const { Experience } = await import('../models/Experience');
  const { TransportPartner } = await import('../models/TransportPartner');
  const { TransportRoute } = await import('../models/TransportRoute');
  const { TransportVehicle } = await import('../models/TransportVehicle');
  const otherCollectionBaseline = {
    Region: await Region.countDocuments(),
    Journey: await Journey.countDocuments(),
    Tour: await Tour.countDocuments(),
    Hotel: await Hotel.countDocuments(),
    Expert: await Expert.countDocuments(),
    Experience: await Experience.countDocuments(),
    TransportPartner: await TransportPartner.countDocuments(),
    TransportRoute: await TransportRoute.countDocuments(),
    TransportVehicle: await TransportVehicle.countDocuments()
  };
  console.log('Other-collection read-only baseline (for later before/after comparison only):', JSON.stringify(otherCollectionBaseline));

  // ---------------------------------------------------------------------------------
  // TASK 12 — idempotency: exact known post-Batch-C state -> no-op, not a guess.
  // ---------------------------------------------------------------------------------
  if (setEquals(dbSlugSet, expectedPostBatchSlugs)) {
    const mismatches: string[] = [];
    for (const slug of BATCH_C_SLUGS) {
      const configDoc = destinations.find((d) => d.slug === slug)!;
      const dbDoc = await Destination.findOne({ slug }).lean<Record<string, unknown>>();
      if (!dbDoc) { mismatches.push(`${slug}: missing from DB`); continue; }
      for (const field of ['title', 'state', 'region', 'category', 'toursCount', 'description'] as const) {
        if (!fieldsEqual(dbDoc[field], (configDoc as unknown as Record<string, unknown>)[field])) {
          mismatches.push(`${slug}.${field}: db=${JSON.stringify(dbDoc[field])} != config=${JSON.stringify((configDoc as unknown as Record<string, unknown>)[field])}`);
        }
      }
      if (!fieldsEqual(dbDoc.relatedSlugs, configDoc.relatedSlugs)) {
        mismatches.push(`${slug}.relatedSlugs: db=${JSON.stringify(dbDoc.relatedSlugs)} != config=${JSON.stringify(configDoc.relatedSlugs)}`);
      }
    }
    const spitiDb = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
    const spitiDbDhankar = ((spitiDb?.places as Array<{ title: string; description: string }> | undefined) ?? []).find((p) => p.title === 'Dhankar');
    if (!spitiDbDhankar || spitiDbDhankar.description !== SPITI_NEW_DHANKAR_DESCRIPTION) {
      mismatches.push(`${REVISED_SLUG}.places.Dhankar.description not yet synchronized to the approved Phase C3 text`);
    }
    if (mismatches.length === 0) {
      console.log('\nNO WRITE REQUIRED — BATCH C ALREADY APPLIED.');
      await mongoose.disconnect();
      return;
    }
    console.log('DB slug set matches the post-Batch-C 64-slug set, but field content differs:');
    mismatches.forEach((m) => console.log(' -', m));
    abort('slug set matches but content diverges — this script does not auto-repair a partially-diverged state.');
  }

  // ---------------------------------------------------------------------------------
  // TASK 4 — pre-write DB safety gates. Anything other than exactly pre-Batch-C
  // (handled here) or exactly post-Batch-C (handled above) is refused.
  // ---------------------------------------------------------------------------------
  if (!setEquals(dbSlugSet, expectedPreBatchSlugs)) {
    const dbOnly = dbSlugs.filter((s) => !expectedPreBatchSlugs.has(s));
    const expectedOnly = [...expectedPreBatchSlugs].filter((s) => !dbSlugSet.has(s));
    console.log('DB_ONLY:', JSON.stringify(dbOnly));
    console.log('CONFIG_BASELINE_ONLY:', JSON.stringify(expectedOnly));
    abort('current DB slug set does not exactly match the expected pre-Batch-C baseline (see DB_ONLY/CONFIG_BASELINE_ONLY above).');
  }
  if (dbSlugs.length !== 55) abort(`DB Destination count is ${dbSlugs.length}, expected exactly 55.`);
  for (const slug of BATCH_C_SLUGS) {
    if (dbSlugSet.has(slug)) abort(`Batch-C slug '${slug}' already exists in the database.`);
  }
  if (dbSlugSet.has('shoja')) abort('a shoja Destination document already exists in the database.');
  if (dbSlugSet.has('valley-of-flowers')) abort('a valley-of-flowers Destination document already exists in the database.');
  if (!dbSlugSet.has(REVISED_SLUG)) abort(`'${REVISED_SLUG}' is missing from the database.`);
  const spitiCountInDb = await Destination.countDocuments({ slug: REVISED_SLUG });
  if (spitiCountInDb !== 1) abort(`'${REVISED_SLUG}' exists ${spitiCountInDb} times in the database, expected exactly 1.`);

  console.log('Pre-write DB safety gates: PASS — database is at the exact expected pre-Batch-C 55-document baseline.');
  console.log('Batch-C slugs currently absent: 9/9');

  // ---------------------------------------------------------------------------------
  // TASK 7/8 — spiti-valley drift check. Prove the ONLY delta between DB and config is
  // the Dhankar places.description text. Any other divergence aborts for human review
  // rather than being silently overwritten by the upsert.
  // ---------------------------------------------------------------------------------
  const spitiDbDoc = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
  if (!spitiDbDoc) abort(`'${REVISED_SLUG}' unexpectedly not found when reading for drift check.`);
  const SPITI_COMPARE_FIELDS = [
    'title', 'category', 'description', 'toursCount', 'image', 'region', 'state',
    'editorialDescription', 'bestTime', 'idealDuration', 'altitude', 'travelStyles',
    'seasons', 'bestFor', 'highlights', 'experiences', 'relatedSlugs', 'seo',
    'isPopular', 'priority', 'personality', 'badge', 'popularityScore', 'apexScore',
    'apexPicks', 'hiddenGems', 'travelTips', 'matchScores', 'seasonalNotes'
  ] as const;
  const spitiDrift: string[] = [];
  for (const field of SPITI_COMPARE_FIELDS) {
    const dbVal = spitiDbDoc[field];
    const configVal = (spitiConfig as unknown as Record<string, unknown>)[field];
    if (!contentEqual(dbVal, configVal)) {
      spitiDrift.push(`${REVISED_SLUG}.${field}: db=${JSON.stringify(dbVal)} != config=${JSON.stringify(configVal)}`);
    }
  }
  // The `places` array is expected to differ ONLY in the Dhankar entry's description.
  const dbPlaces = (spitiDbDoc.places as Array<{ title: string; description: string }> | undefined) ?? [];
  const configPlaces = spitiConfig.places ?? [];
  if (dbPlaces.length !== configPlaces.length) {
    spitiDrift.push(`${REVISED_SLUG}.places: length differs (db=${dbPlaces.length}, config=${configPlaces.length})`);
  } else {
    for (let i = 0; i < configPlaces.length; i++) {
      const dbP = dbPlaces[i];
      const cfgP = configPlaces[i];
      if (dbP?.title !== cfgP.title) {
        spitiDrift.push(`${REVISED_SLUG}.places[${i}].title: db=${JSON.stringify(dbP?.title)} != config=${JSON.stringify(cfgP.title)}`);
        continue;
      }
      if (dbP?.description !== cfgP.description) {
        const isTheApprovedDhankarChange =
          cfgP.title === 'Dhankar' &&
          dbP?.description === SPITI_OLD_DHANKAR_DESCRIPTION &&
          cfgP.description === SPITI_NEW_DHANKAR_DESCRIPTION;
        if (!isTheApprovedDhankarChange) {
          spitiDrift.push(`${REVISED_SLUG}.places[${i}] ('${cfgP.title}').description differs beyond the approved Dhankar change: db=${JSON.stringify(dbP?.description)} != config=${JSON.stringify(cfgP.description)}`);
        }
      }
    }
  }

  if (spitiDrift.length > 0) {
    console.log(`\n${REVISED_SLUG} DRIFT DETECTED (beyond the approved Dhankar cross-reference change):`);
    spitiDrift.forEach((d) => console.log(' -', d));
    abort(`'${REVISED_SLUG}' has unexpected content drift between DB and config — refusing to auto-overwrite. Needs human review before this script may proceed.`);
  }
  const dbHasOldDhankarText = dbPlaces.some((p) => p.title === 'Dhankar' && p.description === SPITI_OLD_DHANKAR_DESCRIPTION);
  console.log(`'${REVISED_SLUG}' drift check: PASS — the only delta from config is the approved Dhankar cross-reference text (currently ${dbHasOldDhankarText ? 'still old in DB, update required' : 'already matches config'}).`);

  // ---------------------------------------------------------------------------------
  // TASK 6 — region lookup, read-only.
  // ---------------------------------------------------------------------------------
  const regionDocs = await Region.find({}, { name: 1 }).lean<{ name: string; _id: mongoose.Types.ObjectId }[]>();
  const regionIdByName = new Map(regionDocs.map((r) => [r.name, r._id]));
  const himachalRegionResolved = regionIdByName.has('Himachal Pradesh');
  console.log(`Region lookup: "Himachal Pradesh" ${himachalRegionResolved ? 'resolved to an existing Region document' : 'NOT found — regionId will be left unset for all 9, matching how any other state-without-a-Region-match already behaves in this codebase'}.`);

  // ---------------------------------------------------------------------------------
  // Write plan (printed in both dry-run and apply modes)
  // ---------------------------------------------------------------------------------
  console.log('\n--- WRITE PLAN ---');
  console.log('NEW INSERTS/UPSERTS: 9');
  for (const slug of BATCH_C_SLUGS) console.log('  INSERT (upsert):', slug);
  if (dbHasOldDhankarText) {
    console.log('EXISTING AUTHORIZED UPDATE: spiti-valley (places.Dhankar.description only)');
  } else {
    console.log('EXISTING AUTHORIZED UPDATE: spiti-valley — not needed, DB already matches config.');
  }
  console.log('Other collection writes: 0 (Region and all baseline collections above are read-only in this script)');
  console.log('Expected post-state: 64 Destination documents.\n');

  if (!APPLY) {
    console.log('DRY RUN — no writes were performed. Re-run with --apply to execute this exact plan.');
    await mongoose.disconnect();
    return;
  }

  // ===================================================================================
  // APPLY PATH — everything below only runs with an explicit --apply flag.
  // ===================================================================================
  console.log('--apply supplied — beginning writes.');

  const spitiBefore = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
  console.log('Captured pre-write spiti-valley snapshot in memory (', Object.keys(spitiBefore ?? {}).length, 'fields) for rollback — not printed.');

  const insertedSlugs: string[] = [];
  let spitiUpdated = false;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const slug of BATCH_C_SLUGS) {
        const destination = destinations.find((d) => d.slug === slug)!;
        const { id, ...rest } = destination;
        const regionId = destination.state ? regionIdByName.get(destination.state) : undefined;
        await Destination.findOneAndUpdate({ slug }, { id, ...rest, regionId }, { upsert: true, session });
        insertedSlugs.push(slug);
      }

      if (dbHasOldDhankarText) {
        const { id, ...rest } = spitiConfig;
        const regionId = spitiConfig.state ? regionIdByName.get(spitiConfig.state) : undefined;
        await Destination.findOneAndUpdate(
          { slug: REVISED_SLUG },
          { $set: { id, ...rest, regionId } },
          { session }
        );
        spitiUpdated = true;
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

  if (afterSlugs.length !== 64) failures.push(`Destination count is ${afterSlugs.length}, expected 64`);
  if (!setEquals(afterSlugSet, expectedPostBatchSlugs)) failures.push('final DB slug set does not exactly match the expected 64-slug post-batch set');
  if (afterSlugSet.has('shoja')) failures.push('shoja exists as a Destination');
  if (afterSlugSet.has('valley-of-flowers')) failures.push('valley-of-flowers exists as a Destination');
  for (const slug of BATCH_C_SLUGS) if (!afterSlugSet.has(slug)) failures.push(`Batch-C slug '${slug}' missing after write`);

  for (const slug of BATCH_C_SLUGS) {
    const configDoc = destinations.find((d) => d.slug === slug)!;
    const dbDoc = await Destination.findOne({ slug }).lean<Record<string, unknown>>();
    if (!dbDoc) { failures.push(`${slug}: missing after write`); continue; }
    for (const field of ['title', 'state', 'region', 'category', 'toursCount', 'description'] as const) {
      if (!fieldsEqual(dbDoc[field], (configDoc as unknown as Record<string, unknown>)[field])) {
        failures.push(`${slug}.${field} mismatch after write`);
      }
    }
    if (!fieldsEqual(dbDoc.relatedSlugs, configDoc.relatedSlugs)) {
      failures.push(`${slug}.relatedSlugs mismatch after write`);
    }
  }

  if (spitiUpdated) {
    const spitiAfter = await Destination.findOne({ slug: REVISED_SLUG }).lean<Record<string, unknown>>();
    const spitiAfterDhankar = ((spitiAfter?.places as Array<{ title: string; description: string }> | undefined) ?? []).find((p) => p.title === 'Dhankar');
    if (!spitiAfterDhankar || spitiAfterDhankar.description !== SPITI_NEW_DHANKAR_DESCRIPTION) {
      failures.push('spiti-valley places.Dhankar.description did not update to the approved text');
    }
    for (const field of SPITI_COMPARE_FIELDS) {
      if (field === 'highlights' || field === 'experiences' || field === 'relatedSlugs') continue; // unchanged, already covered by drift check pre-write
      if (!contentEqual(spitiAfter?.[field], (spitiConfig as unknown as Record<string, unknown>)[field])) {
        failures.push(`spiti-valley.${field} mismatch after write`);
      }
    }
  }

  if (failures.length > 0) {
    console.error('\nPOST-WRITE ASSERTIONS FAILED:');
    failures.forEach((f) => console.error(' -', f));
    console.error('\nAttempting rollback (delete only the Batch-C slugs this run inserted; restore spiti-valley if it was updated)...');
    let rollbackOk = true;
    try {
      if (insertedSlugs.length > 0) {
        const del = await Destination.deleteMany({ slug: { $in: insertedSlugs } });
        console.log(`Rollback: deleted ${del.deletedCount} newly-inserted Batch-C document(s).`);
      }
      if (spitiUpdated && spitiBefore) {
        const { _id, ...restore } = spitiBefore as Record<string, unknown> & { _id: unknown };
        await Destination.replaceOne({ slug: REVISED_SLUG }, restore);
        console.log('Rollback: restored spiti-valley to its pre-write snapshot.');
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
  console.log('Destination count = 64, all 64 slugs present exactly once, Batch-C slugs present, shoja/valley-of-flowers absent, spiti-valley Dhankar cross-reference synchronized.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Unexpected error (sanitized):', (err as Error).message);
  process.exit(1);
});

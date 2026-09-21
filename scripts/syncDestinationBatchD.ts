import mongoose from 'mongoose';
import { destinations } from '../config/destinations.config';
import { connectDB } from '../lib/mongodb';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';

const BATCH_D_SLUGS = ['chintpurni', 'naina-devi', 'naldehra', 'mashobra', 'manikaran', 'pangi-valley'] as const;
const REJECTED_SLUGS = ['nalagarh', 'kalga-tosh-pulga', 'langza-komic-hikkim', 'shoja', 'valley-of-flowers'];
const OLD_MASHOBRA = 'A peaceful cedar retreat beyond the bustle.';
const NEW_MASHOBRA = 'A peaceful cedar retreat beyond the bustle — now its own destination page.';
const OLD_GEM = { title: 'Mashobra forest trails', description: 'Cedar walks minutes from town, far quieter than the Ridge.' };
const OTHER_COLLECTIONS = ['regions', 'journeys', 'tours', 'hotels', 'experts', 'experiences', 'transportpartners', 'transportroutes', 'transportvehicles', 'bookingrequests', 'bookings', 'destinationsearchcaches', 'enquiries', 'inquiries', 'newslettersubscribers', 'placecachelocks', 'placecaches', 'reviews'];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== '_id').map(([key, entry]) => [key, clean(entry)]));
  }
  return value;
}
function equal(a: unknown, b: unknown): boolean { return JSON.stringify(clean(a)) === JSON.stringify(clean(b)); }
function slugDifference(left: Set<string>, right: Set<string>): string[] { return [...left].filter((slug) => !right.has(slug)).sort(); }
async function otherCounts(): Promise<Record<string, number>> {
  const db = mongoose.connection.db;
  assert(db, 'MongoDB connection missing.');
  return Object.fromEntries(await Promise.all(OTHER_COLLECTIONS.map(async (name) => [name, await db.collection(name).countDocuments()] as const)));
}

async function main() {
  try { process.loadEnvFile('.env.local'); } catch { /* MONGODB_URI may be supplied externally. */ }
  assert(process.argv.slice(2).every((arg) => arg === '--apply'), 'Unknown argument. Only --apply is supported.');
  const apply = process.argv.includes('--apply');
  console.log(`Destination Batch D — ${apply ? 'APPLY' : 'DRY RUN'}`);

  const configSlugs = destinations.map((doc) => doc.slug);
  const configSet = new Set(configSlugs);
  assert(destinations.length === 70 && configSet.size === 70, 'Authored config must have exactly 70 unique destinations.');
  assert(BATCH_D_SLUGS.length === 6 && new Set(BATCH_D_SLUGS).size === 6, 'Invalid Batch D allowlist.');
  for (const slug of [...BATCH_D_SLUGS, 'shimla']) assert(configSlugs.filter((item) => item === slug).length === 1, `Config must contain exactly one ${slug}.`);
  for (const slug of REJECTED_SLUGS) assert(!configSet.has(slug), `Rejected slug in config: ${slug}`);
  const batchSet = new Set<string>(BATCH_D_SLUGS);
  const expectedBefore = new Set(configSlugs.filter((slug) => !batchSet.has(slug)));
  assert(expectedBefore.size === 64, 'Expected pre-batch set must contain 64 slugs.');

  const region = await (async () => { await connectDB(); return Region.findOne({ name: 'Himachal Pradesh' }).lean(); })();
  assert(region?._id, 'Existing Himachal Pradesh Region is required.');
  const regionId = region._id;
  const sourceBySlug = new Map(destinations.map((doc) => [doc.slug, doc]));
  for (const slug of BATCH_D_SLUGS) {
    const doc = sourceBySlug.get(slug)!;
    assert(doc.state === 'Himachal Pradesh' && doc.toursCount === 0, `${slug}: invalid state or toursCount.`);
    assert(doc.title && doc.category && doc.description && doc.image, `${slug}: missing required schema field.`);
    assert(Array.isArray(doc.relatedSlugs) && doc.relatedSlugs.every((rel) => configSet.has(rel)), `${slug}: invalid relatedSlugs.`);
    const candidate = new Destination({ ...doc, regionId });
    await candidate.validate();
    console.log(`${slug}: source valid; relatedSlugs=${JSON.stringify(doc.relatedSlugs)}; regionId=${regionId}`);
  }

  const shimlaSource = sourceBySlug.get('shimla')!;
  assert(shimlaSource.places?.filter((place) => place.title === 'Mashobra').length === 1, 'Authored Shimla Mashobra place must occur once.');
  assert(shimlaSource.places!.find((place) => place.title === 'Mashobra')!.description === NEW_MASHOBRA, 'Authored Shimla Mashobra description changed.');
  assert(!(shimlaSource.hiddenGems ?? []).some((gem) => gem.title === OLD_GEM.title), 'Authored Shimla still contains Mashobra forest trails.');

  const current = await Destination.find({}, { slug: 1 }).lean();
  const currentSlugs = current.map((doc) => doc.slug);
  const currentSet = new Set(currentSlugs);
  console.log('Current DB Destination count:', current.length);
  console.log('Current DB unique slugs:', currentSet.size);
  assert(current.length === currentSet.size, 'Duplicate DB destination slugs.');
  console.log('CONFIG_ONLY:', JSON.stringify(slugDifference(configSet, currentSet)));
  console.log('DB_ONLY:', JSON.stringify(slugDifference(currentSet, configSet)));
  for (const slug of REJECTED_SLUGS) assert(!currentSet.has(slug), `Rejected slug in DB: ${slug}`);

  const alreadyApplied = current.length === 70 && slugDifference(configSet, currentSet).length === 0;
  if (!alreadyApplied) {
    assert(current.length === 64 && currentSet.size === 64, 'Pre-apply DB count/unique count must be 64.');
    assert(equal(slugDifference(configSet, currentSet), [...BATCH_D_SLUGS].sort()) && slugDifference(currentSet, configSet).length === 0, 'DB slug set differs from exact approved pre-batch set.');
  }

  const shimlaDb = await Destination.findOne({ slug: 'shimla' }).lean<Record<string, unknown>>();
  assert(shimlaDb, 'Shimla DB document missing.');
  const oldPlaces = (shimlaDb.places as Array<{ title: string; description: string }>) ?? [];
  const oldGems = (shimlaDb.hiddenGems as Array<{ title: string; description: string }>) ?? [];
  const mashobraPlaces = oldPlaces.filter((place) => place.title === 'Mashobra');
  const gems = oldGems.filter((gem) => gem.title === OLD_GEM.title);
  assert(mashobraPlaces.length === 1, 'DB Shimla Mashobra place must occur once.');
  assert(gems.length <= 1, 'DB Shimla Mashobra gem is duplicated.');
  assert(gems.length === 0 || equal(gems[0], OLD_GEM), 'DB Shimla Mashobra gem has unexpected content.');
  const needsShimla = mashobraPlaces[0].description === OLD_MASHOBRA && gems.length === 1;
  const shimlaDone = mashobraPlaces[0].description === NEW_MASHOBRA && gems.length === 0;
  assert(needsShimla || shimlaDone, 'Shimla cleanup is partial or unexpected.');
  assert(alreadyApplied ? shimlaDone : needsShimla, 'Shimla state does not match the expected migration phase.');

  // Compare every authored field, including fields not present in the older Batch C checklist.
  // Reconstruct precisely the approved pre-D3 shape for the two changed arrays.
  const expectedShimla = { ...shimlaSource } as Record<string, unknown>;
  if (needsShimla) {
    expectedShimla.places = shimlaSource.places!.map((place) => place.title === 'Mashobra' ? { ...place, description: OLD_MASHOBRA } : place);
    assert(equal(oldGems.filter((gem) => gem.title !== OLD_GEM.title), shimlaSource.hiddenGems ?? []), 'Unexpected non-Mashobra Shimla hidden gem drift.');
    expectedShimla.hiddenGems = oldGems;
  }
  const ignored = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'regionId', 'placeId', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'lastSyncedAt', 'source']);
  for (const field of new Set([...Object.keys(expectedShimla), ...Object.keys(shimlaDb)])) {
    if (ignored.has(field)) continue;
    const expected = expectedShimla[field];
    const actual = shimlaDb[field];
    if (expected === undefined && (actual === undefined || equal(actual, []))) continue;
    assert(equal(actual, expected), `Unexpected Shimla drift in ${field}: db=${JSON.stringify(clean(actual))}, expected=${JSON.stringify(clean(expected))}.`);
  }
  console.log(`Shimla authored-field drift check: PASS; approved Mashobra cleanup ${needsShimla ? 'pending' : 'already applied'}.`);

  if (alreadyApplied) {
    for (const slug of BATCH_D_SLUGS) {
      const dbDoc = await Destination.findOne({ slug }).lean<Record<string, unknown>>();
      const source = sourceBySlug.get(slug)!;
      assert(dbDoc && dbDoc.state === 'Himachal Pradesh' && dbDoc.toursCount === 0 && String(dbDoc.regionId) === String(regionId) && equal(dbDoc.relatedSlugs, source.relatedSlugs), `${slug}: post-batch verification failed.`);
    }
    console.log('NO WRITE REQUIRED — BATCH D ALREADY APPLIED');
    await mongoose.disconnect();
    return;
  }

  console.log('Planned inserts exactly 6:', BATCH_D_SLUGS.join(', '));
  console.log('Planned existing update exactly 1: shimla (Mashobra place description and redundant hidden gem only)');
  console.log('Expected final Destination count: 70');
  if (!apply) { console.log('DRY RUN — no writes performed.'); await mongoose.disconnect(); return; }

  const beforeOther = await otherCounts();
  console.log('Non-Destination before counts:', JSON.stringify(beforeOther));
  const existingBefore = await Destination.find({}).lean<Record<string, unknown>[]>();
  const existingBySlug = new Map(existingBefore.map((doc) => [doc.slug as string, doc]));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const live = await Destination.find({}, { slug: 1 }).session(session).lean();
      const liveSet = new Set(live.map((doc) => doc.slug));
      assert(live.length === 64 && liveSet.size === 64 && equal(slugDifference(configSet, liveSet), [...BATCH_D_SLUGS].sort()) && slugDifference(liveSet, configSet).length === 0, 'DB changed before transaction writes.');
      const liveShimla = await Destination.findOne({ slug: 'shimla' }).session(session).lean<Record<string, unknown>>();
      assert(liveShimla && equal(liveShimla.places, shimlaDb.places) && equal(liveShimla.hiddenGems, shimlaDb.hiddenGems), 'Shimla changed before transaction writes.');
      for (const slug of BATCH_D_SLUGS) {
        const source = sourceBySlug.get(slug)!;
        await Destination.create([{ ...source, regionId }], { session });
      }
      const changed = await Destination.updateOne(
        { _id: shimlaDb._id, slug: 'shimla' },
        { $set: { places: shimlaSource.places, hiddenGems: shimlaSource.hiddenGems ?? [] } },
        { session }
      );
      assert(changed.matchedCount === 1 && changed.modifiedCount === 1, 'Shimla update did not modify exactly one document.');
      const finalCount = await Destination.countDocuments().session(session);
      assert(finalCount === 70, `In-transaction Destination count is ${finalCount}, expected 70.`);
    });
    console.log('Transaction committed: six inserts and one Shimla update.');
  } finally { await session.endSession(); }

  const after = await Destination.find({}).lean<Record<string, unknown>[]>();
  const afterSet = new Set(after.map((doc) => doc.slug as string));
  assert(after.length === 70 && afterSet.size === 70 && slugDifference(configSet, afterSet).length === 0 && slugDifference(afterSet, configSet).length === 0, 'Post-apply count or slug set failed.');
  for (const slug of REJECTED_SLUGS) assert(!afterSet.has(slug), `Rejected slug appeared after apply: ${slug}`);
  for (const doc of after) {
    const slug = doc.slug as string;
    if (slug === 'shimla') continue;
    if (!batchSet.has(slug)) assert(equal(doc, existingBySlug.get(slug)), `Existing Destination changed unexpectedly: ${slug}`);
  }
  for (const slug of BATCH_D_SLUGS) {
    const doc = after.find((item) => item.slug === slug)!;
    const source = sourceBySlug.get(slug)!;
    assert(doc.state === 'Himachal Pradesh' && doc.toursCount === 0 && String(doc.regionId) === String(regionId) && equal(doc.relatedSlugs, source.relatedSlugs), `New Destination verification failed: ${slug}`);
    console.log(`Verified ${slug}: state=${doc.state}, toursCount=${doc.toursCount}, regionId=${doc.regionId}, relatedSlugs=${JSON.stringify(doc.relatedSlugs)}`);
  }
  const shimlaAfter = after.find((doc) => doc.slug === 'shimla')!;
  assert(equal(shimlaAfter.places, shimlaSource.places) && equal(shimlaAfter.hiddenGems, shimlaSource.hiddenGems ?? []), 'Shimla Mashobra cleanup failed.');
  const expectedShimlaAfter = { ...shimlaDb, places: shimlaAfter.places, hiddenGems: shimlaAfter.hiddenGems, updatedAt: shimlaAfter.updatedAt };
  assert(equal(shimlaAfter, expectedShimlaAfter), 'Other Shimla DB content changed unexpectedly.');
  const afterOther = await otherCounts();
  console.log('Non-Destination after counts:', JSON.stringify(afterOther));
  console.log('Non-Destination count drift:', JSON.stringify(Object.fromEntries(OTHER_COLLECTIONS.filter((name) => beforeOther[name] !== afterOther[name]).map((name) => [name, [beforeOther[name], afterOther[name]]]))));
  console.log('Post-apply Destination count: 70; unique slugs: 70; Shimla and all other existing Destinations verified.');
  await mongoose.disconnect();
}

main().catch((error) => { console.error('Batch D stopped:', (error as Error).message); process.exitCode = 1; });

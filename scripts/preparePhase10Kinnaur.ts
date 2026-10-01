/** Phase 10: exact Kinnaur draft correction and commercialization; never publishes. */
import mongoose from 'mongoose';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { draftJourneys } from '../config/draftJourneys.config';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import type { PackageItineraryDay } from '../types/package';

export const TARGET = 'kinnaur-valley-tour';
export const ALLOWED_FIELDS = Object.freeze([
  'price', 'pickupInfo', 'dropInfo', 'mealPlan', 'transportType', 'minTravellers',
  'roomsIncluded', 'hotelCategoryDescription', 'inclusions', 'exclusions', 'image',
  'regionId', 'usesGeneralCancellationPolicy', 'startingCity', 'endingCity', 'itinerary'
]);
const source = draftJourneys.find(j => j.slug === TARGET)!;
export const CORRECTIONS: Readonly<Record<number, { title: string; description: string }>> = Object.freeze({
  4: { title: 'Sangla to Chitkul to Kalpa', description: 'Travel from Sangla to Chitkul, subject to road and weather conditions, then return through Sangla and continue to Kalpa. Overnight in Kalpa.' },
  6: { title: 'Kalpa to Narkanda', description: 'Begin the return toward Shimla, driving from Kalpa to Narkanda. Overnight in Narkanda.' },
  7: { title: 'Narkanda to Shimla Departure', description: 'Drive from Narkanda to Shimla for the agreed departure/drop.' }
});
export function assertTarget(slug: unknown, status: unknown) {
  if (slug !== TARGET || status !== 'draft') throw new Error('Only the exact Kinnaur draft is authorized');
}
export function assertAllowedFields(values: Record<string, unknown>) {
  for (const field of Object.keys(values)) if (!ALLOWED_FIELDS.includes(field)) throw new Error(`Forbidden field: ${field}`);
}
export function correctedItinerary<T extends PackageItineraryDay>(days: T[]): T[] {
  if (days.length !== source.itinerary.length) throw new Error('Itinerary length conflict');
  return days.map((day, index) => {
    const baseline = source.itinerary[index];
    const approved = CORRECTIONS[baseline.day];
    const content = { day: day.day, title: day.title, description: day.description };
    if (!isDeepStrictEqual(content, baseline) && !(approved && isDeepStrictEqual(content, { day: baseline.day, ...approved }))) {
      throw new Error(`Itinerary conflict at day ${index + 1}`);
    }
    // Preserve each subdocument ID and any unrelated subdocument metadata.
    return approved ? { ...day, ...approved } : { ...day };
  });
}
export function prepareValues(record: Record<string, unknown>, image: string): Record<string, unknown> {
  assertTarget(record.slug, record.status);
  if (record.duration !== source.duration || !isDeepStrictEqual(record.destinationSlugs, source.destinationSlugs)
    || record.startingCity !== 'Shimla' || record.endingCity !== 'Shimla') throw new Error('Route/duration/gateway conflict');
  const values: Record<string, unknown> = {
    price: 22999, minTravellers: 2, roomsIncluded: 1, image,
    startingCity: 'Shimla', endingCity: 'Shimla', usesGeneralCancellationPolicy: true,
    itinerary: correctedItinerary(record.itinerary as PackageItineraryDay[]),
    pickupInfo: 'Pickup from an agreed local point in Shimla for the Day-1 drive to Narkanda. Exact location and departure time are confirmed before booking.',
    dropInfo: 'Drop at an agreed local point in Shimla on Day 7 after the drive from Narkanda. Confirm onward departure timings with sufficient road-transfer time before booking.',
    hotelCategoryDescription: 'Six nights in Standard/Deluxe hotels or guesthouse equivalents appropriate to the route: Narkanda 2 nights (Nights 1 and 6), Sarahan 1 night (Night 2), Sangla 1 night (Night 3), and Kalpa 2 nights (Nights 4 and 5). Double sharing for two adults in one room. Properties and rooms are confirmed before booking, subject to availability; no named hotel or star rating is guaranteed.',
    mealPlan: 'Breakfast and dinner where operationally provided during the six-night itinerary. The exact included meal schedule is confirmed in writing before booking; meals outside that schedule are excluded.',
    transportType: 'Private hill-road vehicle for itinerary-approved motorable sectors from Shimla through Narkanda, Sarahan, Sangla, Chitkul and Kalpa, returning via Narkanda to Shimla. Operation depends on weather, road conditions, local restrictions, landslides and temporary closures. Chitkul access and unrestricted year-round access are not guaranteed. Any necessary route alteration and final operational arrangements are subject to local conditions and confirmation with the traveller; vehicle use is limited to the agreed itinerary.',
    inclusions: [
      'Six nights of approved hotel or guesthouse accommodation in one double-sharing room for two adults: Narkanda 2, Sarahan 1, Sangla 1 and Kalpa 2 nights.',
      'Breakfast and dinner where operationally provided, according to the meal schedule confirmed in writing before booking.',
      'Private hill-road vehicle for the approved Shimla-return itinerary, including agreed Shimla pickup and drop.',
      'Approved motorable sightseeing transfers for the stored Narkanda, Sarahan, Sangla, Chitkul and Kalpa itinerary, subject to local access and road conditions; admissions and paid activities are excluded.',
      'Indicative Starting From price per person onwards on double sharing for two adults in one room; final quote depends on travel dates, confirmed services and availability.'
    ],
    exclusions: [
      'Air/train fares to and from Shimla, personal expenses and shopping.',
      'Lunch, drinks and meals outside the written confirmed meal schedule.',
      'Entry tickets, paid activities, guides, porter services and trekking arrangements.',
      'Restricted-sector or local-union transport unless specifically included in the confirmed quote.',
      'Spiti extensions, off-route excursions, extra vehicle use and anything not specifically included.',
      'Additional nights or services caused by weather, road conditions, local restrictions, landslides or temporary closures are not automatically included; revised arrangements and any extra costs require confirmation.'
    ]
  };
  // Refuse unexpected commercial edits rather than overwrite a newly changed draft.
  for (const [key, value] of Object.entries(values)) {
    if (key === 'itinerary') continue;
    const current = record[key];
    const empty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
    if (!empty && !isDeepStrictEqual(current, value)) throw new Error(`Commercial conflict: ${key}`);
  }
  assertAllowedFields(values);
  return values;
}
export function unchangedOutsidePlan(before: Record<string, unknown>, after: Record<string, unknown>, values: Record<string, unknown>) {
  return isDeepStrictEqual(after, { ...before, ...values });
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--execute')) throw new Error('Only --execute is supported; dry-run is default');
  const execute = args.includes('--execute');
  try { process.loadEnvFile('.env.local'); } catch { /* Supplied environment supported. */ }
  await connectDB();
  const snapshot = async () => ({ journeys: await Journey.find().sort({ slug: 1 }).lean(), destinations: await Destination.find().sort({ slug: 1 }).lean(), regions: await Region.find().sort({ slug: 1 }).lean() });
  const counts = (rows: Awaited<ReturnType<typeof snapshot>>['journeys']) => ({ total: rows.length, published: rows.filter(j => j.status === 'published').length, draft: rows.filter(j => j.status === 'draft').length });
  const before = await snapshot();
  if (!isDeepStrictEqual(counts(before.journeys), { total: 40, published: 26, draft: 14 })) throw new Error('Global count drift');
  const original = before.journeys.find(j => j.slug === TARGET);
  if (!original) throw new Error('Missing Kinnaur draft');
  const destination = before.destinations.find(d => d.slug === 'sangla-valley');
  const region = before.regions.find(r => String(r._id) === String(destination?.regionId));
  if (!destination || destination.status !== 'published' || !region || region.slug !== 'himachal-pradesh' || region.status !== 'published') throw new Error('Image/Region dependency invalid');
  for (const slug of original.destinationSlugs) {
    const d = before.destinations.find(d => d.slug === slug);
    if (!d || d.status !== 'published' || String(d.regionId) !== String(region._id)) throw new Error('Destination dependency invalid');
  }
  if (original.regionId && String(original.regionId) !== String(region._id)) throw new Error('Region conflict');
  const image = destination.image;
  if (!image?.startsWith('/images/') || image.includes('..') || !existsSync(resolve('public', image.slice(1)))) throw new Error('Local source image missing');
  const site = 'https://www.theapexvoyager.in';
  const asset = await fetch(site + image, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  if (asset.status !== 200 || !asset.headers.get('content-type')?.startsWith('image/') || !(await asset.arrayBuffer()).byteLength) throw new Error('Production image unavailable');
  const policy = await fetch(site + '/cancellation-policy', { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const html = await policy.text();
  if (policy.status !== 200 || !/journeys/i.test(html) || !/Booking Cancellation/.test(html)) throw new Error('Cancellation policy gate failed');
  const values = prepareValues(original, image);
  if (!original.regionId) values.regionId = region._id;
  assertAllowedFields(values);
  const candidate = Journey.hydrate({ ...original, ...values });
  await candidate.validate();
  if (!isDeepStrictEqual(getCommercialBlockers(candidate), ['OWNER_APPROVAL_REQUIRED'])) throw new Error('Commercial blockers remain');
  // Exercise the real publication validation hook in memory; persisted status stays draft.
  candidate.status = 'published';
  await candidate.validate();
  const changed = Object.entries(values).some(([k, v]) => !isDeepStrictEqual(Reflect.get(original, k), v));
  console.log(JSON.stringify({ slug: TARGET, mode: execute ? 'EXECUTE' : 'DRY RUN', wouldUpdate: +changed, alreadyCorrect: +!changed, refused: 0, conflicts: 0, proposed: values }));
  if (execute && changed) {
    writeFileSync(join(tmpdir(), 'phase10-before.json'), JSON.stringify(before, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Journey.findById(original._id).session(session).lean();
        if (!isDeepStrictEqual(current, original)) throw new Error('Concurrent Kinnaur edit');
        const result = await Journey.collection.updateOne({ _id: original._id, slug: TARGET, status: 'draft' }, { $set: values }, { session });
        if (result.modifiedCount !== 1) throw new Error('Kinnaur write conflict');
      });
    } finally { await session.endSession(); }
  }
  const after = await snapshot();
  for (const j of before.journeys) {
    const expected = execute && j.slug === TARGET ? values : {};
    const actual = after.journeys.find(a => a.slug === j.slug);
    if (!actual || !unchangedOutsidePlan(j, actual, expected)) throw new Error(`Unexpected mutation: ${j.slug}`);
  }
  if (!isDeepStrictEqual(before.destinations, after.destinations) || !isDeepStrictEqual(before.regions, after.regions) || !isDeepStrictEqual(counts(before.journeys), counts(after.journeys))) throw new Error('Non-target/count change');
  const final = after.journeys.find(j => j.slug === TARGET)!;
  const report = { checkedAt: new Date().toISOString(), mode: execute ? 'EXECUTE' : 'DRY RUN', wouldUpdate: +changed, alreadyCorrect: +!changed, updated: execute ? +changed : 0, refused: 0, conflicts: 0, published: 0, counts: counts(after.journeys), nonTargetsUnchanged: true, protectedFieldsUnchanged: true, destinationsAndRegionsUnchanged: true, image: { source: destination.slug, path: image, local: true, http: 200 }, target: { slug: TARGET, status: final.status, price: final.price, blockers: getCommercialBlockers(final) } };
  writeFileSync(join(tmpdir(), execute ? 'phase10-execution.json' : 'phase10-dry-run.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(tmpdir(), 'phase10-catalogue.json'), JSON.stringify(after, null, 2));
  console.log(JSON.stringify(report));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Phase 10 failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}

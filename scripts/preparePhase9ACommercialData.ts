/** Exact two-draft commercial update. Dry-run default; never publishes. */
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

export const TARGETS = Object.freeze({
  'dharamshala-mcleodganj-short-escape': { price: 10999, source: 'mcleod-ganj' },
  'grand-himachal-circuit': { price: 29999, source: 'dalhousie' }
});
export const ALLOWED_FIELDS = Object.freeze([
  'price', 'pickupInfo', 'dropInfo', 'mealPlan', 'transportType', 'minTravellers',
  'roomsIncluded', 'hotelCategoryDescription', 'inclusions', 'exclusions', 'image',
  'regionId', 'usesGeneralCancellationPolicy'
]);
export function assertTarget(slug: string, status: unknown) {
  if (!Object.prototype.hasOwnProperty.call(TARGETS, slug) || status !== 'draft') throw new Error(`Refused target/status: ${slug}`);
}
export function assertAllowedFields(slug: string, values: Record<string, unknown>) {
  assertTarget(slug, 'draft');
  for (const field of Object.keys(values)) {
    if (!ALLOWED_FIELDS.includes(field) && !(slug === 'dharamshala-mcleodganj-short-escape' && field === 'endingCity' && values[field] === 'Pathankot')) {
      throw new Error(`Forbidden field: ${slug}.${field}`);
    }
  }
}
export function commercialValues(slug: string, image: string): Record<string, unknown> {
  assertTarget(slug, 'draft');
  const dharamshala = slug === 'dharamshala-mcleodganj-short-escape';
  const values: Record<string, unknown> = {
    price: TARGETS[slug as keyof typeof TARGETS].price,
    minTravellers: 2, roomsIncluded: 1, image, usesGeneralCancellationPolicy: true,
    pickupInfo: dharamshala
      ? 'Pickup from an agreed railway station or local point in Pathankot for the Day-1 transfer to Dharamshala. Exact location and arrival time must allow the road transfer and are confirmed before booking.'
      : 'Pickup from an agreed airport, railway station or local point in Chandigarh for the Day-1 drive to Shimla. Exact location and departure time are confirmed before booking.',
    dropInfo: dharamshala
      ? 'Return transfer to an agreed railway station or local point in Pathankot after checkout on Day 4. Confirm departure timings with sufficient road-transfer time before booking.'
      : 'Local drop at an agreed point in Dalhousie after checkout on Day 10. The package ends in Dalhousie; onward transfers to Pathankot, Chandigarh or another destination require a separate quote.',
    hotelCategoryDescription: dharamshala
      ? 'Three nights in a Standard/Deluxe hotel or equivalent in the Dharamshala/McLeod Ganj area, on double sharing for two adults in one room. This is an accommodation category, not a confirmed named property or star rating; the hotel and room are confirmed before booking, subject to availability.'
      : 'Nine nights in Standard/Deluxe hotels or equivalent: Shimla 2 nights, Manali 3 nights, Dharamshala 2 nights and Dalhousie 2 nights. Double sharing for two adults in one room. This is an accommodation category, not a confirmed named property or star rating; hotels and rooms are confirmed before booking, subject to availability.',
    mealPlan: dharamshala
      ? 'Breakfast and dinner during the three-night stay: three breakfasts and three dinners. Lunch and meals outside this stated plan are excluded.'
      : 'Breakfast and dinner where operationally provided during the nine-night hotel itinerary. The exact included meal schedule is confirmed in writing before booking; meals outside that confirmed schedule are excluded.',
    transportType: dharamshala
      ? 'Private cab for the approved Pathankot-Dharamshala-Pathankot transfers and motorable Dharamshala/McLeod Ganj sightseeing sectors. Route and timing depend on road/weather conditions; vehicle use is limited to the agreed itinerary.'
      : 'Private cab for approved road sectors from Chandigarh through Shimla, Manali and Dharamshala to Dalhousie, with accessible Solang/Khajjiar sightseeing transfers. Day 6 from Manali to Dharamshala is a long, dedicated transfer day requiring suitable departure time and rest stops. Road/weather conditions may require a revised plan agreed with the traveller; this is not unlimited vehicle use.',
    inclusions: dharamshala ? [
      'Three nights in the approved Standard/Deluxe hotel category or equivalent, in one double-sharing room for two adults.',
      'Three breakfasts and three dinners during the three-night stay.',
      'Private cab pickup in Pathankot and return drop in Pathankot at the agreed locations and timings.',
      'Private cab for approved motorable Dharamshala and McLeod Ganj sightseeing sectors; attraction admissions and paid activities are not included.',
      'Indicative Starting From price per person on double sharing for two adults in one room; final quote depends on travel dates, confirmed services and availability.'
    ] : [
      'Nine nights in the approved Standard/Deluxe hotel category or equivalent, in one double-sharing room for two adults: Shimla 2, Manali 3, Dharamshala 2 and Dalhousie 2 nights.',
      'Breakfast and dinner where operationally provided, according to the meal schedule confirmed in writing before booking.',
      'Private cab for approved Chandigarh-Shimla-Manali-Dharamshala-Dalhousie road transfers, ending with local Dalhousie drop.',
      'Approved motorable sightseeing transfers including accessible Solang Valley and Khajjiar/Chamera sectors, subject to road and weather conditions; attraction admissions and paid activities are excluded.',
      'Day 6 is a long Manali-to-Dharamshala transfer, not a short or relaxed sightseeing day; departure time and rest stops are confirmed for the route.',
      'Indicative Starting From price per person on double sharing for two adults in one room; final quote depends on travel dates, confirmed services and availability.'
    ],
    exclusions: dharamshala ? [
      'Air/train fares to and from Pathankot; personal expenses and shopping.',
      'Lunch, drinks and any meals outside the stated breakfast-and-dinner plan.',
      'Entry tickets, paid activities, guides, porter services and trekking arrangements, including a Triund trek.',
      'Restricted-sector or local-union transport unless specifically included in the confirmed quote.',
      'Dalhousie/Khajjiar extensions, additional vehicle use and services not specifically included.',
      'Additional nights or services caused by road/weather disruption are not automatically included; alternatives and any extra cost require separate confirmation.'
    ] : [
      'Air/train fares, personal expenses and meals outside the confirmed meal schedule.',
      'Entry tickets, adventure activities, guides, porter services and equipment hire.',
      'Rohtang/Atal Tunnel extensions and restricted-sector or local-union vehicles unless explicitly included in the confirmed quote.',
      'Onward travel beyond the agreed Dalhousie local drop, including transfers to Pathankot or Chandigarh.',
      'Extra vehicle use, off-route excursions and services not specifically included.',
      'Additional nights or services due to road/weather disruption are not automatically included; any revised itinerary, services and cost are confirmed with the traveller.'
    ]
  };
  if (dharamshala) values.endingCity = 'Pathankot';
  assertAllowedFields(slug, values);
  return values;
}
export function unchangedOutsidePlan(before: Record<string, unknown>, after: Record<string, unknown>, values: Record<string, unknown>) {
  return isDeepStrictEqual(after, { ...before, ...values });
}
const site = 'https://www.theapexvoyager.in';
async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--execute')) throw new Error('Unknown argument; only --execute is supported');
  const execute = args.includes('--execute');
  try { process.loadEnvFile('.env.local'); } catch { /* supplied environment supported */ }
  await connectDB();
  const snapshot = async () => ({
    journeys: await Journey.find().sort({ slug: 1 }).lean(),
    destinations: await Destination.find().sort({ slug: 1 }).lean(),
    regions: await Region.find().sort({ slug: 1 }).lean()
  });
  const before = await snapshot();
  const counts = (rows: typeof before.journeys) => ({ total: rows.length, published: rows.filter(j => j.status === 'published').length, draft: rows.filter(j => j.status === 'draft').length });
  if (!isDeepStrictEqual(counts(before.journeys), { total: 40, published: 24, draft: 16 })) throw new Error('Global count drift');
  const policy = await fetch(site + '/cancellation-policy', { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const policyHtml = await policy.text();
  if (policy.status !== 200 || !/journeys/i.test(policyHtml) || !/Booking Cancellation/.test(policyHtml)) throw new Error('Cancellation policy unavailable/inapplicable');
  const plans: { original: (typeof before.journeys)[number]; values: Record<string, unknown>; changed: boolean }[] = [];
  const refused: { slug: string; reason: string }[] = [];
  for (const [slug, target] of Object.entries(TARGETS)) {
    try {
      const original = before.journeys.find(j => j.slug === slug);
      assertTarget(slug, original?.status);
      if (!original) throw new Error('Missing draft');
      const config = draftJourneys.find(j => j.slug === slug)!;
      const days = original.itinerary.map((d: PackageItineraryDay) => ({ day: d.day, title: d.title, description: d.description }));
      if (!isDeepStrictEqual(days, config.itinerary) || original.duration !== config.duration || !isDeepStrictEqual(original.destinationSlugs, config.destinationSlugs) || original.startingCity !== config.startingCity) throw new Error('Route/duration drift');
      const expectedEnd = slug === 'grand-himachal-circuit' ? ['Dalhousie'] : ['Dharamshala', 'Pathankot'];
      if (!expectedEnd.includes(original.endingCity ?? '')) throw new Error('Conflicting endingCity');
      const source = before.destinations.find(d => d.slug === target.source);
      const region = before.regions.find(r => String(r._id) === String(source?.regionId));
      if (!source || source.status !== 'published' || !original.destinationSlugs?.includes(source.slug) || !region || region.status !== 'published' || region.slug !== 'himachal-pradesh') throw new Error('Image/Region dependency invalid');
      for (const stop of original.destinationSlugs) {
        const d = before.destinations.find(d => d.slug === stop);
        if (!d || d.status !== 'published' || String(d.regionId) !== String(region._id)) throw new Error('Destination dependency invalid');
      }
      if (original.regionId && String(original.regionId) !== String(region._id)) throw new Error('Region conflict');
      if (!source.image.startsWith('/images/') || source.image.includes('..') || !existsSync(resolve('public', source.image.slice(1)))) throw new Error('Local source image missing');
      const asset = await fetch(site + source.image, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
      if (asset.status !== 200 || !asset.headers.get('content-type')?.startsWith('image/') || !(await asset.arrayBuffer()).byteLength) throw new Error('Production image unavailable');
      const values = commercialValues(slug, source.image);
      if (!original.regionId) values.regionId = region._id;
      assertAllowedFields(slug, values);
      const candidate = Journey.hydrate({ ...original, ...values });
      await candidate.validate();
      if (!isDeepStrictEqual(getCommercialBlockers(candidate), ['OWNER_APPROVAL_REQUIRED'])) throw new Error('Commercial blockers remain');
      const changed = Object.entries(values).some(([k, v]) => !isDeepStrictEqual(Reflect.get(original, k), v));
      plans.push({ original, values, changed });
      console.log(JSON.stringify({ slug, status: original.status, imageSource: source.slug, image: source.image, changed, proposed: values, blockers: getCommercialBlockers(candidate) }));
    } catch (e) { refused.push({ slug, reason: e instanceof Error ? e.message : 'Validation failure' }); }
  }
  const summary = { targetCount: 2, wouldUpdate: plans.filter(p => p.changed).length, alreadyCorrect: plans.filter(p => !p.changed).length, refused, conflicts: 0 };
  console.log(JSON.stringify({ mode: execute ? 'EXECUTE' : 'DRY RUN', ...summary }));
  // Refuse the transaction if any target gate fails; resolve/exclude that target explicitly before rerunning.
  if (refused.length) throw new Error('Target gate failed; no writes performed');
  if (execute) {
    writeFileSync(join(tmpdir(), 'phase9a-before.json'), JSON.stringify(before, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const plan of plans) {
          const current = await Journey.findById(plan.original._id).session(session).lean();
          if (!isDeepStrictEqual(current, plan.original)) throw new Error(`Concurrent edit: ${plan.original.slug}`);
          if (!plan.changed) continue;
          const result = await Journey.collection.updateOne({ _id: plan.original._id, slug: plan.original.slug, status: 'draft' }, { $set: plan.values }, { session });
          if (result.modifiedCount !== 1) throw new Error(`Write conflict: ${plan.original.slug}`);
        }
      });
    } finally { await session.endSession(); }
  }
  const after = await snapshot();
  for (const original of before.journeys) {
    const values = execute ? plans.find(p => p.original.slug === original.slug)?.values ?? {} : {};
    const record = after.journeys.find(j => j.slug === original.slug);
    if (!record || !unchangedOutsidePlan(original, record, values)) throw new Error(`Unexpected document change: ${original.slug}`);
  }
  if (!isDeepStrictEqual(before.destinations, after.destinations) || !isDeepStrictEqual(before.regions, after.regions) || !isDeepStrictEqual(counts(before.journeys), counts(after.journeys))) throw new Error('Non-target/count change');
  const report = { checkedAt: new Date().toISOString(), mode: execute ? 'EXECUTE' : 'DRY RUN', ...summary,
    updated: execute ? summary.wouldUpdate : 0, published: 0, counts: counts(after.journeys), nonTargetsUnchanged: true,
    protectedFieldsUnchanged: true, destinationsAndRegionsUnchanged: true,
    targets: after.journeys.filter(j => Object.prototype.hasOwnProperty.call(TARGETS, j.slug)).map(j => ({ slug: j.slug, status: j.status, blockers: getCommercialBlockers(j), price: j.price, image: j.image })) };
  writeFileSync(join(tmpdir(), execute ? 'phase9a-execution.json' : 'phase9a-dry-run.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(tmpdir(), 'phase9a-catalogue.json'), JSON.stringify(after, null, 2));
  console.log(JSON.stringify(report));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e instanceof Error ? e.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Phase 9A failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}

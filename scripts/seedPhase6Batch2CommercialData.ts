/** Phase 6: exact eight-draft update. Dry run by default; never changes status. */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { connectDB } from '../lib/mongodb';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { draftJourneys } from '../config/draftJourneys.config';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { DESTINATIONS_WITHOUT_VERIFIED_IMAGE } from '../config/destinationImageOverrides';
import type { PackageItineraryDay } from '../types/package';

export const TARGET_PRICES = {
  'shimla-short-escape': 7999,
  'manali-short-escape': 8999,
  'kasol-manikaran-weekend': 6999,
  'dalhousie-khajjiar-chamba': 10999,
  'bir-billing-palampur': 9999,
  'mussoorie-weekend': 7999,
  'valley-of-flowers-hemkund-sahib-trek': 12999,
  'rishikesh-adventure-package': 8999
} as const;
export const COMMERCIAL_FIELDS = [
  'price', 'priceBasis', 'image', 'pickupInfo', 'dropInfo', 'mealPlan',
  'transportType', 'hotelCategoryDescription', 'minTravellers', 'roomsIncluded',
  'inclusions', 'exclusions', 'usesGeneralCancellationPolicy', 'importantNotes'
] as const;

export function assertDraftTarget(slug: string, status: unknown) {
  if (!Object.prototype.hasOwnProperty.call(TARGET_PRICES, slug) || status !== 'draft') {
    throw new Error(`REFUSING ${slug}: must be an allowlisted existing draft`);
  }
}

const site = 'https://www.theapexvoyager.in';
async function readPage(path: string) {
  const response = await fetch(`${site}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  return { status: response.status, html: await response.text() };
}

async function main() {
  try { process.loadEnvFile('.env.local'); } catch { /* Environment may already be supplied. */ }
  const execute = process.argv.includes('--execute');
  if (execute && !process.argv.includes('--deployment-ready')) {
    throw new Error('Verify Vercel Ready for the intended commit first, then supply --deployment-ready');
  }
  await connectDB();
  const before = await Journey.find().sort({ slug: 1 }).lean();
  const destinations = await Destination.find().lean();
  const regions = await Region.find().lean();
  const policy = await readPage('/cancellation-policy');
  if (policy.status !== 200 || !/journeys/i.test(policy.html) || !/Booking Cancellation/i.test(policy.html)) {
    throw new Error('Public, Journey-applicable cancellation policy could not be verified');
  }
  const plans: { existing: (typeof before)[number]; setDoc: Record<string, unknown>; changed: boolean }[] = [];
  for (const [slug, price] of Object.entries(TARGET_PRICES)) {
    const config = draftJourneys.find(j => j.slug === slug);
    const existing = before.find(j => j.slug === slug);
    if (!config || !existing) throw new Error(`Missing target ${slug}`);
    assertDraftTarget(slug, existing.status);
    if (config.status !== 'draft' || config.price !== price) throw new Error(`Config mismatch ${slug}`);
    // Compare authored itinerary fields, ignoring Mongo subdocument IDs.
    const days = existing.itinerary.map((d: PackageItineraryDay) => ({ day: d.day, title: d.title, description: d.description }));
    if (!isDeepStrictEqual(days, config.itinerary) || existing.duration !== config.duration ||
        !isDeepStrictEqual(existing.destinationSlugs, config.destinationSlugs)) {
      throw new Error(`Route/duration drift: ${slug}; inspect production before writing`);
    }
    const duration = /^(\d+) Nights \/ (\d+) Days$/.exec(config.duration);
    if (!duration || +duration[2] !== days.length || +duration[1] !== days.length - 1) {
      throw new Error(`Duration mismatch: ${slug}`);
    }
    if (!config.destinationSlugs?.length) throw new Error(`Missing destinations: ${slug}`);
    const stops = config.destinationSlugs.map(s => destinations.find(d => d.slug === s));
    if (stops.some(d => !d || d.status !== 'published' || !d.regionId)) throw new Error(`Invalid destinations: ${slug}`);
    // Same destination-derived resolution as backfillRegionRefs, scoped to these eight.
    const regionId = stops.find(d => d?.regionId)?.regionId;
    const region = regions.find(r => String(r._id) === String(regionId));
    const expectedRegion = ['mussoorie-weekend', 'valley-of-flowers-hemkund-sahib-trek', 'rishikesh-adventure-package'].includes(slug)
      ? 'Uttarakhand' : 'Himachal Pradesh';
    if (!region || region.name !== expectedRegion || region.status !== 'published' ||
        stops.some(d => String(d?.regionId) !== String(regionId)) ||
        (existing.regionId && String(existing.regionId) !== String(regionId))) throw new Error(`Region conflict: ${slug}`);
    const source = stops.find(d => d?.image === config.image && !DESTINATIONS_WITHOUT_VERIFIED_IMAGE.has(d.slug));
    if (!source || !config.image?.startsWith('/images/destination-') ||
        !existsSync(resolve('public', config.image.slice(1)))) throw new Error(`Unverified image: ${slug}`);
    const setDoc = Object.fromEntries(COMMERCIAL_FIELDS.map(key => [key, config[key]]));
    if (Object.values(setDoc).some(v => v === undefined)) throw new Error(`Missing commercial field: ${slug}`);
    if (!existing.regionId) setDoc.regionId = regionId;
    const changed = Object.entries(setDoc).some(([key, value]) => !isDeepStrictEqual(Reflect.get(existing, key), value));
    plans.push({ existing, setDoc, changed });
    console.log(JSON.stringify({ slug, status: existing.status, duration: config.duration, price,
      image: config.image, imageSource: source.slug, region: region.name, regionId: String(regionId),
      blockers: getCommercialBlockers(config), changed }));
  }
  const counts = (rows: typeof before) => ({ total: rows.length, published: rows.filter(j => j.status === 'published').length, draft: rows.filter(j => j.status === 'draft').length });
  if (!isDeepStrictEqual(counts(before), { total: 40, published: 16, draft: 24 })) throw new Error('Unexpected Journey counts');
  let updated = 0;
  if (execute) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        updated = 0;
        for (const { existing, setDoc, changed } of plans) {
          if (!changed) continue;
          const result = await Journey.updateOne(
            { _id: existing._id, slug: existing.slug, status: 'draft', updatedAt: existing.updatedAt },
            { $set: setDoc }, { session, runValidators: true }
          );
          if (result.matchedCount !== 1) throw new Error(`Concurrent edit: ${existing.slug}; transaction aborted`);
          updated += result.modifiedCount;
        }
      });
    } finally { await session.endSession(); }
  }
  const after = await Journey.find().sort({ slug: 1 }).lean();
  const untouched = (rows: typeof before) => rows.filter(j => !Object.prototype.hasOwnProperty.call(TARGET_PRICES, j.slug));
  if (!isDeepStrictEqual(untouched(before), untouched(after)) || !isDeepStrictEqual(counts(before), counts(after))) {
    throw new Error('Postcheck: non-target records or global counts changed');
  }
  for (const plan of plans) {
    const record = after.find(j => j.slug === plan.existing.slug);
    assertDraftTarget(plan.existing.slug, record?.status);
    if (execute && Object.entries(plan.setDoc).some(([k, v]) => !isDeepStrictEqual(Reflect.get(record!, k), v))) {
      throw new Error(`Postcheck mismatch: ${plan.existing.slug}`);
    }
  }
  console.log(JSON.stringify({ mode: execute ? 'EXECUTE' : 'DRY RUN', updated, wouldUpdate: plans.filter(p => p.changed).length,
    unchanged: plans.filter(p => !p.changed).length, conflicts: 0, counts: counts(after), nonTargetsUnchanged: true }));
  if (process.argv.includes('--audit-public')) {
    const [listing, sitemap] = await Promise.all([readPage('/journeys'), readPage('/sitemap.xml')]);
    if (listing.status !== 200 || sitemap.status !== 200) throw new Error('Listing/sitemap unavailable');
    for (const slug of Object.keys(TARGET_PRICES)) {
      const page = await readPage(`/journeys/${slug}`);
      const leaked = listing.html.includes(slug) || sitemap.html.includes(slug);
      console.log(JSON.stringify({ slug, http: page.status, leaked }));
      if (page.status !== 404 || leaked) throw new Error(`Draft public leak: ${slug}`);
    }
    for (const journey of after.filter(j => j.status === 'published')) {
      const page = await readPage(`/journeys/${journey.slug}`);
      const schemas = [...page.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
      const nodes = schemas.flatMap(s => s['@graph'] ?? s);
      const product = nodes.find(s => s['@type'] === 'Product');
      const breadcrumb = nodes.find(s => s['@type'] === 'BreadcrumbList');
      const visible = /aria-label="Breadcrumb"/.test(page.html);
      const valid = page.status === 200 && visible && breadcrumb?.itemListElement?.length === 3 &&
        product?.offers?.['@type'] === 'AggregateOffer' && Number(product.offers.lowPrice) === journey.price &&
        !nodes.some(s => ['Review', 'AggregateRating'].includes(s['@type']));
      console.log(JSON.stringify({ slug: journey.slug, http: page.status, visibleBreadcrumb: visible, schemaAndPrice: Boolean(valid) }));
      if (!valid) throw new Error(`Live regression: ${journey.slug}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    // Avoid logging connection strings or database error objects.
    console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Phase 6 failed');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}

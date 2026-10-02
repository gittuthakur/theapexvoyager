/** Phase 13: read-only audit and decision proposals. There is intentionally no DB write path. */
import mongoose from 'mongoose';
import { existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { assertInventory, assertReadOnlyArguments, assertUnchanged, buildProposal, evaluateProposal, findDraftPublicLeaks, fingerprint, type RecordData } from './phase13OwnerDecisionGuard';

const site = 'https://www.theapexvoyager.in';
const candidates = ['auli', 'badrinath', 'mcleod-ganj', 'kedarnath', 'mussoorie'];
async function get(path: string) {
  return fetch(site + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
}

export async function verifyPublicState(draftSlugs: string[], publishedSlugs: string[]) {
  const [catalogueResponse, sitemapResponse] = await Promise.all([get('/api/journeys'), get('/sitemap.xml')]);
  if (catalogueResponse.status !== 200 || sitemapResponse.status !== 200) throw new Error('Public catalogue/sitemap unavailable');
  const catalogue = await catalogueResponse.json();
  const catalogueSlugs: string[] = catalogue.journeys.map((row: { slug: string }) => row.slug);
  const sitemapSlugs = [...(await sitemapResponse.text()).matchAll(/<loc>[^<]*\/journeys\/([^<]+)<\/loc>/g)].map(match => match[1]);
  assertUnchanged([...publishedSlugs].sort(), catalogueSlugs.sort());
  assertUnchanged([...publishedSlugs].sort(), sitemapSlugs.sort());
  const leaks = findDraftPublicLeaks(draftSlugs, catalogueSlugs, sitemapSlugs.map(slug => `${site}/journeys/${slug}`));
  if (!leaks.isolated) throw new Error('Draft public leak');
  const draftRoutes = [];
  for (const slug of draftSlugs) {
    const [page, api] = await Promise.all([get(`/journeys/${slug}`), get(`/api/journeys/${slug}`)]);
    if (page.status !== 404 || api.status !== 404) throw new Error(`Draft page/API exposed: ${slug}`);
    draftRoutes.push({ slug, page: page.status, api: api.status });
  }
  return { catalogue: catalogueSlugs.length, sitemap: sitemapSlugs.length, leaks, draftRoutes };
}

async function snapshot() {
  const [journeys, destinations, regions] = await Promise.all([
    Journey.find().sort({ slug: 1 }).lean(), Destination.find().sort({ slug: 1 }).lean(), Region.find().sort({ slug: 1 }).lean()
  ]);
  // Convert BSON/Date values to stable JSON for review and source conflict checks.
  return JSON.parse(JSON.stringify({ journeys, destinations, regions })) as { journeys: RecordData[]; destinations: RecordData[]; regions: RecordData[] };
}

async function main() {
  const args = process.argv.slice(2);
  assertReadOnlyArguments(args); // Refuse execution before environment loading or DB connection.
  try { process.loadEnvFile('.env.local'); } catch { /* Environment can be supplied externally. */ }
  await connectDB();
  const before = await snapshot();
  const targets = assertInventory(before.journeys);
  const drafts = before.journeys.filter(row => row.status === 'draft').map(row => String(row.slug));
  const published = before.journeys.filter(row => row.status === 'published');
  const publicBefore = await verifyPublicState(drafts, published.map(row => String(row.slug)));
  const inventory = targets.map(row => {
    const region = before.regions.find(region => region._id === row.regionId);
    return {
      stored: row, region: region ? { slug: region.slug, name: region.name, status: region.status } : null,
      destinations: (row.destinationSlugs as string[]).map(slug => {
        const destination = before.destinations.find(item => item.slug === slug);
        return { slug, status: destination?.status ?? 'MISSING' };
      }),
      readinessBlockers: [...getCommercialBlockers(row), ...(!row.image ? ['IMAGE_REQUIRED'] : [])]
    };
  });
  const proposals = targets.map(buildProposal);
  assertUnchanged(proposals, targets.map(buildProposal));
  const decisions = proposals.map((proposal, index) => evaluateProposal(targets[index], proposal));
  const imageCandidates = await Promise.all(candidates.map(async name => {
    const path = `/images/destination-${name}.jpg`;
    const response = await get(path);
    const bytes = (await response.arrayBuffer()).byteLength;
    return { path, localExists: existsSync(`public${path}`), http: response.status, contentType: response.headers.get('content-type'), bytes, assigned: false, classification: 'OWNER VISUAL REVIEW REQUIRED', rightsEvidence: 'docs/image-sources.md; see Phase 13 decision pack for source checks' };
  }));
  const comparisons = targets.map(target => ({
    slug: target.slug,
    againstAll28: published.map(live => ({
      slug: live.slug, name: live.name, duration: live.duration,
      destinationSlugs: live.destinationSlugs, startingCity: live.startingCity ?? null, endingCity: live.endingCity ?? null,
      shortDescription: live.shortDescription ?? null, seo: live.seo ?? null,
      sharedDestinations: (target.destinationSlugs as string[]).filter(slug => (live.destinationSlugs as string[] ?? []).includes(slug))
    }))
  }));
  const publicAfter = await verifyPublicState(drafts, published.map(row => String(row.slug)));
  const after = await snapshot();
  assertUnchanged(before, after);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const report = {
    phase: 13, auditedAt: new Date().toISOString(), headAtAudit: head,
    mode: 'DRY RUN — EXECUTION DISABLED', counts: { total: 40, published: 28, draft: 12 },
    targetSlugs: targets.map(row => row.slug), inventory, proposals, decisions, comparisons, imageCandidates,
    publicBefore, publicAfter,
    sourceFingerprints: { before: fingerprint(before), after: fingerprint(after), publishedBefore: fingerprint(published), publishedAfter: fingerprint(after.journeys.filter(row => row.status === 'published')) },
    all40JourneysUnchanged: true, taxonomyUnchanged: true, deterministicProposalGeneration: true,
    commercialWrites: 0, publications: 0, immediateAfterOwnerApproval: [],
    stillRequiringWork: targets.map(row => row.slug), projectedNextBatchSize: 0, projectedLiveCount: 28,
    protectedSystems: { HBX: 'untouched', GooglePlaces: 'untouched', PlaceCache: 'untouched', transportPricing: 'untouched', IndexNow: 'deferred' }
  };
  if (args.includes('--write-report')) writeFileSync('docs/phase-13-five-owner-decision-verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ counts: report.counts, targets: report.targetSlugs, decisions, publicAfter, all40JourneysUnchanged: true, proposalIdempotency: true, commercialWrites: 0, publications: 0, reportWritten: args.includes('--write-report') }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    // Emit exact guard failures, but never expose driver errors or connection strings.
    const message = error instanceof Error ? error.message : '';
    const safeGuard = /^(PHASE13_EXECUTION_DISABLED|Only --write-report|Expected 12 production drafts|Production baseline drift|Honeymoon identity changed|Target must exist once|SOURCE_CONFLICT|Public catalogue\/sitemap unavailable|Draft public leak|Draft page\/API exposed)/.test(message);
    console.error(safeGuard ? message : 'Phase 13 audit failed during database, HTTP or report access; no commercial execution is available.');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}

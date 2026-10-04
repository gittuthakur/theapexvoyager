/**
 * Mirrors existing legacy enquiries (Inquiry, BookingRequest, Enquiry) into the canonical
 * Lead collection. DRY RUN by default.
 *
 * DRY RUN is strictly read-only and PII-free:
 *  - only native `find().toArray()` reads - no models are initialised (autoIndex/autoCreate
 *    are switched off), so not even an index or collection is created;
 *  - output is aggregate counts only - never a name, phone, email, message or id.
 *
 * --execute (needs explicit owner approval, NOT used in Phase 16A) writes Lead rows:
 * idempotent via Lead.legacyRef, preserves original createdAt, never edits legacy rows.
 *
 * Usage:
 *   npx tsx scripts/backfillLeadsFromLegacy.ts             (dry run - default)
 *   npx tsx scripts/backfillLeadsFromLegacy.ts --execute   (writes Lead rows)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { DUPLICATE_WINDOW_MS, normalizePhone, validateLeadInput, type LeadInput } from '../lib/leads';
import { bookingRequestToLeadPayload, enquiryToLeadPayload, inquiryToLeadPayload } from '../lib/leadLegacyMapping';

type Row = Record<string, unknown>;
interface SourceDef { model: string; collection: string; map: (row: Row) => Row; key: (row: Row) => string }

const SOURCES: SourceDef[] = [
  { model: 'Inquiry', collection: 'inquiries', map: r => inquiryToLeadPayload(r), key: r => String(r._id) },
  { model: 'BookingRequest', collection: 'bookingrequests', map: r => bookingRequestToLeadPayload(r), key: r => String(r.referenceId) },
  { model: 'Enquiry', collection: 'enquiries', map: r => enquiryToLeadPayload(r), key: r => String(r._id) }
];

const bump = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };

/** Same-identity + same lead type + same subject within 24h of an earlier would-be lead. */
export function countDuplicateCandidates(items: { input: LeadInput; at: number }[]): number {
  const sorted = [...items].sort((a, b) => a.at - b.at);
  const seen = new Map<string, number[]>();
  let duplicates = 0;
  for (const { input, at } of sorted) {
    const subject = input.journeySlug ?? input.destination ?? '';
    const identities = [normalizePhone(input.phone) ?? normalizePhone(input.whatsappNumber), input.email].filter(Boolean) as string[];
    const isDup = identities.some(id => (seen.get(`${id}|${input.leadType}|${subject}`) ?? []).some(t => at - t <= DUPLICATE_WINDOW_MS));
    if (isDup) duplicates++;
    for (const id of identities) {
      const k = `${id}|${input.leadType}|${subject}`;
      seen.set(k, [...(seen.get(k) ?? []), at]);
    }
  }
  return duplicates;
}

async function dryRun() {
  const db = mongoose.connection;
  const leads = db.collection('leads');
  const totals = { inspected: 0, wouldCreate: 0, skipped: 0, alreadyMirrored: 0, invalid: 0, duplicateCandidates: 0 };
  const all: { input: LeadInput; at: number }[] = [];

  for (const source of SOURCES) {
    const rows = (await db.collection(source.collection).find({}).toArray()) as Row[];
    const mirrored = new Set(
      (await leads.find({ 'legacyRef.model': source.model }, { projection: { 'legacyRef.id': 1 } }).toArray()).map(d => String((d.legacyRef as { id: string }).id))
    );
    const stats = { total: rows.length, alreadyMirrored: 0, invalid: 0, wouldCreate: 0 };
    const types: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const kinds: Record<string, number> = {};
    const invalidReasons: Record<string, number> = {};
    const mine: { input: LeadInput; at: number }[] = [];

    for (const row of rows) {
      if (mirrored.has(source.key(row))) { stats.alreadyMirrored++; continue; }
      const parsed = validateLeadInput(source.map(row));
      if (!parsed.ok) { stats.invalid++; bump(invalidReasons, parsed.error); continue; }
      stats.wouldCreate++;
      bump(types, parsed.value.leadType);
      bump(kinds, parsed.value.captureKind);
      bump(sources, parsed.value.attribution?.source ?? (parsed.value.captureKind === 'WHATSAPP_CLICK' ? 'whatsapp' : 'website'));
      const created = row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now();
      mine.push({ input: parsed.value, at: created });
    }
    const dupes = countDuplicateCandidates(mine);
    all.push(...mine);
    totals.inspected += stats.total; totals.wouldCreate += stats.wouldCreate; totals.alreadyMirrored += stats.alreadyMirrored;
    totals.invalid += stats.invalid; totals.duplicateCandidates += dupes;
    console.log(`\n${source.model} (collection "${source.collection}")`);
    console.log(`  rows inspected:        ${stats.total}`);
    console.log(`  eligible (would create): ${stats.wouldCreate}`);
    console.log(`  skipped:               ${stats.alreadyMirrored + stats.invalid} (alreadyMirrored=${stats.alreadyMirrored}, invalid/unusable=${stats.invalid})`);
    console.log(`  duplicate candidates:  ${dupes}`);
    console.log(`  lead types:            ${JSON.stringify(types)}`);
    console.log(`  capture kinds:         ${JSON.stringify(kinds)}`);
    console.log(`  lead sources:          ${JSON.stringify(sources)}`);
    if (stats.invalid) console.log(`  invalid reasons:       ${JSON.stringify(invalidReasons)}`);
  }
  const crossDupes = countDuplicateCandidates(all);
  totals.skipped = totals.alreadyMirrored + totals.invalid;
  console.log('\nTOTALS');
  console.log(`  historical records inspected: ${totals.inspected}`);
  console.log(`  leads that WOULD be created:  ${totals.wouldCreate}`);
  console.log(`  skipped:                      ${totals.skipped} (alreadyMirrored=${totals.alreadyMirrored}, invalid=${totals.invalid})`);
  console.log(`  already mirrored:             ${totals.alreadyMirrored}`);
  console.log(`  duplicate candidates (cross-source): ${crossDupes}`);
  console.log('\nDRY RUN - read-only, nothing written. --execute requires explicit owner approval.');
}

async function execute() {
  const [{ Lead }, { createLead }] = await Promise.all([import('../models/Lead'), import('../services/leads/lead.service')]);
  for (const source of SOURCES) {
    const rows = (await mongoose.connection.collection(source.collection).find({}).toArray()) as Row[];
    let created = 0;
    for (const row of rows) {
      if (await Lead.exists({ 'legacyRef.model': source.model, 'legacyRef.id': source.key(row) })) continue;
      const parsed = validateLeadInput(source.map(row));
      if (!parsed.ok) continue;
      const result = await createLead(parsed.value, 'backfill', { skipDuplicateCheck: true });
      if (result.ok && result.value.created) {
        created++;
        const at = row.createdAt as Date | undefined;
        if (at) await Lead.collection.updateOne({ _id: result.value.lead._id }, { $set: { createdAt: at, updatedAt: at } });
      }
    }
    console.log(`${source.model}: created=${created}`);
  }
  console.log('EXECUTED.');
}

async function main() {
  try { process.loadEnvFile('.env.local'); } catch { /* assume MONGODB_URI is already set */ }
  const run = process.argv.includes('--execute');
  if (!run) { mongoose.set('autoIndex', false); mongoose.set('autoCreate', false); }
  await connectDB();
  await (run ? execute() : dryRun());
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(() => { console.error('Backfill failed (details withheld to avoid leaking connection or customer data)'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}

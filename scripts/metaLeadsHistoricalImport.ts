/**
 * Meta Lead Ads HISTORICAL import. DRY RUN by default; --execute needs separate OWNER approval.
 *
 *   npx tsx scripts/metaLeadsHistoricalImport.ts --source=api                 (Graph API: needs META_* config)
 *   npx tsx scripts/metaLeadsHistoricalImport.ts --source=csv --csv=<file>    (Leads Center CSV export)
 *   add --execute only after the owner has reviewed the dry-run.
 *
 * DRY RUN is read-only (native reads, no model init, autoIndex/autoCreate off) and prints
 * AGGREGATE counts only - never a name, phone, email, answer or lead id.
 * Execute: idempotent (legacyRef {MetaLeadAd, leadgen id} is unique), keeps Meta's created_time,
 * never edits or deletes any existing Lead/legacy record, never auto-merges duplicates.
 * Retention caveat: Meta only serves leads through the API for a limited window (~90 days);
 * older leads must come from the CSV export.
 */
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { normalizePhone } from '../lib/leads';
import { csvToMetaLeads, decodeMetaCsv, META_LEAD_MODEL, parseCsv, type MetaGraphLead } from '../lib/metaLeads';
import { listFormLeads, listPageForms, readMetaConfig, type MetaConfig } from '../lib/metaGraph';
import { analyzeMetaLeads, type ExistingCrmIndex } from '../services/leads/metaLeadImport.service';

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);

async function loadLeads(): Promise<MetaGraphLead[]> {
  const source = arg('source');
  if (source === 'csv') {
    const file = arg('csv');
    if (!file) throw new Error('--csv=<path> is required with --source=csv');
    return csvToMetaLeads(parseCsv(decodeMetaCsv(readFileSync(file))));
  }
  if (source === 'api') {
    const cfg = readMetaConfig();
    if (cfg.missing.length || !cfg.pageId) throw new Error(`Missing Meta configuration: ${[...cfg.missing, ...(cfg.pageId ? [] : ['META_PAGE_ID'])].join(', ')}`);
    const full = cfg as MetaConfig;
    const forms = await listPageForms(full.pageId!, full);
    const leads: MetaGraphLead[] = [];
    for (const form of forms) for (const lead of await listFormLeads(form.id, full)) leads.push({ ...lead, form_id: lead.form_id ?? form.id, form_name: form.name });
    return leads;
  }
  throw new Error('Usage: --source=api | --source=csv --csv=<file> [--execute]');
}

async function existingIndex(): Promise<ExistingCrmIndex> {
  const rows = await mongoose.connection.collection('leads').find({}, { projection: { phoneNormalized: 1, email: 1, legacyRef: 1 } }).toArray();
  const idx: ExistingCrmIndex = { metaLeadIds: new Set(), phones: new Set(), emails: new Set() };
  for (const r of rows) {
    if (r.legacyRef?.model === META_LEAD_MODEL) idx.metaLeadIds.add(String(r.legacyRef.id));
    const p = normalizePhone(r.phoneNormalized); if (p) idx.phones.add(p);
    if (r.email) idx.emails.add(String(r.email).toLowerCase());
  }
  return idx;
}

async function main() {
  try { process.loadEnvFile('.env.local'); } catch { /* env may already be set */ }
  const execute = process.argv.includes('--execute');
  if (!execute) { mongoose.set('autoIndex', false); mongoose.set('autoCreate', false); }
  const leads = await loadLeads();
  await connectDB();
  const analysis = analyzeMetaLeads(leads, await existingIndex());
  const { payloads, createdAt, ...summary } = analysis;
  console.log('META HISTORICAL IMPORT', execute ? '(EXECUTE)' : '(DRY RUN - read-only)');
  console.log(JSON.stringify(summary, null, 2));
  if (!execute) { console.log('Nothing written. Review, then ask the owner to authorise --execute.'); return; }

  const [{ Lead }, { captureLead }] = await Promise.all([import('../models/Lead'), import('../services/leads/lead.service')]);
  let created = 0;
  for (let i = 0; i < payloads.length; i++) {
    const result = await captureLead(payloads[i], 'meta-import', { allowMeta: true, skipDuplicateCheck: true });
    if (result.ok && result.value.created) {
      created++;
      const at = createdAt[i];
      if (at) await Lead.collection.updateOne({ _id: result.value.lead._id }, { $set: { createdAt: at, updatedAt: at } });
    }
  }
  console.log(`EXECUTED. created=${created}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(e => { console.error((e as Error).message.slice(0, 200)); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}

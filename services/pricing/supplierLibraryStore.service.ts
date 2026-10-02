import { mkdir, readdir, readFile, open, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { uuid, boundedText, option, strictObject } from '../../lib/internalValidation';
import { VERIFICATION_STATES, type Supplier, type SupplierInput, type SupplierRate, type SupplierRateInput, type Revision } from '../../models/SupplierLibrary';
import { validateSupplier, validateRate } from './supplierLibrary.service';

export const SUPPLIER_LIBRARY_DIRECTORY = join(process.cwd(), '.local-journey-costing', 'supplier-library');
type Row = Supplier | SupplierRate;
type Kind = 'supplier' | 'rate';
export interface Library { suppliers: Supplier[]; rates: SupplierRate[]; supplierHistory: Supplier[]; rateHistory: SupplierRate[] }
export const latestRevisions = <T extends Revision>(rows: T[]) => rows.filter(row => !rows.some(other => other.id === row.id && other.version > row.version));
export async function readLibrary(directory = SUPPLIER_LIBRARY_DIRECTORY): Promise<Library> {
  let names: string[]; try { names = await readdir(directory); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { suppliers: [], rates: [], supplierHistory: [], rateHistory: [] }; throw e; }
  const suppliers: Supplier[] = []; const rates: SupplierRate[] = [];
  for (const name of names.filter(n => /^(supplier|rate)-[a-f\d-]{36}-\d+\.json$/.test(n))) {
    const row = JSON.parse(await readFile(join(directory, name), 'utf8'));
    if (name.startsWith('supplier-')) { validateSupplier(row.input); suppliers.push(row); } else { validateRate(row.input); rates.push(row); }
  }
  return { suppliers: latestRevisions(suppliers), rates: latestRevisions(rates), supplierHistory: suppliers, rateHistory: rates };
}
export function validatePrevious(value: unknown): asserts value is { id: string; version: number } | null {
  if (value === null) return; strictObject(value, ['id', 'version'], 'previous revision'); uuid(value.id);
  if (!Number.isSafeInteger(value.version) || Number(value.version) < 1) throw new Error('Invalid revision version');
}
function previousRow<T extends Revision>(rows: T[], previous: { id: string; version: number } | null) {
  validatePrevious(previous); if (!previous) return null;
  const old = rows.find(row => row.id === previous.id); if (!old || old.version !== previous.version) throw new Error('Revision conflict: reload latest'); return old;
}
async function mutate<T extends Row>(kind: Kind, operation: (library: Library) => T, directory: string): Promise<T> {
  await mkdir(directory, { recursive: true, mode: 0o700 }); const lock = join(directory, '.write-lock');
  let handle; try { handle = await open(lock, 'wx'); } catch { throw new Error('Library busy; retry'); }
  try { const row = operation(await readLibrary(directory)); await writeFile(join(directory, `${kind}-${row.id}-${row.version}.json`), JSON.stringify(row, null, 2), { flag: 'wx', mode: 0o600 }); return row; }
  finally { await handle.close(); await unlink(lock); }
}
function revision(old: Revision | null): Revision { const now = new Date().toISOString(); return { id: old?.id ?? randomUUID(), version: (old?.version ?? 0) + 1, parentVersion: old?.version ?? null, createdAt: old?.createdAt ?? now, updatedAt: now }; }
export async function saveSupplier(input: SupplierInput, previous: { id: string; version: number } | null, directory = SUPPLIER_LIBRARY_DIRECTORY) {
  validateSupplier(input); validatePrevious(previous);
  return mutate('supplier', library => { const old = previousRow(library.suppliers, previous);
    // Identity/contact/service-area edits invalidate old verification. Status-only deactivation retains history.
    const identityChanged = old && JSON.stringify({ ...old.input, status: '' }) !== JSON.stringify({ ...input, status: '' });
    return { ...revision(old), input: structuredClone(input), verificationStatus: identityChanged ? 'UNVERIFIED' : old?.verificationStatus ?? 'UNVERIFIED', verifiedAt: identityChanged ? null : old?.verifiedAt ?? null, verificationNotes: identityChanged ? '' : old?.verificationNotes ?? '' };
  }, directory);
}
export async function verifySupplier(previous: { id: string; version: number }, status: Supplier['verificationStatus'], notes: string, confirmation: unknown, directory = SUPPLIER_LIBRARY_DIRECTORY) {
  validatePrevious(previous); option(status, VERIFICATION_STATES, 'verification'); boundedText(notes, 'verification notes');
  if (status === 'VERIFIED' && (confirmation !== `VERIFY ${previous.id}` || !notes.trim())) throw new Error('Explicit verification acknowledgement and notes required');
  return mutate('supplier', library => { const old = previousRow(library.suppliers, previous); if (!old) throw new Error('Supplier not found'); return { ...old, ...revision(old), verificationStatus: status, verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null, verificationNotes: notes }; }, directory);
}
export async function saveRate(input: SupplierRateInput, previous: { id: string; version: number } | null, directory = SUPPLIER_LIBRARY_DIRECTORY) {
  validateRate(input); validatePrevious(previous);
  return mutate('rate', library => { const old = previousRow(library.rates, previous);
    if (!library.suppliers.some(row => row.id === input.supplierId && row.input.status !== 'INACTIVE')) throw new Error('Choose an existing non-inactive supplier');
    if (old && (old.input.supplierId !== input.supplierId || old.input.category !== input.category)) throw new Error('Cannot change supplier/category on an existing rate; create a new rate');
    return { ...revision(old), input: structuredClone(input) };
  }, directory);
}
/** Resolve historical provenance without ever refreshing the financial snapshot to a newer rate. */
export async function assertAuthoritativeSnapshots(input: import('../../models/JourneyCosting').CostingInput, directory = SUPPLIER_LIBRARY_DIRECTORY) {
  const lines = Object.values(input).filter(Array.isArray).flat() as import('../../models/JourneyCosting').CostLine[];
  if (!lines.some(line => line.supplierRateSnapshot)) return;
  const library = await readLibrary(directory);
  for (const line of lines) { const s = line.supplierRateSnapshot; if (!s) continue;
    const rate = library.rateHistory.find(r => r.id === s.supplierRateId && r.version === s.supplierRateRevision);
    if (!rate || JSON.stringify(rate.input) !== JSON.stringify(s.snapshotRate) || rate.input.supplierId !== s.supplierId) throw new Error('Unknown or altered supplier rate snapshot');
    if (!library.supplierHistory.some(supplier => supplier.id === s.supplierId && supplier.input.name === s.supplierName && supplier.input.dataClassification === s.supplierDataClassification)) throw new Error('Supplier snapshot identity mismatch');
  }
}

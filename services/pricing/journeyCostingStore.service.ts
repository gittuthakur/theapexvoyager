import { mkdir, readFile, readdir, writeFile, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { COSTING_STATUSES, type JourneyCosting, type CostingInput, type JourneyContext, type CostingStatus } from '../../models/JourneyCosting';
import { calculateJourneyCosting, validateCosting } from './journeyCosting.service';

export const COSTING_STORE_DIRECTORY = join(process.cwd(), '.local-journey-costing');
export async function listCostings(directory = COSTING_STORE_DIRECTORY): Promise<JourneyCosting[]> {
  let names: string[];
  try { names = await readdir(directory); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
  return Promise.all(names.filter(name => /^[a-f\d-]{36}-\d+\.json$/.test(name)).map(async name => JSON.parse(await readFile(join(directory, name), 'utf8')) as JourneyCosting));
}
export function approvedPricePreview(record: JourneyCosting, journey: JourneyContext, confirmation: unknown) {
  if (record.status !== 'OWNER_APPROVED' || confirmation !== `APPLY ${journey.journeySlug}`) throw new Error('Owner-approved costing and explicit confirmation required');
  if (journey.status !== 'draft') throw new Error('Published Journey price protected');
  if (record.input.journeyId !== journey.journeyId || record.input.journeySlug !== journey.journeySlug || JSON.stringify(record.journeyContext) !== JSON.stringify(journey)) throw new Error('Journey source conflict; re-review costing');
  const calculation = calculateJourneyCosting(record.input);
  if (calculation.reviewBlockers.length || calculation.recommendedStartingPrice <= 0) throw new Error('Current review/expiry blockers prevent price application');
  // Construct only the one allowed field. Never spread a client payload into a Journey update.
  return { mode: 'PREVIEW_ONLY', executionEnabled: false, journeyId: journey.journeyId, expectedPrice: journey.price, set: { price: calculation.recommendedStartingPrice }, protectedFields: ['status', 'slug', 'duration', 'itinerary'], message: 'Phase 14 does not execute Journey updates. Approval is not publication.' };
}
export async function saveCosting(input: CostingInput, journey: JourneyContext, previous: { id: string; version: number } | null, directory = COSTING_STORE_DIRECTORY) {
  validateCosting(input);
  if (input.journeyId !== journey.journeyId || input.journeySlug !== journey.journeySlug) throw new Error('Journey identity mismatch');
  return mutate(directory, async rows => {
    const old = previous ? latest(rows, previous) : null;
    if (old && old.input.journeyId !== input.journeyId) throw new Error('Cannot change Journey of an existing scenario');
    const now = new Date().toISOString();
    return { id: old?.id ?? randomUUID(), parentId: old ? `${old.id}:${old.version}` : null, version: (old?.version ?? 0) + 1, createdAt: old?.createdAt ?? now, updatedAt: now,
      status: 'DRAFT', approvedBy: null, approvedAt: null, input, journeyContext: journey, calculation: calculateJourneyCosting(input) } as JourneyCosting;
  });
}
function latest(rows: JourneyCosting[], previous: { id: string; version: number }) {
  const old = rows.filter(row => row.id === previous.id).sort((a, b) => b.version - a.version)[0];
  if (!old || old.version !== previous.version) throw new Error('Revision conflict: reload latest version');
  return old;
}
export async function changeCostingStatus(previous: { id: string; version: number }, status: CostingStatus, reviewer: string, confirm: boolean, directory = COSTING_STORE_DIRECTORY) {
  if (!COSTING_STATUSES.includes(status) || status === 'DRAFT') throw new Error('Invalid review status');
  return mutate(directory, async rows => {
    const old = latest(rows, previous); const calculation = calculateJourneyCosting(old.input);
    if (status === 'OWNER_APPROVED' && (old.status !== 'READY_FOR_OWNER_REVIEW' || !confirm || !reviewer.trim() || reviewer.length > 100)) throw new Error('Explicit owner review acknowledgement required');
    if (['READY_FOR_OWNER_REVIEW', 'OWNER_APPROVED'].includes(status) && calculation.reviewBlockers.length) throw new Error(`Review blocked: ${calculation.reviewBlockers.join('; ')}`);
    if (old.status === 'OWNER_APPROVED') throw new Error('Approved revision is immutable; save a new draft revision');
    return { ...old, parentId: `${old.id}:${old.version}`, version: old.version + 1, updatedAt: new Date().toISOString(), status, calculation,
      approvedBy: status === 'OWNER_APPROVED' ? reviewer.trim() : null, approvedAt: status === 'OWNER_APPROVED' ? new Date().toISOString() : null };
  });
}
async function mutate(directory: string, operation: (rows: JourneyCosting[]) => Promise<JourneyCosting>) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const lock = join(directory, '.write-lock');
  let handle;
  try { handle = await open(lock, 'wx'); } catch { throw new Error('Costing store busy; retry after the current save completes'); }
  try {
    const record = await operation(await listCostings(directory));
    await writeFile(join(directory, `${record.id}-${record.version}.json`), JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
    return record;
  } finally { await handle.close(); await unlink(lock); }
}

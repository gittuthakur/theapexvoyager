/**
 * C4-B2-2 Stage A — MongoDB implementation of the BudgetStore contract (lib/googleApiBudget.ts). DARK: nothing imports this module
 * yet, importing it does nothing (no connection is opened, no model is touched, no collection or index is created), and it is only ever
 * used if a later, owner-approved stage constructs a store with `createMongoBudgetStore()` and connects it to the runtime.
 *
 * ATOMIC RESERVATION (one document per bucket per UTC month; see models/GoogleApiBudget.ts):
 *
 *   1. Pre-check, no database: an `amount` above the daily or monthly limit can never fit, so it is `exhausted` at once. This also
 *      keeps a limit of 0 absolute.
 *   2. Ensure the month's document exists: an idempotent upsert with `$setOnInsert`, done at most once per instance per document and
 *      remembered in memory. A duplicate-key error (another instance won the creation race) means "it exists", so it is ignored.
 *   3. ONE conditional `findOneAndUpdate` (never an upsert): it matches only while `total + amount <= monthlyLimit` AND
 *      `days.<day> + amount <= dailyLimit`, and then increments BOTH counters in the same single-document operation. A single-document
 *      update is atomic on the server, so concurrent requests on any number of serverless instances can never exceed a limit, and a
 *      refusal changes nothing (all or nothing).
 *   4. No match (`null`) means exhausted, or the document is missing. One cheap read tells them apart: counts above a limit are
 *      classified (daily first, as the core expects); a missing document is re-ensured and the update retried ONCE; anything else
 *      is reported as a store failure rather than guessed.
 *
 * Shadow mode passes MAX_SAFE_INTEGER limits, so step 3 always matches: exactly one write per counted request.
 *
 * Errors: every failure becomes a BudgetStoreError whose message is a fixed code. The underlying error (which could carry a
 * connection string or other sensitive detail) is never copied, wrapped or logged. The module never logs.
 * Connections: it reuses the app's existing cached connection through `connectDB()`; it opens no pool of its own.
 */
import { connectDB } from '@/lib/mongodb';
import { GoogleApiBudget, budgetDocumentId, budgetExpiresAt, BUDGET_MONTH_PATTERN } from '@/models/GoogleApiBudget';
import { BUDGET_BUCKETS, type BudgetBucket, type BudgetStore, type StoreReserveOutcome, type StoreReserveRequest } from '@/lib/googleApiBudget';

export type BudgetStoreErrorCode = 'invalid-request' | 'connect-failed' | 'store-operation-failed' | 'invalid-document' | 'document-unavailable';

/** The only error this store throws. Its message is the code itself, so it can never contain anything sensitive. */
export class BudgetStoreError extends Error {
  readonly code: BudgetStoreErrorCode;
  constructor(code: BudgetStoreErrorCode) {
    super(code);
    this.name = 'BudgetStoreError';
    this.code = code;
  }
}

/** The small slice of the Mongoose model the store uses (so tests can supply a stand-in). */
export interface BudgetModelLike {
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>): PromiseLike<unknown>;
  findOneAndUpdate(filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>): { lean(): PromiseLike<unknown> };
  findOne(filter: Record<string, unknown>, projection: Record<string, unknown>, options?: Record<string, unknown>): { lean(): PromiseLike<unknown> };
}

export interface MongoBudgetStoreOptions {
  /** Defaults to the real model. */
  model?: BudgetModelLike;
  /** Defaults to the app's cached `connectDB()`. */
  connect?: () => Promise<unknown>;
  /** Server-side time limit for each database operation, in ms. Clamped to 20 to 5,000; default 200. */
  maxTimeMs?: number;
}

export const DEFAULT_STORE_MAX_TIME_MS = 200;
const MAX_ENSURED_REMEMBERED = 64;
const DAY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DUPLICATE_KEY = 11000;

function clampMaxTime(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_STORE_MAX_TIME_MS;
  return Math.min(5000, Math.max(20, Math.round(value)));
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === DUPLICATE_KEY;
}

function validate(request: StoreReserveRequest): void {
  const ok =
    request !== null &&
    typeof request === 'object' &&
    (BUDGET_BUCKETS as readonly string[]).includes(request.bucket) &&
    typeof request.month === 'string' &&
    BUDGET_MONTH_PATTERN.test(request.month) &&
    typeof request.day === 'string' &&
    DAY_PATTERN.test(request.day) &&
    request.day.startsWith(`${request.month}-`) &&
    Number.isSafeInteger(request.amount) &&
    request.amount >= 1 &&
    isLimit(request.dailyLimit) &&
    isLimit(request.monthlyLimit);
  if (!ok) throw new BudgetStoreError('invalid-request');
}

export function createMongoBudgetStore(options: MongoBudgetStoreOptions = {}): BudgetStore {
  const model = options.model ?? (GoogleApiBudget as unknown as BudgetModelLike);
  const connect = options.connect ?? (() => connectDB());
  const maxTimeMS = clampMaxTime(options.maxTimeMs);
  // Documents this instance has already ensured. Bounded, in memory only, and purely an optimisation: forgetting an entry just
  // repeats the idempotent upsert once.
  const ensured = new Set<string>();

  async function ensure(id: string, bucket: BudgetBucket, month: string): Promise<void> {
    if (ensured.has(id)) return;
    try {
      await model.updateOne({ _id: id }, { $setOnInsert: { bucket, month, total: 0, expiresAt: budgetExpiresAt(month) } }, { upsert: true, maxTimeMS });
    } catch (error) {
      // Another instance created it first: that is success, not failure.
      if (!isDuplicateKey(error)) throw new BudgetStoreError('store-operation-failed');
    }
    if (ensured.size >= MAX_ENSURED_REMEMBERED) ensured.clear();
    ensured.add(id);
  }

  async function tryReserve(request: StoreReserveRequest): Promise<StoreReserveOutcome> {
    validate(request);
    const { bucket, day, month, amount, dailyLimit, monthlyLimit } = request;

    // 1. Pre-check: it can never fit, so nothing is written (and a limit of 0 stays absolute).
    if (amount > dailyLimit) return { kind: 'exhausted', scope: 'daily' };
    if (amount > monthlyLimit) return { kind: 'exhausted', scope: 'monthly' };

    try {
      await connect();
    } catch {
      throw new BudgetStoreError('connect-failed');
    }

    const id = budgetDocumentId(bucket, month);
    const dayPath = `days.${day}`;
    const filter = {
      _id: id,
      $expr: {
        $and: [
          { $lte: [{ $add: [{ $ifNull: ['$total', 0] }, amount] }, monthlyLimit] },
          { $lte: [{ $add: [{ $ifNull: [`$${dayPath}`, 0] }, amount] }, dailyLimit] }
        ]
      }
    };
    const update = { $inc: { total: amount, [dayPath]: amount } };
    const updateOptions = { returnDocument: 'after', upsert: false, projection: { total: 1, [dayPath]: 1 }, maxTimeMS };

    // At most two passes: the second exists only to recover from a document that was missing.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await ensure(id, bucket, month);

        const updated = (await model.findOneAndUpdate(filter, update, updateOptions).lean()) as { total?: unknown; days?: Record<string, unknown> } | null;
        if (updated) {
          const dayCount = updated.days?.[day];
          if (!isCount(updated.total) || !isCount(dayCount)) throw new BudgetStoreError('invalid-document');
          return { kind: 'reserved', dayCount, monthCount: updated.total };
        }

        // No match: exhausted, or the document is missing. One read tells them apart.
        const current = (await model.findOne({ _id: id }, { total: 1, [dayPath]: 1 }, { maxTimeMS }).lean()) as { total?: unknown; days?: Record<string, unknown> } | null;
        if (!current) {
          ensured.delete(id); // forget it, so the next pass creates it again
          continue;
        }
        const monthCount = current.total ?? 0;
        const dayCount = current.days?.[day] ?? 0;
        if (!isCount(monthCount) || !isCount(dayCount)) throw new BudgetStoreError('invalid-document');
        if (dayCount + amount > dailyLimit) return { kind: 'exhausted', scope: 'daily' };
        if (monthCount + amount > monthlyLimit) return { kind: 'exhausted', scope: 'monthly' };
        // Counters only ever grow, so a refused update cannot now fit: this state means the document is not what we expect.
        throw new BudgetStoreError('invalid-document');
      } catch (error) {
        if (error instanceof BudgetStoreError) throw error;
        // The underlying error is dropped on purpose: it could contain a connection string or other sensitive detail.
        throw new BudgetStoreError('store-operation-failed');
      }
    }
    throw new BudgetStoreError('document-unavailable');
  }

  return { tryReserve };
}

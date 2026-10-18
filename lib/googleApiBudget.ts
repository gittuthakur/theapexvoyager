/**
 * C4-B2-1 — Google Places shared request budget: the CORE. Isolated and DARK: no runtime Google caller imports it, it creates no
 * MongoDB model or collection, and it reads no environment itself (every input is passed in).
 *
 * What it is: a small, provider-independent contract for "may I spend one more Google request from this billing bucket right now?".
 *
 *   - Four buckets, one per billing class (visitor Text Search, scheduled-cron Text Search, Place Details metadata, Photo Media), so
 *     one traffic source cannot use up another's allowance. Limits are counts of REQUESTS, set by the owner; no prices live here.
 *   - A daily AND a monthly limit per bucket, in UTC.
 *   - The decision is made by a BudgetStore that must reserve ATOMICALLY: check both limits and add to both counters in one step, or
 *     change nothing. This module never does a separate read-then-write, so it cannot overshoot under concurrency or across instances
 *     (a future MongoDB store would implement the contract with one conditional update).
 *   - Modes (lib/googleApiBudgetMode.ts): `off` (default; touches nothing), `shadow` (counts and reports, never blocks, never fails the
 *     caller), `enforce` (blocks on exhaustion, a missing limit, an invalid request or ANY store problem: fail closed).
 *   - Results are explicit: `allowed`, `blocked`, or `store-error`. A result carries only enum values and numbers, never a store error
 *     message, credential, URL, Place ID, photo name or query text, so it is safe to log.
 */
import type { GoogleApiBudgetMode } from '@/lib/googleApiBudgetMode';

export const BUDGET_BUCKETS = ['text-search-visitor', 'text-search-cron', 'place-details-metadata', 'photo-media'] as const;
export type BudgetBucket = (typeof BUDGET_BUCKETS)[number];

/** What each bucket stands for (billing class, not a price). Documentation only. */
export const BUDGET_BUCKET_DESCRIPTIONS: Readonly<Record<BudgetBucket, string>> = {
  'text-search-visitor': 'Places API (New) Text Search triggered by a visitor request',
  'text-search-cron': 'Places API (New) Text Search made by the scheduled stays refresh',
  'place-details-metadata': 'Places API (New) Place Details (photo metadata)',
  'photo-media': 'Places API (New) photo media request'
};

export interface BudgetLimits {
  /** Requests allowed per UTC day. Must be a non-negative integer. `undefined` means "not configured". */
  daily?: number;
  /** Requests allowed per UTC month. Must be a non-negative integer. `undefined` means "not configured". */
  monthly?: number;
}
export type BudgetLimitsConfig = Partial<Record<BudgetBucket, BudgetLimits>>;

export interface BudgetPeriods {
  /** `YYYY-MM-DD` (UTC). */
  day: string;
  /** `YYYY-MM` (UTC). */
  month: string;
}

/** The UTC day and month a moment falls in. Returns null for an invalid date. */
export function budgetPeriods(moment: Date): BudgetPeriods | null {
  const time = moment instanceof Date ? moment.getTime() : Number.NaN;
  if (!Number.isFinite(time)) return null;
  const iso = new Date(time).toISOString(); // always UTC, e.g. 2026-10-18T08:03:06.528Z
  return { day: iso.slice(0, 10), month: iso.slice(0, 7) };
}

// ---- store contract -----------------------------------------------------------------------------------------------------------

export interface StoreReserveRequest {
  bucket: BudgetBucket;
  day: string;
  month: string;
  /** Positive integer. */
  amount: number;
  /** A non-negative integer, or Number.MAX_SAFE_INTEGER when the caller wants to count without limiting. */
  dailyLimit: number;
  monthlyLimit: number;
}

export type StoreReserveOutcome =
  | { kind: 'reserved'; dayCount: number; monthCount: number }
  | { kind: 'exhausted'; scope: 'daily' | 'monthly' };

/**
 * ATOMIC CONTRACT. `tryReserve` must, as one indivisible step: check `dayCount + amount <= dailyLimit` and
 * `monthCount + amount <= monthlyLimit`; if both hold, add `amount` to both counters and return `reserved` with the NEW counts;
 * otherwise change NOTHING and return `exhausted` (naming the daily limit first if both fail). It may reject/throw on any failure.
 */
export interface BudgetStore {
  tryReserve(request: StoreReserveRequest): Promise<StoreReserveOutcome>;
}

// ---- results ------------------------------------------------------------------------------------------------------------------

export type BudgetBlockReason = 'daily-limit' | 'monthly-limit' | 'limit-missing' | 'invalid-request';
export type BudgetStoreErrorReason = 'store-failed' | 'store-timeout' | 'invalid-store-response';

export interface BudgetUsage {
  day: number;
  month: number;
}

export type BudgetDecision =
  | {
      status: 'allowed';
      allowed: true;
      bucket: BudgetBucket | null;
      mode: GoogleApiBudgetMode;
      /** True when the store recorded this request. False in `off`, and in `shadow` when it could not be recorded. */
      counted: boolean;
      /** Counts after this request, when recorded. */
      usage?: BudgetUsage;
      /** `shadow` only: true when `enforce` mode would have blocked this request. */
      wouldHaveBlocked?: boolean;
    }
  | { status: 'blocked'; allowed: false; bucket: BudgetBucket | null; mode: 'enforce'; reason: BudgetBlockReason }
  | {
      status: 'store-error';
      /** `enforce`: false (fail closed). `shadow`: true (monitoring problems never affect the caller). */
      allowed: boolean;
      bucket: BudgetBucket | null;
      mode: 'shadow' | 'enforce';
      reason: BudgetStoreErrorReason;
    };

/** One safe line for a log: enum values and numbers only. */
export function describeBudgetDecision(decision: BudgetDecision): string {
  const parts = [`bucket=${decision.bucket ?? 'invalid'}`, `mode=${decision.mode}`, `status=${decision.status}`, `allowed=${decision.allowed}`];
  if (decision.status === 'blocked' || decision.status === 'store-error') parts.push(`reason=${decision.reason}`);
  if (decision.status === 'allowed') {
    parts.push(`counted=${decision.counted}`);
    if (decision.wouldHaveBlocked !== undefined) parts.push(`wouldHaveBlocked=${decision.wouldHaveBlocked}`);
    if (decision.usage) parts.push(`day=${decision.usage.day}`, `month=${decision.usage.month}`);
  }
  return `[google-budget] ${parts.join(' ')}`;
}

// ---- the budget ---------------------------------------------------------------------------------------------------------------

export const DEFAULT_STORE_TIMEOUT_MS = 250;
export const MIN_STORE_TIMEOUT_MS = 50;
export const MAX_STORE_TIMEOUT_MS = 5000;
export const MAX_RESERVE_AMOUNT = 1000;

export interface GoogleApiBudgetOptions {
  mode: GoogleApiBudgetMode;
  limits: BudgetLimitsConfig;
  /** Required for `shadow` and `enforce`; never touched in `off`. */
  store?: BudgetStore;
  /** Injectable clock (UTC periods are derived from it). Defaults to the current time. */
  now?: () => Date;
  /** How long to wait for the store before treating it as failed. Clamped to 50 to 5,000 ms; default 250. */
  storeTimeoutMs?: number;
}

export interface GoogleApiBudget {
  readonly mode: GoogleApiBudgetMode;
  reserve(bucket: BudgetBucket, amount?: number): Promise<BudgetDecision>;
}

function isLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isBucket(value: unknown): value is BudgetBucket {
  return typeof value === 'string' && (BUDGET_BUCKETS as readonly string[]).includes(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function clampStoreTimeout(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_STORE_TIMEOUT_MS;
  return Math.min(MAX_STORE_TIMEOUT_MS, Math.max(MIN_STORE_TIMEOUT_MS, Math.round(value)));
}

class StoreTimeout extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new StoreTimeout()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

export function createGoogleApiBudget(options: GoogleApiBudgetOptions): GoogleApiBudget {
  const mode: GoogleApiBudgetMode = options.mode === 'shadow' || options.mode === 'enforce' ? options.mode : 'off';
  const now = options.now ?? (() => new Date());
  const timeoutMs = clampStoreTimeout(options.storeTimeoutMs);

  async function reserve(bucketInput: BudgetBucket, amountInput: number = 1): Promise<BudgetDecision> {
    // OFF: touch nothing (no store, no clock, no counting). This is today's behaviour.
    if (mode === 'off') return { status: 'allowed', allowed: true, bucket: isBucket(bucketInput) ? bucketInput : null, mode, counted: false };

    const bucket = isBucket(bucketInput) ? bucketInput : null;
    const periods = (() => {
      try {
        return budgetPeriods(now());
      } catch {
        return null;
      }
    })();
    const validRequest = bucket !== null && Number.isSafeInteger(amountInput) && amountInput >= 1 && amountInput <= MAX_RESERVE_AMOUNT && periods !== null;
    if (!validRequest) {
      return mode === 'enforce'
        ? { status: 'blocked', allowed: false, bucket, mode, reason: 'invalid-request' }
        : { status: 'allowed', allowed: true, bucket, mode, counted: false };
    }

    const configured = options.limits?.[bucket];
    const dailyOk = isLimit(configured?.daily);
    const monthlyOk = isLimit(configured?.monthly);

    // ENFORCE needs BOTH limits for the bucket. A missing or malformed limit never means "unlimited": it blocks.
    if (mode === 'enforce' && (!dailyOk || !monthlyOk)) return { status: 'blocked', allowed: false, bucket, mode, reason: 'limit-missing' };

    if (!options.store) {
      return mode === 'enforce'
        ? { status: 'store-error', allowed: false, bucket, mode, reason: 'store-failed' }
        : { status: 'allowed', allowed: true, bucket, mode, counted: false };
    }

    const dailyLimit = dailyOk ? (configured!.daily as number) : Number.MAX_SAFE_INTEGER;
    const monthlyLimit = monthlyOk ? (configured!.monthly as number) : Number.MAX_SAFE_INTEGER;
    // SHADOW counts without limiting, so usage keeps accumulating past a limit; the comparison below reports what enforce would do.
    const request: StoreReserveRequest =
      mode === 'enforce'
        ? { bucket, day: periods.day, month: periods.month, amount: amountInput, dailyLimit, monthlyLimit }
        : { bucket, day: periods.day, month: periods.month, amount: amountInput, dailyLimit: Number.MAX_SAFE_INTEGER, monthlyLimit: Number.MAX_SAFE_INTEGER };

    let outcome: StoreReserveOutcome;
    try {
      outcome = await withTimeout(Promise.resolve().then(() => options.store!.tryReserve(request)), timeoutMs);
    } catch (error) {
      // The error text is deliberately discarded: it could carry a connection string or other sensitive detail.
      const reason: BudgetStoreErrorReason = error instanceof StoreTimeout ? 'store-timeout' : 'store-failed';
      return { status: 'store-error', allowed: mode !== 'enforce', bucket, mode, reason };
    }

    const malformed = (): BudgetDecision => ({ status: 'store-error', allowed: mode !== 'enforce', bucket, mode, reason: 'invalid-store-response' });
    if (outcome === null || typeof outcome !== 'object') return malformed();

    if (outcome.kind === 'exhausted') {
      if (mode === 'shadow') return malformed(); // a shadow request carries no limit, so "exhausted" is not a valid answer
      if (outcome.scope !== 'daily' && outcome.scope !== 'monthly') return malformed();
      return { status: 'blocked', allowed: false, bucket, mode, reason: outcome.scope === 'daily' ? 'daily-limit' : 'monthly-limit' };
    }

    if (outcome.kind !== 'reserved' || !isCount(outcome.dayCount) || !isCount(outcome.monthCount)) return malformed();
    const usage: BudgetUsage = { day: outcome.dayCount, month: outcome.monthCount };

    if (mode === 'enforce') {
      // A store that reports counts beyond the limit it was given has broken the atomic contract: fail closed.
      if (usage.day > dailyLimit || usage.month > monthlyLimit) return malformed();
      return { status: 'allowed', allowed: true, bucket, mode, counted: true, usage };
    }

    const wouldHaveBlocked = (dailyOk && usage.day > dailyLimit) || (monthlyOk && usage.month > monthlyLimit) || !dailyOk || !monthlyOk;
    return { status: 'allowed', allowed: true, bucket, mode, counted: true, usage, wouldHaveBlocked };
  }

  return { mode, reserve };
}

// ---- configuration parsing (pure) ---------------------------------------------------------------------------------------------

const BUCKET_ENV_NAMES: Readonly<Record<BudgetBucket, string>> = {
  'text-search-visitor': 'TEXT_SEARCH_VISITOR',
  'text-search-cron': 'TEXT_SEARCH_CRON',
  'place-details-metadata': 'PLACE_DETAILS_METADATA',
  'photo-media': 'PHOTO_MEDIA'
};

export const GOOGLE_API_BUDGET_STORE_TIMEOUT_ENV = 'GOOGLE_API_BUDGET_STORE_TIMEOUT_MS';

/** The environment variable name that sets a bucket's limit, e.g. GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY. */
export function budgetLimitEnvName(bucket: BudgetBucket, period: 'daily' | 'monthly'): string {
  return `GOOGLE_API_BUDGET_${BUCKET_ENV_NAMES[bucket]}_${period === 'daily' ? 'DAILY' : 'MONTHLY'}`;
}

/** A plain non-negative integer written in digits ("0", "250"). Anything else (blank, sign, decimal, exponent, hex, text) is "not configured". */
function parseLimit(raw: string | undefined): number | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim();
  if (!/^\d{1,15}$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : undefined;
}

/** Reads every bucket's daily and monthly limit from an environment object. Unparseable values are left out, never defaulted. */
export function parseBudgetLimits(env: Record<string, string | undefined>): BudgetLimitsConfig {
  const config: BudgetLimitsConfig = {};
  for (const bucket of BUDGET_BUCKETS) {
    const daily = parseLimit(env[budgetLimitEnvName(bucket, 'daily')]);
    const monthly = parseLimit(env[budgetLimitEnvName(bucket, 'monthly')]);
    if (daily !== undefined || monthly !== undefined) config[bucket] = { ...(daily !== undefined ? { daily } : {}), ...(monthly !== undefined ? { monthly } : {}) };
  }
  return config;
}

export function parseStoreTimeoutMs(env: Record<string, string | undefined>): number {
  const raw = env[GOOGLE_API_BUDGET_STORE_TIMEOUT_ENV];
  if (typeof raw !== 'string' || !/^\d{1,6}$/.test(raw.trim())) return DEFAULT_STORE_TIMEOUT_MS;
  return clampStoreTimeout(Number(raw.trim()));
}

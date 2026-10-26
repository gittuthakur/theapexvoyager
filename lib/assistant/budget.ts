import { connectDB } from '@/lib/mongodb';
import { AiAssistantUsage } from '@/models/AiAssistantUsage';
import type { AssistantConfig } from '@/lib/assistant/config';

export type BudgetResult = { ok: true; day: string } | { ok: false; reason: 'unconfigured' | 'exhausted' | 'unavailable' };

const RETAIN_MS = 90 * 24 * 60 * 60 * 1000;

// The cap's integrity rests on the UNIQUE index on `day`: it is what stops a second document for the same day from being
// inserted when the conditional filter below no longer matches. Without it the upsert would silently insert a fresh
// counter and the daily limit could be exceeded. So the index is verified, not assumed: Model.init() waits for Mongoose's
// automatic index build (and rejects if it fails, e.g. missing privileges), and the live index list must then contain a
// unique { day: 1 } index. Only a success is remembered; any failure refuses requests (fail closed) and is retried next time.
let indexVerified: Promise<void> | undefined;

export function resetIndexCheckForTests(): void {
  indexVerified = undefined;
}

function ensureUniqueDayIndex(): Promise<void> {
  indexVerified ??= (async () => {
    await AiAssistantUsage.init();
    const indexes = (await AiAssistantUsage.collection.indexes()) as { key?: Record<string, unknown>; unique?: boolean }[];
    const found = indexes.some((index) => index.unique === true && JSON.stringify(index.key) === '{"day":1}');
    if (!found) throw new Error('The unique index on day is missing');
  })().catch((error) => {
    indexVerified = undefined;
    throw error;
  });
  return indexVerified;
}

export const utcDay = (now: Date) => now.toISOString().slice(0, 10);

/**
 * Atomically reserves ONE assistant request against today's shared MongoDB counter, before any model call.
 * Fails closed: no configured limit, an exhausted day, or any database problem all refuse the request.
 *
 * The reservation is one conditional upsert. The filter only matches today's document while it is still under the
 * limit (and, when a token limit is configured, under that too), so concurrent requests can never push the counter
 * past the limit. When the filter does not match, Mongo tries to insert a second document for the same day and the
 * unique index on `day` rejects it (E11000): that is how "exhausted" is detected. The very first request of a day can
 * also see E11000 when two inserts race; one retry resolves that, because the winner's document now exists.
 *
 * Before the first reservation in a process, the unique index on `day` is verified (see ensureUniqueDayIndex); if it cannot be
 * verified the request is refused.
 *
 * A reserved request counts even if the model call then fails: that is deliberate, so a failing upstream cannot be
 * hammered for free.
 */
export async function reserveRequest(config: Pick<AssistantConfig, 'requestLimit' | 'tokenLimit'>, now: Date = new Date()): Promise<BudgetResult> {
  const limit = config.requestLimit;
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) return { ok: false, reason: 'unconfigured' };
  const day = utcDay(now);
  const filter: Record<string, unknown> = { day, requests: { $lt: limit } };
  if (config.tokenLimit) filter.tokens = { $lt: config.tokenLimit };

  try {
    await connectDB();
    await ensureUniqueDayIndex();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const updated = await AiAssistantUsage.findOneAndUpdate(
          filter,
          { $inc: { requests: 1 }, $setOnInsert: { expireAt: new Date(now.getTime() + RETAIN_MS) } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return updated ? { ok: true, day } : { ok: false, reason: 'unavailable' };
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    return { ok: false, reason: 'exhausted' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Adds the model's reported token usage to today's counter. Best effort: a failure here never affects the reply. */
export async function recordTokens(tokens: number, now: Date = new Date()): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  try {
    await connectDB();
    await AiAssistantUsage.updateOne({ day: utcDay(now) }, { $inc: { tokens: Math.min(Math.round(tokens), 1_000_000) } });
  } catch {
    // Counting is best effort; the request limit above is the hard guard.
  }
}

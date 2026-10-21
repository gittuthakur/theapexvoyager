import { createGoogleApiBudget, describeBudgetDecision, parseBudgetLimits, parseStoreTimeoutMs, type BudgetBucket, type BudgetStore } from '@/lib/googleApiBudget';
import { googleApiBudgetMode } from '@/lib/googleApiBudgetMode';

// Lazy and shared per instance. Off mode never imports the Mongo store or touches its connection.
// Loading is inside tryReserve, so the core's unchanged timeout also bounds the lazy import.
let storePromise: Promise<BudgetStore> | undefined;
function runtimeStore(): Promise<BudgetStore> {
  if (!storePromise) {
    storePromise = import('@/lib/googleApiBudgetStore.mongo')
      .then(({ createMongoBudgetStore }) => createMongoBudgetStore())
      .catch(() => {
        storePromise = undefined;
        throw new Error('budget-store-unavailable');
      });
  }
  return storePromise;
}

interface ShadowDependencies {
  env?: () => Record<string, string | undefined>;
  store?: () => Promise<BudgetStore>;
  log?: (line: string) => void;
}

/** Internal server boundary. Call ONLY inside a cache/coalescing miss, immediately before a no-store fetch.
 * Only explicit shadow opts in. Enforce deliberately behaves as off in this stage.
 * Await accounting (bounded by the core timeout), never fire-and-forget; its decision never gates Google.
 * The callback constructs the Google timeout AFTER accounting, preserving its full upstream time allowance.
 */
export function createGoogleBudgetShadow(deps: ShadowDependencies = {}) {
  const store: BudgetStore = {
    async tryReserve(request) {
      return (await (deps.store ?? runtimeStore)()).tryReserve(request);
    }
  };
  return function withGoogleBudgetShadow<T>(bucket: BudgetBucket, outbound: () => Promise<T>): Promise<T> {
    const env = (deps.env ?? (() => process.env))();
    if (googleApiBudgetMode(env) !== 'shadow') return outbound();
    return shadowThenOutbound();

    async function shadowThenOutbound(): Promise<T> {
      try {
        const decision = await createGoogleApiBudget({
          mode: 'shadow',
          limits: parseBudgetLimits(env),
          store,
          storeTimeoutMs: parseStoreTimeoutMs(env)
        }).reserve(bucket);
        // One safe diagnostic only for an anomaly; no request context or underlying error is logged.
        if (decision.status === 'store-error' || (decision.status === 'allowed' && decision.wouldHaveBlocked)) {
          (deps.log ?? console.info)(describeBudgetDecision(decision));
        }
      } catch {
        // Monitoring and logging failures must not alter the outbound attempt.
      }
      return outbound();
    }
  };
}

export const withGoogleBudgetShadow = createGoogleBudgetShadow();

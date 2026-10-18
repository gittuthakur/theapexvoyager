/**
 * TEST-ONLY. An in-memory BudgetStore used by the unit tests of lib/googleApiBudget.ts. It must never be imported by production
 * code (a test enforces that). It implements the atomic reserve contract in one synchronous step and can inject latency, failures,
 * hangs and malformed answers so every outcome of the budget core can be exercised without a database.
 */
import type { BudgetBucket, BudgetStore, StoreReserveOutcome, StoreReserveRequest } from '@/lib/googleApiBudget';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type FakeStoreFault =
  | { type: 'throw'; error?: unknown }
  | { type: 'hang' }
  | { type: 'respond'; value: unknown };

export class InMemoryBudgetStore implements BudgetStore {
  private readonly counters = new Map<string, number>();
  private faults: FakeStoreFault[] = [];
  private permanentFault: FakeStoreFault | null = null;
  /** Every request received, in order (a copy, so tests can inspect it). */
  readonly requests: StoreReserveRequest[] = [];
  /** Simulated network latency before the atomic step, in milliseconds. */
  latencyMs = 0;

  /** The next call fails in this way. */
  failNext(fault: FakeStoreFault): void {
    this.faults.push(fault);
  }

  /** Every call fails in this way until `clearFaults`. */
  failAlways(fault: FakeStoreFault): void {
    this.permanentFault = fault;
  }

  clearFaults(): void {
    this.faults = [];
    this.permanentFault = null;
  }

  usage(bucket: BudgetBucket, day: string, month: string): { day: number; month: number } {
    return { day: this.counters.get(`${bucket}|d|${day}`) ?? 0, month: this.counters.get(`${bucket}|m|${month}`) ?? 0 };
  }

  reset(): void {
    this.counters.clear();
    this.requests.length = 0;
    this.clearFaults();
  }

  async tryReserve(request: StoreReserveRequest): Promise<StoreReserveOutcome> {
    this.requests.push({ ...request });
    const fault = this.faults.shift() ?? this.permanentFault;
    if (fault?.type === 'hang') return new Promise<StoreReserveOutcome>(() => undefined);
    if (fault?.type === 'throw') throw fault.error ?? new Error('fake store failure');
    if (fault?.type === 'respond') return fault.value as StoreReserveOutcome;

    if (this.latencyMs > 0) await sleep(Math.random() * this.latencyMs);

    // ATOMIC SECTION: no `await` between the checks and the increments, so no other reservation can interleave.
    const dayKey = `${request.bucket}|d|${request.day}`;
    const monthKey = `${request.bucket}|m|${request.month}`;
    const dayCount = this.counters.get(dayKey) ?? 0;
    const monthCount = this.counters.get(monthKey) ?? 0;
    if (dayCount + request.amount > request.dailyLimit) return { kind: 'exhausted', scope: 'daily' };
    if (monthCount + request.amount > request.monthlyLimit) return { kind: 'exhausted', scope: 'monthly' };
    this.counters.set(dayKey, dayCount + request.amount);
    this.counters.set(monthKey, monthCount + request.amount);
    return { kind: 'reserved', dayCount: dayCount + request.amount, monthCount: monthCount + request.amount };
  }
}

/**
 * A deliberately BROKEN store (read, then await, then write: a classic race). It exists only so a test can prove that the concurrency
 * tests really detect a store that violates the atomic contract.
 */
export class NonAtomicBudgetStore implements BudgetStore {
  private readonly counters = new Map<string, number>();

  usage(bucket: BudgetBucket, day: string): number {
    return this.counters.get(`${bucket}|d|${day}`) ?? 0;
  }

  async tryReserve(request: StoreReserveRequest): Promise<StoreReserveOutcome> {
    const dayKey = `${request.bucket}|d|${request.day}`;
    const monthKey = `${request.bucket}|m|${request.month}`;
    const dayCount = this.counters.get(dayKey) ?? 0;
    const monthCount = this.counters.get(monthKey) ?? 0;
    await sleep(Math.random() * 2); // another reservation can run here
    if (dayCount + request.amount > request.dailyLimit) return { kind: 'exhausted', scope: 'daily' };
    if (monthCount + request.amount > request.monthlyLimit) return { kind: 'exhausted', scope: 'monthly' };
    this.counters.set(dayKey, dayCount + request.amount);
    this.counters.set(monthKey, monthCount + request.amount);
    return { kind: 'reserved', dayCount: dayCount + request.amount, monthCount: monthCount + request.amount };
  }
}

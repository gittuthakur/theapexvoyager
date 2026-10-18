/**
 * C4-B2-2 Stage B1 — connection-isolation harness for the live MongoDB contract tests of the Google API budget store. TEST SUPPORT
 * ONLY: nothing in the application imports it, and importing it opens no connection.
 *
 * ISOLATION. The harness never touches the application's connection. It opens its OWN connection with `mongoose.createConnection`
 * (never `mongoose.connect`, never `connectDB()`), builds the real GoogleApiBudget schema as a model on THAT connection, bound to a
 * collection named for this run only (`budget_contract_<12 hex>`), and hands the store exactly that model and that connection through
 * the store's existing `model` and `connect` options. The production store file needs no change for this.
 *
 * NO IMPLICIT DDL. The connection is created with `autoIndex: false` and `autoCreate: false`, so nothing is created behind the
 * harness's back. The harness refuses to start if the unique collection already exists, and creates the collection implicitly only by
 * its first counter write.
 *
 * CLEANUP is scoped to what this run created: it deletes only the documents whose `_id` it tracked (an explicit `$in` list; never an
 * empty filter) and drops only the one TTL index it created, and only on its own collection. It never drops a database or a
 * collection. An empty `budget_contract_<id>` collection may remain; it can be deleted by hand in the scratch database.
 *
 * Failures carry only a fixed code. Connection strings, users, passwords and hosts are never put in a message.
 */
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { BUDGET_BUCKETS, type BudgetBucket, type BudgetStore, type StoreReserveOutcome, type StoreReserveRequest } from '@/lib/googleApiBudget';
import { createMongoBudgetStore, type BudgetModelLike } from '@/lib/googleApiBudgetStore.mongo';
import { GoogleApiBudgetSchema, budgetDocumentId } from '@/models/GoogleApiBudget';
import { contractCollectionName, isContractCollectionName, type ContractTarget } from '@/lib/googleApiBudgetContract.safety';

export type HarnessErrorCode =
  | 'application-connection-active'
  | 'connect-failed'
  | 'database-mismatch'
  | 'collection-mismatch'
  | 'collection-already-exists'
  | 'foreign-collection'
  | 'untracked-document';

/** The only error the harness throws. Its message is the code, so it can never contain a connection string. */
export class ContractHarnessError extends Error {
  readonly code: HarnessErrorCode;
  constructor(code: HarnessErrorCode) {
    super(code);
    this.name = 'ContractHarnessError';
    this.code = code;
  }
}

export interface NativeCollectionLike {
  /** Mongoose's collection name. */
  name: string;
  findOne(filter: Record<string, unknown>): Promise<Record<string, unknown> | null>;
  insertOne(document: Record<string, unknown>): Promise<unknown>;
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
  deleteMany(filter: Record<string, unknown>): Promise<{ deletedCount?: number }>;
  indexes(): Promise<Array<Record<string, unknown>>>;
  dropIndex(name: string): Promise<unknown>;
}

export interface ContractModel extends BudgetModelLike {
  collection: NativeCollectionLike;
  createIndexes(): Promise<unknown>;
}

/** The slice of a Mongoose connection the harness uses (so unit tests can supply a stand-in). */
export interface ContractConnection {
  /** The database name this connection is bound to. */
  name: string;
  asPromise(): Promise<unknown>;
  close(): Promise<unknown>;
  model(name: string, schema: unknown, collection: string): ContractModel;
  db: { listCollections(filter: { name: string }): { toArray(): Promise<unknown[]> } };
}

export interface HarnessDeps {
  /** Defaults to `mongoose.createConnection`, which opens a standalone connection and leaves the global one alone. */
  createConnection?: (uri: string, options: Record<string, unknown>) => ContractConnection;
  /** Defaults to the global mongoose connection's readyState. Must be 0 (disconnected) for the harness to start. */
  defaultReadyState?: () => number;
  /** Defaults to the application's cached connection holder. Must hold no connection for the harness to start. */
  applicationConnection?: () => unknown;
  /** Defaults to 12 random hex characters. */
  runId?: () => string;
}

export interface StoreFactoryOptions {
  maxTimeMs?: number;
}

export interface ContractHarness {
  readonly collectionName: string;
  readonly model: ContractModel;
  /** A real store (the production implementation) over THIS harness's connection and model. Each call is a separate instance. */
  createStore(options?: StoreFactoryOptions): BudgetStore;
  /** The raw stored document for a bucket and month, bypassing Mongoose, or null. */
  readRaw(bucket: BudgetBucket, month: string): Promise<Record<string, unknown> | null>;
  /** Inserts a document directly, bypassing Mongoose validation and defaults, and tracks it for cleanup. `_id` must be `<bucket>|<month>`. */
  insertRaw(document: Record<string, unknown> & { _id: string }): Promise<void>;
  /** Registers a document id for cleanup without creating it (for tests that write through the raw collection). */
  track(bucket: BudgetBucket, month: string): void;
  /** Deletes ONE tracked document (simulating a manually deleted counter). */
  deleteRaw(bucket: BudgetBucket, month: string): Promise<void>;
  /** Creates the declared indexes (the TTL index) on this run's collection only. */
  createIndexes(): Promise<void>;
  indexes(): Promise<Array<Record<string, unknown>>>;
  /** Removes the documents this run created so far. */
  reset(): Promise<void>;
  /** Final cleanup, then closes the harness's own connection. Safe to call more than once. */
  close(): Promise<void>;
}

const TTL_INDEX_NAME = 'expiresAt_1';
const POOL_SIZE = 20;

function applicationCache(): unknown {
  return (globalThis as { mongooseCache?: { conn?: unknown } }).mongooseCache?.conn ?? null;
}

function assertOwnCollection(model: ContractModel, expectedName: string): void {
  if (!isContractCollectionName(expectedName) || model.collection.name !== expectedName) throw new ContractHarnessError('foreign-collection');
}

function isTrackableId(id: string): boolean {
  const [bucket, month, ...rest] = id.split('|');
  return rest.length === 0 && (BUDGET_BUCKETS as readonly string[]).includes(bucket) && /^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '');
}

export async function openContractHarness(target: ContractTarget, deps: HarnessDeps = {}): Promise<ContractHarness> {
  const defaultReadyState = deps.defaultReadyState ?? (() => mongoose.connection.readyState);
  const applicationConnection = deps.applicationConnection ?? applicationCache;
  const createConnection =
    deps.createConnection ?? ((uri: string, options: Record<string, unknown>) => mongoose.createConnection(uri, options) as unknown as ContractConnection);

  // The application's own connection must be absent: this run must never share, reuse or replace it.
  if (defaultReadyState() !== 0 || applicationConnection()) throw new ContractHarnessError('application-connection-active');

  const collectionName = contractCollectionName((deps.runId ?? (() => randomBytes(6).toString('hex')))());

  const connection = createConnection(target.uri, {
    bufferCommands: false,
    autoIndex: false,
    autoCreate: false,
    maxPoolSize: POOL_SIZE,
    serverSelectionTimeoutMS: 8000,
    appName: 'apex-budget-contract-test'
  });

  async function closeQuietly(): Promise<void> {
    try {
      await connection.close();
    } catch {
      // Closing is best-effort; there is nothing safe to report.
    }
  }

  try {
    await connection.asPromise();
  } catch {
    await closeQuietly();
    throw new ContractHarnessError('connect-failed');
  }

  if (connection.name !== target.database) {
    await closeQuietly();
    throw new ContractHarnessError('database-mismatch');
  }

  const model = connection.model('GoogleApiBudget', GoogleApiBudgetSchema, collectionName);
  if (model.collection.name !== collectionName) {
    await closeQuietly();
    throw new ContractHarnessError('collection-mismatch');
  }

  try {
    const existing = await connection.db.listCollections({ name: collectionName }).toArray();
    if (existing.length > 0) {
      await closeQuietly();
      throw new ContractHarnessError('collection-already-exists');
    }
  } catch (error) {
    if (error instanceof ContractHarnessError) throw error;
    await closeQuietly();
    throw new ContractHarnessError('connect-failed');
  }

  const tracked = new Set<string>();
  let indexCreated = false;
  let closed = false;

  function track(bucket: BudgetBucket, month: string): void {
    try {
      tracked.add(budgetDocumentId(bucket, month));
    } catch {
      // An invalid request never creates a document, so there is nothing to track.
    }
  }

  async function removeTracked(): Promise<void> {
    assertOwnCollection(model, collectionName);
    if (tracked.size === 0) return;
    // An explicit `_id` list: never an empty or unrestricted filter.
    await model.collection.deleteMany({ _id: { $in: [...tracked] } });
    tracked.clear();
  }

  const harness: ContractHarness = {
    collectionName,
    model,
    createStore(options = {}) {
      const inner = createMongoBudgetStore({ model, connect: () => connection.asPromise(), maxTimeMs: options.maxTimeMs });
      return {
        tryReserve(request: StoreReserveRequest): Promise<StoreReserveOutcome> {
          if (request && typeof request === 'object') track(request.bucket, request.month);
          return inner.tryReserve(request);
        }
      };
    },
    track,
    async readRaw(bucket, month) {
      assertOwnCollection(model, collectionName);
      return model.collection.findOne({ _id: budgetDocumentId(bucket, month) });
    },
    async insertRaw(document) {
      assertOwnCollection(model, collectionName);
      if (!isTrackableId(document._id)) throw new ContractHarnessError('untracked-document');
      tracked.add(document._id);
      await model.collection.insertOne(document);
    },
    async deleteRaw(bucket, month) {
      assertOwnCollection(model, collectionName);
      const id = budgetDocumentId(bucket, month);
      if (!tracked.has(id)) throw new ContractHarnessError('untracked-document');
      await model.collection.deleteMany({ _id: id });
      tracked.delete(id);
    },
    async createIndexes() {
      assertOwnCollection(model, collectionName);
      await model.createIndexes();
      indexCreated = true;
    },
    async indexes() {
      assertOwnCollection(model, collectionName);
      return model.collection.indexes();
    },
    reset: removeTracked,
    async close() {
      if (closed) return;
      closed = true;
      try {
        await removeTracked();
        if (indexCreated) await model.collection.dropIndex(TTL_INDEX_NAME);
      } finally {
        await closeQuietly();
      }
    }
  };
  return harness;
}

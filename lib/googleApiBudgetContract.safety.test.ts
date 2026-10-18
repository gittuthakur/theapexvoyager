import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// If any code path under test ever reached the application's own connection, this would fail the test loudly.
vi.mock('@/lib/mongodb', () => ({
  connectDB: vi.fn(async () => {
    throw new Error('connectDB must never be used by the contract harness');
  })
}));

import { connectDB } from '@/lib/mongodb';
import {
  CONTRACT_COLLECTION_PATTERN,
  PROTECTED_DATABASES,
  TEST_ALLOW_WRITE_ENV,
  TEST_EXPECT_DB_ENV,
  TEST_URI_ENV,
  contractCollectionName,
  evaluateContractTarget,
  isContractCollectionName,
  parseMongoUri,
  scrubTarget,
  type ContractRefusalCode
} from './googleApiBudgetContract.safety';
import { ContractHarnessError, openContractHarness, type ContractConnection, type ContractModel, type HarnessDeps } from './googleApiBudgetContract.harness';
import type { ContractTarget } from './googleApiBudgetContract.safety';

const PASSWORD = 'p@ss:w0rd/Secret';
const GOOD_URI = `mongodb+srv://budget_tester:${encodeURIComponent(PASSWORD)}@scratch-cluster.example.mongodb.net/apex_budget_scratch?retryWrites=true&w=majority`;

function goodEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return { [TEST_URI_ENV]: GOOD_URI, [TEST_ALLOW_WRITE_ENV]: 'yes', [TEST_EXPECT_DB_ENV]: 'apex_budget_scratch', ...overrides };
}

function refusal(env: Record<string, string | undefined>): ContractRefusalCode | string {
  const result = evaluateContractTarget(env);
  return result.status === 'refuse' ? result.code : result.status;
}

describe('safety gate: skip by default', () => {
  it('skips when no test URI is set, whatever else is set', () => {
    expect(evaluateContractTarget({})).toEqual({ status: 'skip', reason: 'test-uri-not-set' });
    expect(evaluateContractTarget({ [TEST_URI_ENV]: '', [TEST_ALLOW_WRITE_ENV]: 'yes' })).toEqual({ status: 'skip', reason: 'test-uri-not-set' });
    expect(evaluateContractTarget({ [TEST_URI_ENV]: '   ', [TEST_ALLOW_WRITE_ENV]: 'yes' })).toEqual({ status: 'skip', reason: 'test-uri-not-set' });
  });

  it('never falls back to MONGODB_URI', () => {
    expect(evaluateContractTarget({ MONGODB_URI: GOOD_URI, [TEST_ALLOW_WRITE_ENV]: 'yes', [TEST_EXPECT_DB_ENV]: 'apex_budget_scratch' })).toEqual({ status: 'skip', reason: 'test-uri-not-set' });
  });

  it('skips when the write opt-in is missing or is anything other than exactly "yes"', () => {
    for (const value of [undefined, '', 'YES', 'true', '1', 'y', ' yes']) {
      expect(evaluateContractTarget(goodEnv({ [TEST_ALLOW_WRITE_ENV]: value }))).toEqual({ status: 'skip', reason: 'write-opt-in-missing' });
    }
  });

  it('is ready only when everything is explicitly supplied and safe', () => {
    const result = evaluateContractTarget(goodEnv());
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.target).toMatchObject({ database: 'apex_budget_scratch', hosts: ['scratch-cluster.example.mongodb.net'], username: 'budget_tester', password: PASSWORD });
  });
});

describe('safety gate: refusals (fail closed)', () => {
  const cases: Array<[string, Record<string, string | undefined>, ContractRefusalCode]> = [
    ['an unparseable URI', goodEnv({ [TEST_URI_ENV]: 'not a uri' }), 'uri-malformed'],
    ['a URI with spaces', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host/apex_test db' }), 'uri-malformed'],
    ['a non-mongodb scheme', goodEnv({ [TEST_URI_ENV]: 'https://u:p@host/apex_scratch' }), 'uri-scheme-unsupported'],
    ['a missing scheme', goodEnv({ [TEST_URI_ENV]: 'u:p@host/apex_scratch' }), 'uri-scheme-unsupported'],
    ['no host', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@/apex_scratch' }), 'uri-host-missing'],
    ['a bad host', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@ho$t/apex_scratch' }), 'uri-malformed'],
    ['bad percent-encoding', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:%zz@host/apex_scratch' }), 'uri-malformed'],
    ['multiple SRV hosts', goodEnv({ [TEST_URI_ENV]: 'mongodb+srv://u:p@a.example.net,b.example.net/apex_scratch' }), 'uri-malformed'],
    ['no credentials', goodEnv({ [TEST_URI_ENV]: 'mongodb://host.example.net/apex_scratch' }), 'uri-credentials-missing'],
    ['a user without a password', goodEnv({ [TEST_URI_ENV]: 'mongodb://user@host.example.net/apex_scratch' }), 'uri-credentials-missing'],
    ['an empty password', goodEnv({ [TEST_URI_ENV]: 'mongodb://user:@host.example.net/apex_scratch' }), 'uri-credentials-missing'],
    ['no database name', goodEnv({ [TEST_URI_ENV]: 'mongodb+srv://u:p@host.example.net/?retryWrites=true' }), 'uri-database-missing'],
    ['no database path at all', goodEnv({ [TEST_URI_ENV]: 'mongodb+srv://u:p@host.example.net' }), 'uri-database-missing'],
    ['an invalid database name', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/apex.scratch' }), 'uri-database-invalid'],
    ['a production database name', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/theapexvoyager', [TEST_EXPECT_DB_ENV]: 'theapexvoyager' }), 'database-protected'],
    ['a production database name in another case', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/TheApexVoyager', [TEST_EXPECT_DB_ENV]: 'TheApexVoyager' }), 'database-protected'],
    ['the admin database', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/admin', [TEST_EXPECT_DB_ENV]: 'admin' }), 'database-protected'],
    ['the local database', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/local', [TEST_EXPECT_DB_ENV]: 'local' }), 'database-protected'],
    ['a database with no scratch/test marker', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/apex_budget', [TEST_EXPECT_DB_ENV]: 'apex_budget' }), 'database-marker-missing'],
    ['a marker that is only a substring', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/latest', [TEST_EXPECT_DB_ENV]: 'latest' }), 'database-marker-missing'],
    ['a marked name that also says prod', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/prod_test', [TEST_EXPECT_DB_ENV]: 'prod_test' }), 'database-marker-missing'],
    ['a marked name that embeds the production name', goodEnv({ [TEST_URI_ENV]: 'mongodb://u:p@host.example.net/theapexvoyager_test', [TEST_EXPECT_DB_ENV]: 'theapexvoyager_test' }), 'database-marker-missing'],
    ['a missing expected-database declaration', goodEnv({ [TEST_EXPECT_DB_ENV]: undefined }), 'expected-database-missing'],
    ['an empty expected-database declaration', goodEnv({ [TEST_EXPECT_DB_ENV]: '' }), 'expected-database-missing'],
    ['a mismatched expected-database declaration', goodEnv({ [TEST_EXPECT_DB_ENV]: 'some_other_scratch' }), 'expected-database-mismatch'],
    ['a Vercel runtime', goodEnv({ VERCEL: '1' }), 'hosted-environment'],
    ['a Vercel environment', goodEnv({ VERCEL_ENV: 'preview' }), 'hosted-environment'],
    ['a production NODE_ENV', goodEnv({ NODE_ENV: 'production' }), 'production-environment']
  ];

  it.each(cases)('refuses %s', (_name, env, code) => {
    expect(refusal(env)).toBe(code);
  });

  it('never puts the URI, password, user or host in a refusal', () => {
    for (const [, env] of cases) {
      const result = evaluateContractTarget(env);
      if (result.status !== 'refuse') continue;
      const text = JSON.stringify(result);
      for (const secret of [PASSWORD, encodeURIComponent(PASSWORD), 'budget_tester', 'scratch-cluster', 'mongodb']) expect(text).not.toContain(secret);
    }
  });

  it('has every protected database name in the deny list', () => {
    expect(PROTECTED_DATABASES).toEqual(expect.arrayContaining(['theapexvoyager', 'admin', 'local', 'config']));
  });
});

describe('safety gate: production target detection (read only, never connects)', () => {
  const production = (uri: string) => goodEnv({ MONGODB_URI: uri });

  it('refuses the same host and database', () => {
    expect(refusal(production('mongodb+srv://prod_user:x@scratch-cluster.example.mongodb.net/apex_budget_scratch'))).toBe('matches-production-target');
  });

  it('refuses a shared host when the user is the same, even with a different database', () => {
    expect(refusal(production('mongodb+srv://budget_tester:x@scratch-cluster.example.mongodb.net/theapexvoyager'))).toBe('matches-production-target');
  });

  it('refuses a shared host when production has no database (MongoDB defaults it to "test") and the test database is "test"', () => {
    expect(
      refusal({ ...goodEnv({ [TEST_URI_ENV]: 'mongodb+srv://budget_tester:x@scratch-cluster.example.mongodb.net/test', [TEST_EXPECT_DB_ENV]: 'test' }), MONGODB_URI: 'mongodb+srv://prod_user:x@scratch-cluster.example.mongodb.net/?retryWrites=true' })
    ).toBe('matches-production-target');
  });

  it('refuses when any host of a multi-host production URI is shared and the database is the same', () => {
    expect(refusal(production('mongodb://prod_user:x@a.example.net:27017,scratch-cluster.example.mongodb.net:27017/apex_budget_scratch'))).toBe('matches-production-target');
  });

  it('allows a shared cluster only with a different database AND a different user', () => {
    expect(refusal(production('mongodb+srv://prod_user:x@scratch-cluster.example.mongodb.net/theapexvoyager'))).toBe('ready');
  });

  it('allows a different cluster', () => {
    expect(refusal(production('mongodb+srv://prod_user:x@prod-cluster.example.mongodb.net/theapexvoyager'))).toBe('ready');
  });

  it('refuses when a production URI is set but cannot be parsed (it cannot be ruled out)', () => {
    expect(refusal(production('garbage'))).toBe('production-target-unverifiable');
  });

  it('ignores an empty MONGODB_URI', () => {
    expect(refusal(production(''))).toBe('ready');
  });
});

describe('parseMongoUri', () => {
  it('parses an SRV URI with an encoded password', () => {
    const parsed = parseMongoUri(GOOD_URI);
    expect(parsed).toEqual({ ok: true, value: { scheme: 'mongodb+srv', username: 'budget_tester', password: PASSWORD, hosts: ['scratch-cluster.example.mongodb.net'], database: 'apex_budget_scratch' } });
  });

  it('parses multiple hosts with ports and lower-cases them', () => {
    const parsed = parseMongoUri('mongodb://u:p@A.example.net:27017,b.example.net:27018/apex_scratch?replicaSet=rs0');
    expect(parsed).toMatchObject({ ok: true, value: { hosts: ['a.example.net', 'b.example.net'], database: 'apex_scratch' } });
  });

  it('parses a URI without credentials or database and leaves them empty', () => {
    expect(parseMongoUri('mongodb://host.example.net')).toMatchObject({ ok: true, value: { username: '', password: '', database: '' } });
  });

  it('never throws on hostile input', () => {
    for (const input of ['', ' ', 'mongodb://', 'mongodb+srv://', '%', 'mongodb://u:p@h/%E0%A4%A', 'mongodb://@@@/', '://', 'mongodb://[::1]/x_test']) {
      expect(() => parseMongoUri(input)).not.toThrow();
    }
  });
});

describe('collection namespace and scrubbing', () => {
  it('accepts only budget_contract_ plus 12 hex characters', () => {
    expect(contractCollectionName('0123456789ab')).toBe('budget_contract_0123456789ab');
    for (const bad of ['', 'xyz', '0123456789AB', '0123456789abc', '0123456789a', '../places', 'placecaches']) expect(() => contractCollectionName(bad)).toThrow();
    for (const name of ['placecaches', 'googleapibudgets', 'budget_contract_', 'budget_contract_0123456789AB', 'budget_contract_0123456789ab ', undefined, null, 5]) {
      expect(isContractCollectionName(name)).toBe(false);
    }
    expect(CONTRACT_COLLECTION_PATTERN.test('budget_contract_0123456789ab')).toBe(true);
  });

  it('scrubs the URI, password, user and hosts from text', () => {
    const result = evaluateContractTarget(goodEnv());
    if (result.status !== 'ready') throw new Error('expected ready');
    const dirty = `failed ${result.target.uri} for budget_tester using ${PASSWORD} at scratch-cluster.example.mongodb.net`;
    const clean = scrubTarget(dirty, result.target);
    for (const secret of [result.target.uri, PASSWORD, 'budget_tester', 'scratch-cluster']) expect(clean).not.toContain(secret);
  });
});

// ---- harness wiring against a stand-in connection: no network, no MongoDB ---------------------------------------------------------

interface Recorded {
  connectionOptions: Record<string, unknown> | null;
  connectionUri: string | null;
  asPromiseCalls: number;
  closeCalls: number;
  models: Array<{ name: string; collection: string }>;
  deleteMany: Array<Record<string, unknown>>;
  dropIndex: string[];
  createIndexesCalls: number;
  insertOne: Array<Record<string, unknown>>;
}

function fakeDeps(options: { database?: string; existing?: unknown[]; connectError?: boolean; collectionNameOverride?: string; runId?: string } = {}): { deps: HarnessDeps; recorded: Recorded } {
  const recorded: Recorded = { connectionOptions: null, connectionUri: null, asPromiseCalls: 0, closeCalls: 0, models: [], deleteMany: [], dropIndex: [], createIndexesCalls: 0, insertOne: [] };
  const docs = new Map<string, Record<string, unknown>>();
  const deps: HarnessDeps = {
    defaultReadyState: () => 0,
    applicationConnection: () => null,
    runId: () => options.runId ?? '0123456789ab',
    createConnection(uri, connectionOptions) {
      recorded.connectionUri = uri;
      recorded.connectionOptions = connectionOptions;
      const connection: ContractConnection = {
        name: options.database ?? 'apex_budget_scratch',
        async asPromise() {
          recorded.asPromiseCalls += 1;
          if (options.connectError) throw new Error(`connect failed for ${uri}`);
          return connection;
        },
        async close() {
          recorded.closeCalls += 1;
        },
        model(name, _schema, collection) {
          recorded.models.push({ name, collection });
          const model: ContractModel = {
            collection: {
              name: options.collectionNameOverride ?? collection,
              async findOne(filter) {
                return docs.get(String(filter._id)) ?? null;
              },
              async insertOne(document) {
                recorded.insertOne.push(document);
                docs.set(String(document._id), document);
              },
              async updateOne() {
                return {};
              },
              async deleteMany(filter) {
                recorded.deleteMany.push(filter);
                const ids = typeof filter._id === 'object' && filter._id !== null ? ((filter._id as { $in?: string[] }).$in ?? []) : [String(filter._id)];
                for (const id of ids) docs.delete(id);
                return { deletedCount: ids.length };
              },
              async indexes() {
                return [{ key: { _id: 1 } }];
              },
              async dropIndex(indexName) {
                recorded.dropIndex.push(indexName);
              }
            },
            async createIndexes() {
              recorded.createIndexesCalls += 1;
            },
            updateOne: async () => ({}),
            findOneAndUpdate: (_filter, update) => ({
              lean: async () => {
                const dayPath = Object.keys((update.$inc ?? {}) as Record<string, number>).find((key) => key.startsWith('days.')) ?? 'days.2026-10-18';
                return { total: 1, days: { [dayPath.slice('days.'.length)]: 1 } };
              }
            }),
            findOne: () => ({ lean: async () => null })
          };
          return model;
        },
        db: { listCollections: () => ({ toArray: async () => options.existing ?? [] }) }
      };
      return connection;
    }
  };
  return { deps, recorded };
}

function readyTarget(): ContractTarget {
  const result = evaluateContractTarget(goodEnv());
  if (result.status !== 'ready') throw new Error('expected ready');
  return result.target;
}

describe('harness: connection isolation', () => {
  beforeEach(() => {
    vi.mocked(connectDB).mockClear();
  });

  it('opens its own standalone connection with implicit index and collection creation disabled', async () => {
    const { deps, recorded } = fakeDeps();
    const connectSpy = vi.spyOn(mongoose, 'connect');
    const harness = await openContractHarness(readyTarget(), deps);
    expect(recorded.connectionUri).toBe(readyTarget().uri);
    expect(recorded.connectionOptions).toMatchObject({ bufferCommands: false, autoIndex: false, autoCreate: false });
    expect(recorded.models).toEqual([{ name: 'GoogleApiBudget', collection: 'budget_contract_0123456789ab' }]);
    expect(harness.collectionName).toBe('budget_contract_0123456789ab');
    expect(connectSpy).not.toHaveBeenCalled();
    expect(mongoose.connection.readyState).toBe(0);
    expect(connectDB).not.toHaveBeenCalled();
    connectSpy.mockRestore();
    await harness.close();
  });

  it("refuses to start while the application's connection is live, before creating any connection", async () => {
    for (const patch of [{ defaultReadyState: () => 1 }, { applicationConnection: () => ({}) }]) {
      const { deps, recorded } = fakeDeps();
      await expect(openContractHarness(readyTarget(), { ...deps, ...patch })).rejects.toMatchObject({ code: 'application-connection-active' });
      expect(recorded.connectionUri).toBeNull();
    }
  });

  it('reports a connection failure with a fixed code and closes the connection', async () => {
    const { deps, recorded } = fakeDeps({ connectError: true });
    const error = await openContractHarness(readyTarget(), deps).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ContractHarnessError);
    expect((error as ContractHarnessError).code).toBe('connect-failed');
    expect((error as Error).message).toBe('connect-failed');
    expect(recorded.closeCalls).toBe(1);
  });

  it('refuses when the connection is bound to a different database than the validated one', async () => {
    const { deps, recorded } = fakeDeps({ database: 'theapexvoyager' });
    await expect(openContractHarness(readyTarget(), deps)).rejects.toMatchObject({ code: 'database-mismatch' });
    expect(recorded.models).toEqual([]);
    expect(recorded.closeCalls).toBe(1);
  });

  it('refuses when the model is not bound to this run’s collection', async () => {
    const { deps, recorded } = fakeDeps({ collectionNameOverride: 'placecaches' });
    await expect(openContractHarness(readyTarget(), deps)).rejects.toMatchObject({ code: 'collection-mismatch' });
    expect(recorded.closeCalls).toBe(1);
  });

  it('refuses when the unique collection already exists', async () => {
    const { deps, recorded } = fakeDeps({ existing: [{ name: 'budget_contract_0123456789ab' }] });
    await expect(openContractHarness(readyTarget(), deps)).rejects.toMatchObject({ code: 'collection-already-exists' });
    expect(recorded.closeCalls).toBe(1);
  });

  it('rejects an invalid run id', async () => {
    const { deps } = fakeDeps({ runId: '../placecaches' });
    await expect(openContractHarness(readyTarget(), deps)).rejects.toThrow();
  });

  it('gives the production store the injected model and connection, and never connectDB()', async () => {
    const { deps, recorded } = fakeDeps();
    const harness = await openContractHarness(readyTarget(), deps);
    const before = recorded.asPromiseCalls;
    const outcome = await harness.createStore().tryReserve({ bucket: 'photo-media', day: '2026-10-18', month: '2026-10', amount: 1, dailyLimit: 5, monthlyLimit: 50 });
    expect(outcome).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(recorded.asPromiseCalls).toBeGreaterThan(before); // the injected connection was used
    expect(connectDB).not.toHaveBeenCalled();
    await harness.close();
  });
});

describe('harness: scoped cleanup', () => {
  it('deletes only the tracked document ids with an explicit $in list, then closes once', async () => {
    const { deps, recorded } = fakeDeps();
    const harness = await openContractHarness(readyTarget(), deps);
    const store = harness.createStore();
    await store.tryReserve({ bucket: 'photo-media', day: '2026-10-18', month: '2026-10', amount: 1, dailyLimit: 5, monthlyLimit: 50 });
    await store.tryReserve({ bucket: 'text-search-cron', day: '2026-11-01', month: '2026-11', amount: 1, dailyLimit: 5, monthlyLimit: 50 });
    await harness.close();
    expect(recorded.deleteMany).toEqual([{ _id: { $in: ['photo-media|2026-10', 'text-search-cron|2026-11'] } }]);
    expect(recorded.dropIndex).toEqual([]); // it never created an index, so it drops none
    expect(recorded.closeCalls).toBe(1);
    await harness.close(); // idempotent
    expect(recorded.closeCalls).toBe(1);
    expect(recorded.deleteMany).toHaveLength(1);
  });

  it('never issues a delete when nothing was tracked', async () => {
    const { deps, recorded } = fakeDeps();
    const harness = await openContractHarness(readyTarget(), deps);
    await harness.reset();
    await harness.close();
    expect(recorded.deleteMany).toEqual([]);
  });

  it('drops only the one TTL index it created', async () => {
    const { deps, recorded } = fakeDeps();
    const harness = await openContractHarness(readyTarget(), deps);
    await harness.createIndexes();
    expect(recorded.createIndexesCalls).toBe(1);
    await harness.close();
    expect(recorded.dropIndex).toEqual(['expiresAt_1']);
  });

  it('only inserts, deletes and tracks documents with a valid budget id', async () => {
    const { deps, recorded } = fakeDeps();
    const harness = await openContractHarness(readyTarget(), deps);
    await expect(harness.insertRaw({ _id: 'placecaches|anything' })).rejects.toMatchObject({ code: 'untracked-document' });
    await expect(harness.insertRaw({ _id: 'photo-media|2026-13' })).rejects.toMatchObject({ code: 'untracked-document' });
    await expect(harness.insertRaw({ _id: 'photo-media|2026-10|x' })).rejects.toMatchObject({ code: 'untracked-document' });
    await expect(harness.deleteRaw('photo-media', '2026-10')).rejects.toMatchObject({ code: 'untracked-document' }); // never inserted/tracked
    expect(recorded.insertOne).toEqual([]);
    await harness.insertRaw({ _id: 'photo-media|2026-10', total: 1 });
    await harness.deleteRaw('photo-media', '2026-10');
    expect(recorded.deleteMany).toEqual([{ _id: 'photo-media|2026-10' }]);
    await harness.close();
  });
});

// ---- static guarantees ------------------------------------------------------------------------------------------------------------

describe('static guarantees: no destructive operation, no application connection, not reachable from the app', () => {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const SCAN_DIRS = ['app', 'components', 'config', 'lib', 'models', 'scripts', 'services', 'types'];
  const files: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry) && !entry.endsWith('.d.ts')) files[path.relative(ROOT, full).split(path.sep).join('/')] = readFileSync(full, 'utf8');
    }
  };
  for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir));

  const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const CONTRACT_FILES = ['lib/googleApiBudgetContract.safety.ts', 'lib/googleApiBudgetContract.harness.ts', 'lib/googleApiBudgetStore.mongo.contract.test.ts'];
  const isTest = (file: string) => /\.(test|spec)\.[a-z]+$/.test(file);

  it('the contract files exist', () => {
    for (const file of CONTRACT_FILES) expect(files[file], file).toBeDefined();
  });

  it('none of them can drop a database or collection, or run an unrestricted delete', () => {
    for (const file of CONTRACT_FILES) {
      const code = stripComments(files[file]);
      for (const forbidden of ['dropDatabase', 'dropCollection', '.drop(', 'deleteMany({})', 'deleteMany()', 'deleteMany({ })', 'findOneAndDelete', 'bulkWrite', 'renameCollection', 'syncIndexes', 'cleanIndexes']) {
        expect(code, `${file}: ${forbidden}`).not.toContain(forbidden);
      }
      expect(code, file).not.toMatch(/deleteMany\(\s*\{\s*\}\s*\)/);
    }
  });

  it('none of them can reach the application connection (connectDB, mongoose.connect, lib/mongodb)', () => {
    for (const file of CONTRACT_FILES) {
      const code = stripComments(files[file]);
      expect(code, `${file}: connectDB`).not.toMatch(/\bconnectDB\b/);
      expect(code, `${file}: mongoose.connect(`).not.toMatch(/mongoose\.connect\s*\(/);
      expect(code, `${file}: lib/mongodb`).not.toMatch(/from\s*['"][^'"]*lib\/mongodb['"]/);
    }
  });

  it('only the safety gate reads MONGODB_URI, and only to refuse a match; no file uses it as a fallback', () => {
    const readers = CONTRACT_FILES.filter((file) => /(?<![A-Z_])MONGODB_URI/.test(stripComments(files[file])));
    expect(readers).toEqual(['lib/googleApiBudgetContract.safety.ts']);
    const code = stripComments(files['lib/googleApiBudgetContract.safety.ts']);
    expect((code.match(/(?<![A-Z_])MONGODB_URI/g) ?? []).length).toBe(1);
    expect(code).toContain("const productionRaw = env.MONGODB_URI;");
    expect(code).toContain('const rawUri = env[TEST_URI_ENV];');
    expect(code).not.toMatch(/rawUri\s*=\s*[^;]*MONGODB_URI/);
  });

  it('the safety gate has no side effects: no logging, filesystem, network or connection', () => {
    const code = stripComments(files['lib/googleApiBudgetContract.safety.ts']);
    for (const forbidden of ['console.', 'fetch(', 'readFile', 'writeFile', 'mongoose', 'createConnection', 'process.env', 'import ']) expect(code, forbidden).not.toContain(forbidden);
  });

  it('no application source imports the contract safety gate or harness', () => {
    const offenders = Object.entries(files)
      .filter(([file]) => !isTest(file) && !CONTRACT_FILES.includes(file))
      .filter(([, source]) => /['"][^'"]*googleApiBudgetContract[^'"]*['"]/.test(source))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it('only the contract test and this unit test import the harness', () => {
    const importers = Object.entries(files)
      .filter(([, source]) => /from\s*['"][^'"]*googleApiBudgetContract\.harness['"]/.test(source))
      .map(([file]) => file)
      .sort();
    expect(importers).toEqual(['lib/googleApiBudgetContract.safety.test.ts', 'lib/googleApiBudgetStore.mongo.contract.test.ts']);
  });

  it('the live suite is skipped by default and is gated by the safety evaluation', () => {
    const source = files['lib/googleApiBudgetStore.mongo.contract.test.ts'];
    expect(source).toContain("const evaluation = evaluateContractTarget(process.env);");
    expect(source).toContain("describe.skipIf(!live)('budget store contract: real MongoDB'");
    expect(source).toContain("const live = evaluation.status === 'ready';");
    expect(source).toContain("it.runIf(evaluation.status === 'refuse')('refuses to run against an unsafe contract target'"); // unsafe config fails loudly
    // The only place a connection is opened is the suite's beforeAll, which does not run when the suite is skipped.
    expect(source.match(/openContractHarness\(/g)?.length).toBe(2); // beforeAll, and the one test that needs a second connection
    const beforeAll = source.indexOf('beforeAll(async');
    expect(source.indexOf('openContractHarness(')).toBeGreaterThan(beforeAll);
  });

  it('an empty environment (ordinary CI, Vercel, a developer shell) skips the live suite', () => {
    expect(evaluateContractTarget({})).toEqual({ status: 'skip', reason: 'test-uri-not-set' });
  });

  it('no production config sets the contract-test variables (vercel.json, next.config.mjs, package scripts)', () => {
    for (const file of ['vercel.json', 'next.config.mjs', 'package.json']) {
      expect(readFileSync(path.join(ROOT, file), 'utf8'), file).not.toMatch(/GOOGLE_BUDGET_TEST_/);
    }
  });
});

/**
 * ONE-TIME migration: removes the `PlaceCache.updatedAt_1` TTL index that used to
 * physically delete a cached stay 30 days after its last write. models/PlaceCache.ts no
 * longer defines this index in code (see the Phase 1 Google Places cost-control audit) —
 * this script is what actually removes it from an ALREADY-LIVE MongoDB deployment, since
 * Mongoose never alters an existing index's options on reconnect.
 *
 * SAFETY:
 *  - Inspects the collection's real indexes before touching anything.
 *  - Only ever considers an index a match if it is BOTH keyed on `{ updatedAt: 1 }` AND
 *    carries an `expireAfterSeconds` option (a TTL index) — never drops by name alone.
 *  - If more than one such index exists (shouldn't happen — defensive only), it aborts
 *    and drops nothing rather than guessing which one is "the" TTL index.
 *  - Never touches any other index on this or any other collection.
 *  - Never deletes/modifies a single PlaceCache document — index metadata only.
 *  - Defaults to a DRY RUN: inspects and reports what it would do, but does not call
 *    dropIndex() unless invoked with --execute.
 *  - Idempotent: re-running after a successful drop finds no matching index and reports
 *    "nothing to do" rather than erroring.
 *
 * NOT run against production by this session — explicit authorization required first.
 *
 * Usage (once authorized):
 *   npx tsx scripts/migratePlaceCacheTtl.ts --dry-run   (default if no flag given — inspect only)
 *   npx tsx scripts/migratePlaceCacheTtl.ts --execute    (actually drops the index, if found)
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';

const COLLECTION_NAME = 'placecaches';
const TARGET_KEY = JSON.stringify({ updatedAt: 1 });

export interface IndexInfo {
  name?: string;
  key: Record<string, number>;
  expireAfterSeconds?: number;
}

// Pure, unit-testable matching logic — an index is "the" TTL index this migration
// targets only if it is BOTH keyed on exactly `{ updatedAt: 1 }` AND carries a numeric
// `expireAfterSeconds` (what makes an index a TTL index at all). Never matches by name
// alone (an index name is a label, not a guarantee of what it actually is).
export function findTtlIndexCandidates(indexes: IndexInfo[]): IndexInfo[] {
  return indexes.filter((index) => JSON.stringify(index.key) === TARGET_KEY && typeof index.expireAfterSeconds === 'number');
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const execute = process.argv.includes('--execute');
  console.log(`PlaceCache TTL migration — mode: ${execute ? 'EXECUTE (will modify indexes)' : 'DRY RUN (inspect only, no changes)'}`);

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error('No active MongoDB connection after connectDB()');

  const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
  if (collections.length === 0) {
    console.log(`Collection "${COLLECTION_NAME}" does not exist — nothing to migrate.`);
    await mongoose.disconnect();
    return;
  }

  const collection = db.collection(COLLECTION_NAME);
  const indexes = (await collection.indexes()) as IndexInfo[];

  console.log(`\nFound ${indexes.length} index(es) on "${COLLECTION_NAME}":`);
  for (const index of indexes) {
    console.log(`  - ${index.name ?? '(unnamed)'}: key=${JSON.stringify(index.key)}${index.expireAfterSeconds !== undefined ? `, expireAfterSeconds=${index.expireAfterSeconds}` : ''}`);
  }

  const ttlMatches = findTtlIndexCandidates(indexes);

  if (ttlMatches.length === 0) {
    console.log('\nNo TTL index on { updatedAt: 1 } found — already migrated, or never existed here. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (ttlMatches.length > 1) {
    console.error(
      `\nABORTING: found ${ttlMatches.length} indexes matching { updatedAt: 1 } with expireAfterSeconds — refusing to guess which one is intended. Resolve manually.`
    );
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  const target = ttlMatches[0];
  console.log(`\nTarget TTL index identified: "${target.name}" (expireAfterSeconds=${target.expireAfterSeconds}).`);

  if (!execute) {
    console.log(`DRY RUN — would drop index "${target.name}" on "${COLLECTION_NAME}". Re-run with --execute to actually apply this.`);
    console.log('No documents were read, counted, or touched by this dry run.');
    await mongoose.disconnect();
    return;
  }

  if (!target.name) {
    console.error('ABORTING: matched index has no name to drop by — refusing to proceed.');
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  await collection.dropIndex(target.name);
  console.log(`\nDropped index "${target.name}" on "${COLLECTION_NAME}". No PlaceCache document was read, counted, or modified.`);
  console.log('Existing cached stays will no longer be auto-deleted by MongoDB — freshness is now tracked via StaysRefreshRun + updatedAt only.');

  await mongoose.disconnect();
}

// Only runs when this file is executed directly (`tsx scripts/migratePlaceCacheTtl.ts`)
// — guarded so scripts/migratePlaceCacheTtl.test.ts can import findTtlIndexCandidates
// without triggering a real MongoDB connection attempt as a side effect of the import.
// Uses Node's own pathToFileURL rather than hand-building a `file://` string — a naive
// `file://${path}` is wrong on Windows (a drive-letter absolute path needs the extra
// leading slash `file:///D:/...`, not `file://D:/...`), which silently made this guard
// always false there and the script a no-op with zero output.
const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error('PlaceCache TTL migration failed:', error);
    process.exit(1);
  });
}

/**
 * C4-B2-2 Stage B1 — safety gate for the live MongoDB contract tests of the Google API budget store. TEST SUPPORT ONLY: nothing in the
 * application imports this module. It is pure: it parses environment variables and decides whether a live contract run is allowed. It
 * never opens a connection, never reads the filesystem, never logs, and its results never contain the connection string, a password,
 * a user name or a host name (only fixed codes), so a failure message is safe to print in CI.
 *
 * The gate fails CLOSED. A live run needs ALL of the following, and anything uncertain is a refusal:
 *   1. GOOGLE_BUDGET_TEST_MONGODB_URI is set (there is NO fallback to MONGODB_URI; that variable is only ever read to REFUSE a match).
 *   2. GOOGLE_BUDGET_TEST_ALLOW_WRITE is exactly `yes`.
 *   3. The URI is well formed: mongodb:// or mongodb+srv://, with a user name and password (a dedicated test-only user), at least
 *      one host, and an explicit database name.
 *   4. The database name is not a protected name and carries an explicit scratch/test marker.
 *   5. GOOGLE_BUDGET_TEST_EXPECT_DB equals the URI's database name (a second, independent declaration by the owner).
 *   6. It does not match the production target, when that is identifiable from MONGODB_URI without connecting (same database, or the
 *      same user on a shared host, is a match). If MONGODB_URI is set but cannot be parsed, the production target cannot be ruled out.
 *   7. The process is not a Vercel runtime or build and not NODE_ENV=production.
 * The database name alone is never treated as proof of safety.
 */

export const TEST_URI_ENV = 'GOOGLE_BUDGET_TEST_MONGODB_URI';
export const TEST_ALLOW_WRITE_ENV = 'GOOGLE_BUDGET_TEST_ALLOW_WRITE';
export const TEST_EXPECT_DB_ENV = 'GOOGLE_BUDGET_TEST_EXPECT_DB';

export type ContractRefusalCode =
  | 'uri-malformed'
  | 'uri-scheme-unsupported'
  | 'uri-host-missing'
  | 'uri-credentials-missing'
  | 'uri-database-missing'
  | 'uri-database-invalid'
  | 'database-protected'
  | 'database-marker-missing'
  | 'expected-database-missing'
  | 'expected-database-mismatch'
  | 'matches-production-target'
  | 'production-target-unverifiable'
  | 'hosted-environment'
  | 'production-environment';

export type ContractSkipReason = 'test-uri-not-set' | 'write-opt-in-missing';

export interface ContractTarget {
  /** The validated test URI. Never print it. */
  uri: string;
  database: string;
  /** Lower-cased host names, without ports. Used only to scrub failure messages. */
  hosts: string[];
  username: string;
  /** Held only so failure text can be scrubbed. Never print it. */
  password: string;
}

export type ContractTargetResult =
  | { status: 'skip'; reason: ContractSkipReason }
  | { status: 'refuse'; code: ContractRefusalCode }
  | { status: 'ready'; target: ContractTarget };

export interface ParsedMongoUri {
  scheme: 'mongodb' | 'mongodb+srv';
  username: string;
  password: string;
  hosts: string[];
  /** Empty string when the URI has no database path. */
  database: string;
}

type Env = Record<string, string | undefined>;

/** Databases that must never be the target of a contract run (production, and MongoDB's own system databases). */
export const PROTECTED_DATABASES: readonly string[] = ['theapexvoyager', 'admin', 'local', 'config'];
const FORBIDDEN_NAME_PARTS = ['prod', 'live', 'theapexvoyager'];
const SCRATCH_MARKER = /^(?:[a-z0-9]+[-_])*(?:scratch|test)(?:[-_][a-z0-9]+)*$/i;
const DATABASE_NAME = /^[A-Za-z0-9_-]{1,38}$/;
const URI_PATTERN = /^(mongodb(?:\+srv)?):\/\/(?:([^@/?#]*)@)?([^/?#]*)(?:\/([^?#]*))?(?:\?[^#]*)?$/i;

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** Parses a MongoDB connection string without connecting and without throwing. Returns a refusal code when it cannot. */
export function parseMongoUri(raw: string): { ok: true; value: ParsedMongoUri } | { ok: false; code: ContractRefusalCode } {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return { ok: false, code: 'uri-malformed' };
  const match = URI_PATTERN.exec(text);
  if (!match) {
    return { ok: false, code: /^mongodb(\+srv)?:\/\//i.test(text) ? 'uri-malformed' : 'uri-scheme-unsupported' };
  }
  const scheme = match[1].toLowerCase() as ParsedMongoUri['scheme'];
  const userInfo = match[2] ?? '';
  const hostList = match[3] ?? '';
  const databaseRaw = match[4] ?? '';

  let username = '';
  let password = '';
  if (userInfo) {
    const separator = userInfo.indexOf(':');
    const rawUser = separator === -1 ? userInfo : userInfo.slice(0, separator);
    const rawPassword = separator === -1 ? '' : userInfo.slice(separator + 1);
    const decodedUser = safeDecode(rawUser);
    const decodedPassword = safeDecode(rawPassword);
    if (decodedUser === null || decodedPassword === null) return { ok: false, code: 'uri-malformed' };
    username = decodedUser;
    password = decodedPassword;
  }

  const hosts = hostList
    .split(',')
    .map((entry) => entry.trim().toLowerCase().replace(/:\d+$/, ''))
    .filter(Boolean);
  if (hosts.length === 0) return { ok: false, code: 'uri-host-missing' };
  if (hosts.some((host) => !/^[a-z0-9._-]+$|^\[[0-9a-f:]+\]$/.test(host))) return { ok: false, code: 'uri-malformed' };
  if (scheme === 'mongodb+srv' && hosts.length !== 1) return { ok: false, code: 'uri-malformed' };

  const database = safeDecode(databaseRaw);
  if (database === null) return { ok: false, code: 'uri-malformed' };
  return { ok: true, value: { scheme, username, password, hosts, database } };
}

function isScratchName(database: string): boolean {
  const lower = database.toLowerCase();
  return SCRATCH_MARKER.test(database) && !FORBIDDEN_NAME_PARTS.some((part) => lower.includes(part));
}

function sameTarget(test: ParsedMongoUri, production: ParsedMongoUri): boolean {
  const sharedHost = test.hosts.some((host) => production.hosts.includes(host));
  if (!sharedHost) return false;
  // A shared cluster is acceptable ONLY with a different database AND a different user; MongoDB's default database is `test`.
  const productionDatabase = production.database || 'test';
  return test.database.toLowerCase() === productionDatabase.toLowerCase() || test.username === production.username;
}

/**
 * Decides whether a live contract run may proceed. Pure: reads only the environment it is given. `skip` means "run nothing, quietly";
 * `refuse` means "someone tried to run it unsafely" and must be reported as a failure.
 */
export function evaluateContractTarget(env: Env): ContractTargetResult {
  const rawUri = env[TEST_URI_ENV];
  if (typeof rawUri !== 'string' || rawUri.trim() === '') return { status: 'skip', reason: 'test-uri-not-set' };
  if (env[TEST_ALLOW_WRITE_ENV] !== 'yes') return { status: 'skip', reason: 'write-opt-in-missing' };

  if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL) return { status: 'refuse', code: 'hosted-environment' };
  if (env.NODE_ENV === 'production') return { status: 'refuse', code: 'production-environment' };

  const parsed = parseMongoUri(rawUri);
  if (!parsed.ok) return { status: 'refuse', code: parsed.code };
  const uri = parsed.value;

  if (!uri.username || !uri.password) return { status: 'refuse', code: 'uri-credentials-missing' };
  if (!uri.database) return { status: 'refuse', code: 'uri-database-missing' };
  if (!DATABASE_NAME.test(uri.database)) return { status: 'refuse', code: 'uri-database-invalid' };
  if (PROTECTED_DATABASES.includes(uri.database.toLowerCase())) return { status: 'refuse', code: 'database-protected' };
  if (!isScratchName(uri.database)) return { status: 'refuse', code: 'database-marker-missing' };

  const expected = env[TEST_EXPECT_DB_ENV];
  if (typeof expected !== 'string' || expected === '') return { status: 'refuse', code: 'expected-database-missing' };
  if (expected !== uri.database) return { status: 'refuse', code: 'expected-database-mismatch' };

  const productionRaw = env.MONGODB_URI;
  if (typeof productionRaw === 'string' && productionRaw.trim() !== '') {
    const production = parseMongoUri(productionRaw);
    if (!production.ok) return { status: 'refuse', code: 'production-target-unverifiable' };
    if (sameTarget(uri, production.value)) return { status: 'refuse', code: 'matches-production-target' };
  }

  return { status: 'ready', target: { uri: rawUri.trim(), database: uri.database, hosts: uri.hosts, username: uri.username, password: uri.password } };
}

/** The only collection names the harness may touch: `budget_contract_` plus the run's 12 hex characters. */
export const CONTRACT_COLLECTION_PATTERN = /^budget_contract_[0-9a-f]{12}$/;

export function isContractCollectionName(name: unknown): name is string {
  return typeof name === 'string' && CONTRACT_COLLECTION_PATTERN.test(name);
}

export function contractCollectionName(runId: string): string {
  const name = `budget_contract_${runId}`;
  if (!isContractCollectionName(name)) throw new Error('Invalid contract run id');
  return name;
}

/** Removes every sensitive part of a target (URI, user, hosts) from a piece of text. */
export function scrubTarget(text: string, target: ContractTarget): string {
  let result = text.split(target.uri).join('[uri]');
  for (const secret of [target.password, target.username, ...target.hosts]) {
    if (secret) result = result.split(secret).join('[redacted]');
  }
  return result;
}

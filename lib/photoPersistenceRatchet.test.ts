import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * C3-B1 — persistence RATCHET for Google photo identifiers.
 *
 * Google's Place Photos documentation says a photo name cannot be cached. The site currently does persist them (inside
 * `/api/places/photo?name=...` URLs). This test does not say that is acceptable. It records exactly where it happens today
 * as ACKNOWLEDGED LEGACY FINDINGS, and fails if a NEW place starts persisting Google photo identifiers, or if an
 * acknowledged place gains a new source or sink. The list can only shrink: removing a legacy path (good) makes the matching
 * entry stale, and the test then tells you to delete the entry.
 *
 * HONEST LIMITS. This is a static heuristic over source text, not a proof. It looks for a file that BOTH (a) produces a
 * Google photo value (`placePhotoUrls`, `toProxiedPhotoUrl`, the `/api/places/photo` path, a `photo(s).name` read, a
 * photo reference) AND (b) calls a database/file write method. It will not catch a value passed between files, built
 * dynamically, or written by a method it does not list; and it can flag a file that has both but never writes the photo.
 * It reads source files only: no database, no network, no environment.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['app', 'components', 'config', 'lib', 'models', 'scripts', 'services', 'types'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.js', '.mjs']);

// ---- the scanner (pure; takes file contents, so it can be tested on synthetic sources) ----------------------------------

/** Removes comments (keeping string contents) so a comment that merely mentions a symbol is not a finding. Heuristic: a regex
 *  literal containing a quote character could confuse it. */
export function stripComments(source: string): string {
  let out = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const d = source[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      out += ' ';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      out += c;
      i += 1;
      while (i < n) {
        const e = source[i];
        out += e;
        i += 1;
        if (e === '\\') {
          out += source[i] ?? '';
          i += 1;
          continue;
        }
        if (e === c) break;
        if (c !== '`' && e === '\n') break;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

function stripImports(source: string): string {
  return source.replace(/^[ \t]*(?:import|export)\b[^;'"`]*?\bfrom\s*['"][^'"]*['"]\s*;?/gm, ' ').replace(/^[ \t]*import\s*['"][^'"]*['"]\s*;?/gm, ' ');
}

const SOURCE_PATTERNS: readonly { name: string; pattern: RegExp }[] = [
  { name: 'placePhotoUrls', pattern: /\bplacePhotoUrls\b/ },
  { name: 'toProxiedPhotoUrl', pattern: /\btoProxiedPhotoUrl\b/ },
  { name: '/api/places/photo', pattern: /\/api\/places\/photo/ },
  { name: 'photo-name-read', pattern: /\bphotos?(?:\[[^\]]*\])?\??\.name\b/ },
  { name: 'photo-reference', pattern: /\bphoto_?[Rr]eference\b/ }
];

const SINK_PATTERNS: readonly { name: string; pattern: RegExp }[] = [
  { name: 'findOneAndUpdate', pattern: /\.findOneAndUpdate\s*\(/ },
  { name: 'findByIdAndUpdate', pattern: /\.findByIdAndUpdate\s*\(/ },
  { name: 'findOneAndReplace', pattern: /\.findOneAndReplace\s*\(/ },
  { name: 'updateOne', pattern: /\.updateOne\s*\(/ },
  { name: 'updateMany', pattern: /\.updateMany\s*\(/ },
  { name: 'replaceOne', pattern: /\.replaceOne\s*\(/ },
  { name: 'insertOne', pattern: /\.insertOne\s*\(/ },
  { name: 'insertMany', pattern: /\.insertMany\s*\(/ },
  { name: 'bulkWrite', pattern: /\.bulkWrite\s*\(/ },
  { name: 'create', pattern: /(?<!\bObject)\.create\s*\(/ },
  { name: 'save', pattern: /\.save\s*\(/ },
  { name: 'writeFile', pattern: /\b(?:writeFile|writeFileSync|appendFile|appendFileSync)\s*\(/ }
];

const MODEL_PHOTO_FIELD = /\b(photos|photoUrls|photoNames|photoRefs|photoReferences?|photoName|googlePhotos)\s*:/g;

export interface WritePathFinding {
  file: string;
  sources: string[];
  sinks: string[];
}

export function scanWritePaths(files: Record<string, string>): WritePathFinding[] {
  const findings: WritePathFinding[] = [];
  for (const file of Object.keys(files).sort()) {
    const code = stripImports(stripComments(files[file]));
    const sources = SOURCE_PATTERNS.filter(({ pattern }) => pattern.test(code)).map(({ name }) => name);
    const sinks = SINK_PATTERNS.filter(({ pattern }) => pattern.test(code)).map(({ name }) => name);
    if (sources.length > 0 && sinks.length > 0) findings.push({ file, sources: sources.sort(), sinks: sinks.sort() });
  }
  return findings;
}

/** `file#field` for every photo-like field declared in a model file. */
export function scanModelPhotoFields(files: Record<string, string>): string[] {
  const found: string[] = [];
  for (const file of Object.keys(files).sort()) {
    if (!file.startsWith('models/')) continue;
    const code = stripComments(files[file]);
    const fields = new Set<string>();
    for (const match of code.matchAll(MODEL_PHOTO_FIELD)) fields.add(match[1]);
    for (const field of [...fields].sort()) found.push(`${file}#${field}`);
  }
  return found;
}

function readRepoSources(): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
      const full = path.join(dir, entry);
      const info = statSync(full);
      if (info.isDirectory()) {
        walk(full);
      } else if (SOURCE_EXTENSIONS.has(path.extname(entry)) && !/\.(test|spec)\.[a-z]+$/.test(entry) && !entry.endsWith('.d.ts')) {
        files[path.relative(ROOT, full).split(path.sep).join('/')] = readFileSync(full, 'utf8');
      }
    }
  };
  for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir));
  return files;
}

// ---- ACKNOWLEDGED LEGACY FINDINGS (not endorsed; each is a known gap from the C1 audit) ------------------------------------

interface LegacyWritePath {
  file: string;
  /** Sources and sinks the file is allowed to have. A NEW source or sink in this file fails the test. */
  sources: readonly string[];
  sinks: readonly string[];
  /** Why it is here. 'legacy-unsafe' = persists Google photo names today. 'reviewed-not-a-photo-sink' = flagged by the heuristic, reviewed, does not persist photo identifiers. */
  status: 'legacy-unsafe' | 'reviewed-not-a-photo-sink';
  note: string;
}

const ACKNOWLEDGED_WRITE_PATHS: readonly LegacyWritePath[] = [
  {
    file: 'lib/staysRefresh.ts',
    sources: ['placePhotoUrls'],
    sinks: ['findOneAndUpdate'],
    status: 'legacy-unsafe',
    note: 'Daily refresh cron upserts PlaceCache.photos built by placePhotoUrls(place) (proxy URLs containing Google photo names).'
  },
  {
    file: 'lib/destinations.ts',
    sources: ['placePhotoUrls'],
    sinks: ['findOneAndUpdate'],
    status: 'legacy-unsafe',
    note: 'mapPlaceToDestination stores proxy photo URLs in DestinationSearchCache.results via findOneAndUpdate (30-day TTL declared on that model).'
  }
];

/** Photo-like fields declared on models today. A NEW one fails the test. */
const ACKNOWLEDGED_MODEL_FIELDS: readonly { entry: string; note: string }[] = [
  { entry: 'models/PlaceCache.ts#photos', note: 'PlaceCache.photos: string[] of proxy URLs containing Google photo names (no TTL on this model in code).' },
  { entry: 'models/Destination.ts#photos', note: 'Destination.photos: string[]; what populates it in production is not confirmed (no database read was made).' }
];

/**
 * Production files allowed to import lib/photoProvenance.ts. EMPTY on purpose while the module is dark (C3-B1). An approved
 * future integration (C3-B2) adds the specific files here in the same change that wires them, so the dependency is always a
 * deliberate, reviewed edit and never an accident.
 */
const APPROVED_PROVENANCE_IMPORTERS: readonly string[] = [];

// ---- the repository-level ratchet --------------------------------------------------------------------------------------------

describe('Google photo persistence ratchet (repository)', () => {
  const files = readRepoSources();

  it('scans a plausible set of source files (guards against a silently broken scanner)', () => {
    expect(Object.keys(files).length).toBeGreaterThan(200);
    expect(files['lib/staysRefresh.ts']).toContain('placePhotoUrls');
    expect(Object.keys(files).some((f) => f.endsWith('.test.ts'))).toBe(false);
  });

  it('every file that both produces a Google photo value and writes data is an acknowledged legacy path', () => {
    const acknowledged = new Set(ACKNOWLEDGED_WRITE_PATHS.map((entry) => entry.file));
    const unacknowledged = scanWritePaths(files).filter((finding) => !acknowledged.has(finding.file));
    expect(
      unacknowledged,
      `NEW Google photo persistence path(s) detected. Google says photo names cannot be cached, so do not add one. If this is a false positive, review it and add it to ACKNOWLEDGED_WRITE_PATHS with status 'reviewed-not-a-photo-sink' and a reason. Found: ${JSON.stringify(unacknowledged)}`
    ).toEqual([]);
  });

  it('an acknowledged file may not gain a new photo source or a new write method', () => {
    const byFile = new Map(scanWritePaths(files).map((finding) => [finding.file, finding]));
    for (const legacy of ACKNOWLEDGED_WRITE_PATHS) {
      const found = byFile.get(legacy.file);
      if (!found) continue; // reported by the stale-entry test
      expect(found.sources.filter((source) => !legacy.sources.includes(source)), `${legacy.file} gained a photo source`).toEqual([]);
      expect(found.sinks.filter((sink) => !legacy.sinks.includes(sink)), `${legacy.file} gained a write method`).toEqual([]);
    }
  });

  it('has no stale acknowledgements (when a legacy path is removed, delete its entry: the ratchet only tightens)', () => {
    const present = new Set(scanWritePaths(files).map((finding) => finding.file));
    const stale = ACKNOWLEDGED_WRITE_PATHS.filter((entry) => !present.has(entry.file)).map((entry) => entry.file);
    expect(stale, 'These acknowledged legacy paths no longer match. Remove them from ACKNOWLEDGED_WRITE_PATHS.').toEqual([]);
  });

  it('every photo-like model field is acknowledged, and none is stale', () => {
    const found = scanModelPhotoFields(files);
    const acknowledged = ACKNOWLEDGED_MODEL_FIELDS.map((entry) => entry.entry);
    expect(found.filter((entry) => !acknowledged.includes(entry)), 'NEW photo-like model field(s): do not store Google photo identifiers').toEqual([]);
    expect(acknowledged.filter((entry) => !found.includes(entry)), 'Stale model-field acknowledgement(s): remove them').toEqual([]);
  });

  it('keeps the acknowledged list explicit and small, with a reason on every entry', () => {
    expect(ACKNOWLEDGED_WRITE_PATHS.length).toBeLessThanOrEqual(2);
    expect(ACKNOWLEDGED_MODEL_FIELDS.length).toBeLessThanOrEqual(2);
    for (const entry of [...ACKNOWLEDGED_WRITE_PATHS, ...ACKNOWLEDGED_MODEL_FIELDS]) expect(entry.note.length).toBeGreaterThan(20);
    expect(ACKNOWLEDGED_WRITE_PATHS.filter((entry) => entry.status === 'legacy-unsafe').map((entry) => entry.file).sort()).toEqual(['lib/destinations.ts', 'lib/staysRefresh.ts']);
  });

  it('the provenance module is imported only by files explicitly approved for it (empty while the module is dark)', () => {
    const importers = Object.entries(files)
      .filter(([file]) => file !== 'lib/photoProvenance.ts')
      .filter(([, source]) => /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"][^'"]*photoProvenance['"]/.test(source))
      .map(([file]) => file);
    expect(importers.filter((file) => !APPROVED_PROVENANCE_IMPORTERS.includes(file))).toEqual([]);
  });
});

// ---- the scanner itself, on synthetic sources (no filesystem) ------------------------------------------------------------------

describe('scanner behaviour (synthetic sources)', () => {
  const unsafe = `
    import { placePhotoUrls } from '@/lib/googlePlaces';
    import { Thing } from '@/models/Thing';
    export async function save(place) {
      await Thing.findOneAndUpdate({ id: place.id }, { photos: placePhotoUrls(place) }, { upsert: true });
    }
  `;

  it('flags a new photo-name persistence sink', () => {
    expect(scanWritePaths({ 'lib/newThing.ts': unsafe })).toEqual([{ file: 'lib/newThing.ts', sources: ['placePhotoUrls'], sinks: ['findOneAndUpdate'] }]);
  });

  it.each([
    ['updateOne', "await M.updateOne({}, { photos: toProxiedPhotoUrl(p.name) });"],
    ['insertMany', "await M.insertMany([{ photo: `/api/places/photo?name=${n}` }]);"],
    ['create', "await M.create({ img: photos[0].name });"],
    ['bulkWrite', "await M.bulkWrite(ops.map((o) => ({ updateOne: { filter: {}, update: { ref: o.photoReference } } })));"],
    ['writeFile', "writeFileSync('out.json', JSON.stringify(placePhotoUrls(place)));"]
  ])('flags other sinks and sources: %s', (_name, body) => {
    expect(scanWritePaths({ 'scripts/x.ts': body }).map((finding) => finding.file)).toEqual(['scripts/x.ts']);
  });

  it('ignores a comment, or an import, that merely mentions a symbol', () => {
    const commentOnly = `
      // placePhotoUrls was removed; never call Thing.findOneAndUpdate with a photo name
      /* toProxiedPhotoUrl(...) and /api/places/photo appear only in this comment */
      import { placePhotoUrls } from '@/lib/googlePlaces';
      export const noop = () => Thing.findOneAndUpdate({}, {});
    `;
    expect(scanWritePaths({ 'lib/a.ts': commentOnly })).toEqual([]);
  });

  it('ignores a write that has no Google photo source, and a source that has no write', () => {
    expect(scanWritePaths({ 'lib/b.ts': 'await Hotel.findOneAndUpdate({}, { images: hotel.images });' })).toEqual([]);
    expect(scanWritePaths({ 'lib/c.ts': 'export const urls = (p) => placePhotoUrls(p);' })).toEqual([]);
    expect(scanWritePaths({ 'lib/d.ts': 'const o = Object.create(null); const x = toProxiedPhotoUrl(n);' })).toEqual([]);
  });

  it('is not sensitive to where a line is: moving code changes nothing', () => {
    const moved = `${'\n// padding\n'.repeat(50)}${unsafe}${'\n\n'.repeat(20)}`;
    expect(scanWritePaths({ 'lib/new.ts': moved })).toEqual(scanWritePaths({ 'lib/new.ts': unsafe }));
  });

  it('still sees code after a string that contains // (e.g. a URL)', () => {
    const body = "const u = 'https://example.com/a'; await M.updateOne({}, { p: placePhotoUrls(x) });";
    expect(scanWritePaths({ 'lib/e.ts': body }).map((finding) => finding.file)).toEqual(['lib/e.ts']);
  });

  it('flags a new photo-like model field and ignores comments', () => {
    const model = `const Schema = { name: String, photoNames: [String], /* photos: removed */ };`;
    expect(scanModelPhotoFields({ 'models/Thing.ts': model, 'lib/x.ts': 'photos: []' })).toEqual(['models/Thing.ts#photoNames']);
    expect(scanModelPhotoFields({ 'models/Safe.ts': 'const s = { name: String, images: [String] };' })).toEqual([]);
  });
});

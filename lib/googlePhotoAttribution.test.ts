import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHOTO_RESOURCE_NAME_PATTERN, normalizeGooglePhoto, normalizeGooglePhotos, safeHttpsUrl } from './googlePhotoAttribution';
import { placePhotoMetadata, placePhotoUrls, toProxiedPhotoUrl, type RawGooglePlace } from './googlePlaces';

const ROOT = process.cwd();
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');

const NAME = 'places/ChIJabc123/photos/AVtoken_-=.9';
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1234567890', photoUri: 'https://lh3.googleusercontent.com/a-/AAA=s100' };
const rawPhoto = (extra: Record<string, unknown> = {}) => ({
  name: NAME,
  widthPx: 4000,
  heightPx: 3000,
  authorAttributions: [AUTHOR],
  flagContentUri: 'https://www.google.com/local/imagery/report/?cb_client=maps_api&image_key=abc',
  googleMapsUri: 'https://www.google.com/maps/place/@31.1,77.1,3a/photos',
  ...extra
});

afterEach(() => vi.restoreAllMocks());

describe('valid attribution metadata', () => {
  it('keeps the genuine resource name, author name, profile link, avatar, per-photo Maps link and report link', () => {
    expect(normalizeGooglePhoto(rawPhoto())).toEqual({
      name: NAME,
      widthPx: 4000,
      heightPx: 3000,
      authorAttributions: [AUTHOR],
      authorsDropped: 0,
      googleMapsUri: 'https://www.google.com/maps/place/@31.1,77.1,3a/photos',
      flagContentUri: 'https://www.google.com/local/imagery/report/?cb_client=maps_api&image_key=abc'
    });
  });

  it('does not change a real author name (accents, non-Latin scripts, emoji)', () => {
    for (const displayName of ['José Núñez', 'आशा वर्मा', '山田 太郎', 'Sam 🏔️ Lee']) {
      expect(normalizeGooglePhoto(rawPhoto({ authorAttributions: [{ displayName }] }))?.authorAttributions[0].displayName).toBe(displayName);
    }
  });

  it('tidies only whitespace in a name (collapses runs, trims) and strips control and text-direction characters', () => {
    const messy = `  Asha ${String.fromCharCode(9)} Verma${String.fromCharCode(0)} `;
    const photo = normalizeGooglePhoto(rawPhoto({ authorAttributions: [{ displayName: messy }, { displayName: `Mallory${String.fromCharCode(0x202e)}evil` }] }));
    expect(photo?.authorAttributions.map((a) => a.displayName)).toEqual(['Asha Verma', 'Mallory evil']);
  });

  it('reads a scheme-relative link as https', () => {
    expect(normalizeGooglePhoto(rawPhoto({ authorAttributions: [{ displayName: 'A', uri: '//www.google.com/maps/contrib/9' }] }))?.authorAttributions[0].uri).toBe('https://www.google.com/maps/contrib/9');
  });
});

describe('missing attribution', () => {
  it('a photo with no, null or empty authorAttributions has no authors and nothing was dropped', () => {
    for (const authorAttributions of [undefined, null, []]) {
      const photo = normalizeGooglePhoto({ name: NAME, authorAttributions });
      expect(photo).toEqual({ name: NAME, authorAttributions: [], authorsDropped: 0 });
    }
  });

  it('never invents an author, a link or a dimension that Google did not send', () => {
    const photo = normalizeGooglePhoto({ name: NAME });
    expect(photo).toEqual({ name: NAME, authorAttributions: [], authorsDropped: 0 });
    expect(photo).not.toHaveProperty('googleMapsUri');
    expect(photo).not.toHaveProperty('flagContentUri');
    expect(photo).not.toHaveProperty('widthPx');
  });
});

describe('multiple photographers', () => {
  it('preserves every author, in order, with their own links', () => {
    const authors = [{ displayName: 'One', uri: 'https://www.google.com/maps/contrib/1' }, { displayName: 'Two' }, { displayName: 'Three', photoUri: 'https://lh3.googleusercontent.com/x' }];
    expect(normalizeGooglePhoto(rawPhoto({ authorAttributions: authors }))?.authorAttributions).toEqual(authors);
  });

  it('is bounded: at most 10 authors are kept and the rest are counted as dropped', () => {
    const many = Array.from({ length: 14 }, (_, index) => ({ displayName: `Author ${index}` }));
    const photo = normalizeGooglePhoto(rawPhoto({ authorAttributions: many }));
    expect(photo?.authorAttributions).toHaveLength(10);
    expect(photo?.authorsDropped).toBe(4);
  });
});

describe('missing optional links', () => {
  it('an author without a profile link or avatar keeps just the name', () => {
    expect(normalizeGooglePhoto(rawPhoto({ authorAttributions: [{ displayName: 'Only Name' }] }))?.authorAttributions).toEqual([{ displayName: 'Only Name' }]);
  });

  it('a photo without googleMapsUri or flagContentUri omits them rather than guessing', () => {
    const photo = normalizeGooglePhoto(rawPhoto({ googleMapsUri: undefined, flagContentUri: undefined }));
    expect(photo).not.toHaveProperty('googleMapsUri');
    expect(photo).not.toHaveProperty('flagContentUri');
    expect(photo?.authorAttributions).toEqual([AUTHOR]);
  });
});

describe('invalid link protocols and shapes', () => {
  const UNSAFE = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'http://www.google.com/maps/contrib/1',
    'ftp://example.com/x',
    '/maps/contrib/1',
    'www.google.com/maps/contrib/1',
    'https:evil.example',
    'https://user:pass@www.google.com/x',
    'https://',
    'https://exa mple.com/x',
    'https://example.com/x\nSet-Cookie: a=b',
    `https://example.com/${'a'.repeat(2100)}`,
    '',
    '   '
  ];

  it.each(UNSAFE)('safeHttpsUrl rejects %j', (value) => {
    expect(safeHttpsUrl(value)).toBeUndefined();
  });

  it('safeHttpsUrl rejects non-strings', () => {
    for (const value of [undefined, null, 5, {}, [], true, ['https://a.example']]) expect(safeHttpsUrl(value)).toBeUndefined();
  });

  it('safeHttpsUrl accepts a plain https link and returns its normalized href', () => {
    expect(safeHttpsUrl('https://www.google.com/maps/contrib/1')).toBe('https://www.google.com/maps/contrib/1');
    expect(safeHttpsUrl('  HTTPS://Example.com/Path?q=1  ')).toBe('https://example.com/Path?q=1');
  });

  it('an unsafe author link is dropped while the author name is kept', () => {
    const photo = normalizeGooglePhoto(rawPhoto({ authorAttributions: [{ displayName: 'Asha', uri: 'javascript:alert(1)', photoUri: 'data:image/png;base64,AAAA' }] }));
    expect(photo?.authorAttributions).toEqual([{ displayName: 'Asha' }]);
    expect(JSON.stringify(photo)).not.toMatch(/javascript:|data:/i);
  });

  it('unsafe per-photo links are omitted', () => {
    const photo = normalizeGooglePhoto(rawPhoto({ googleMapsUri: 'javascript:void(0)', flagContentUri: 'http://insecure.example/report' }));
    expect(photo).not.toHaveProperty('googleMapsUri');
    expect(photo).not.toHaveProperty('flagContentUri');
  });
});

describe('malformed attribution objects', () => {
  it('drops (and counts) entries that are not usable authors, keeping the good ones', () => {
    const photo = normalizeGooglePhoto(rawPhoto({ authorAttributions: [null, 'Asha', 42, [], {}, { displayName: '' }, { displayName: '   ' }, { displayName: 7 }, { uri: 'https://www.google.com/x' }, { displayName: 'x'.repeat(201) }, { displayName: 'Good' }] }));
    expect(photo?.authorAttributions).toEqual([{ displayName: 'Good' }]);
    expect(photo?.authorsDropped).toBe(10);
  });

  it('authorAttributions that is not a list is reported as an unreadable credit, never as "no author"', () => {
    for (const authorAttributions of ['Asha', { displayName: 'Asha' }, 5, true]) {
      const photo = normalizeGooglePhoto(rawPhoto({ authorAttributions }));
      expect(photo?.authorAttributions).toEqual([]);
      expect(photo?.authorsDropped).toBe(1);
    }
  });

  it('rejects photos that are not usable at all and never throws', () => {
    const bad: unknown[] = [null, undefined, 'places/a/photos/b', 5, [], {}, { name: 5 }, { name: '' }, { name: 'places/a/b' }, { name: 'places//photos/x' }, { name: 'places/a/photos/../x' }, { name: `places/a/photos/${'x'.repeat(2049)}` }];
    for (const entry of bad) expect(() => normalizeGooglePhoto(entry)).not.toThrow();
    for (const entry of bad) expect(normalizeGooglePhoto(entry), JSON.stringify(entry)).toBeNull();
  });

  it('ignores bad dimensions instead of trusting them', () => {
    const photo = normalizeGooglePhoto(rawPhoto({ widthPx: -5, heightPx: '3000' }));
    expect(photo).not.toHaveProperty('widthPx');
    expect(photo).not.toHaveProperty('heightPx');
  });

  it('normalizeGooglePhotos skips unusable entries, keeps order, and a non-array gives []', () => {
    const photos = normalizeGooglePhotos([rawPhoto(), null, { name: 'nope' }, rawPhoto({ name: 'places/ChIJxyz/photos/second' })]);
    expect(photos.map((p) => p.name)).toEqual([NAME, 'places/ChIJxyz/photos/second']);
    for (const input of [undefined, null, 'x', 5, {}]) expect(normalizeGooglePhotos(input)).toEqual([]);
  });

  it('is bounded to 20 photos', () => {
    const many = Array.from({ length: 30 }, (_, index) => ({ name: `places/ChIJabc/photos/p${index}` }));
    expect(normalizeGooglePhotos(many)).toHaveLength(20);
  });

  it('does not mutate its input', () => {
    const input = rawPhoto();
    const snapshot = JSON.stringify(input);
    normalizeGooglePhoto(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('no persistence of new Google data and existing photo URL mapping unchanged', () => {
  const place: RawGooglePlace = { id: 'ChIJabc123', photos: [rawPhoto() as never, rawPhoto({ name: 'places/ChIJabc123/photos/second', authorAttributions: [{ displayName: 'Other' }] }) as never] };

  it('placePhotoUrls (the only photo mapping persisted today) is unchanged and carries no attribution data', () => {
    const urls = placePhotoUrls(place);
    expect(urls).toEqual([toProxiedPhotoUrl(NAME), toProxiedPhotoUrl('places/ChIJabc123/photos/second')]);
    expect(urls[0]).toBe(`/api/places/photo?name=${encodeURIComponent(NAME)}&w=1200`);
    const serialized = JSON.stringify(urls);
    for (const leaked of ['Asha', 'Verma', 'displayName', 'contrib', 'googleusercontent', 'flagContentUri', 'report']) expect(serialized).not.toContain(leaked);
  });

  it('placePhotoMetadata is the in-memory view and does not alter the place or the persisted mapping', () => {
    const before = JSON.stringify(place);
    const metadata = placePhotoMetadata(place);
    expect(metadata.map((photo) => photo.name)).toEqual([NAME, 'places/ChIJabc123/photos/second']);
    expect(metadata[0].authorAttributions).toEqual([AUTHOR]);
    expect(JSON.stringify(place)).toBe(before);
    expect(placePhotoUrls(place)).toEqual([toProxiedPhotoUrl(NAME), toProxiedPhotoUrl('places/ChIJabc123/photos/second')]);
  });

  it('a place with name-only photos (all existing data and the mock data) behaves exactly as before', () => {
    const legacy: RawGooglePlace = { id: 'x', photos: [{ name: 'places/mock_manali_old_manali/photos/mock_1' }] };
    expect(placePhotoUrls(legacy)).toEqual([toProxiedPhotoUrl('places/mock_manali_old_manali/photos/mock_1')]);
    expect(placePhotoMetadata(legacy)).toEqual([{ name: 'places/mock_manali_old_manali/photos/mock_1', authorAttributions: [], authorsDropped: 0 }]);
    expect(placePhotoMetadata({ id: 'y' })).toEqual([]);
  });

  it('nothing outside the new module and its thin wrapper uses the metadata: persistence, refresh, models, pages and components do not', () => {
    const forbidden = /googlePhotoAttribution|placePhotoMetadata|normalizeGooglePhoto|authorAttributions/;
    const files = [
      'lib/staysRefresh.ts',
      'lib/stays.ts',
      'lib/destinations.ts',
      'lib/staysSearch.ts',
      'models/PlaceCache.ts',
      'models/DestinationSearchCache.ts',
      'models/Destination.ts',
      'app/api/places/photo/route.ts',
      'app/api/cron/refresh-stays/route.ts',
      'components/modules/StaysGrid.tsx',
      'components/modules/stays/PropertyPhotoGallery.tsx',
      'app/stays/[...segments]/page.tsx',
      'types/stay.ts',
      'types/destination.ts'
    ];
    for (const file of files) expect(read(file), file).not.toMatch(forbidden);
  });

  it('no other source file imports the new module yet (only lib/googlePlaces.ts and tests)', () => {
    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(ROOT, dir))) {
        if (['node_modules', '.next', '.git', 'public'].includes(entry)) continue;
        const relative = `${dir}/${entry}`;
        const stat = statSync(join(ROOT, relative));
        if (stat.isDirectory()) walk(relative);
        else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry) && read(relative).includes('googlePhotoAttribution')) importers.push(relative);
      }
    };
    for (const dir of ['app', 'components', 'lib', 'models', 'services', 'types', 'config', 'scripts']) walk(dir);
    expect(importers.sort()).toEqual(['lib/googlePlaces.ts']);
  });
});

describe('unchanged Google API usage and existing behaviour', () => {
  it('the Text Search field mask is exactly what it was (no field added, removed or reordered)', () => {
    const source = read('lib/googlePlaces.ts');
    const mask = source.slice(source.indexOf('const SEARCH_FIELD_MASK = ['), source.indexOf("].join(',')") + "].join(',')".length);
    expect(mask.replace(/\s+/g, '')).toBe(
      "constSEARCH_FIELD_MASK=['places.id','places.displayName','places.formattedAddress','places.location','places.rating','places.userRatingCount','places.photos','places.types','places.googleMapsUri','places.websiteUri','nextPageToken'].join(',')"
    );
  });

  it('adds no new network call: the new module has no imports and the only fetch calls in lib/googlePlaces.ts are the two existing endpoints\' client', () => {
    expect(read('lib/googlePhotoAttribution.ts')).not.toMatch(/^import |fetch\(|XMLHttpRequest|process\.env|console\./m);
    expect(read('lib/googlePlaces.ts').match(/\bfetch\(/g)).toHaveLength(1);
  });

  it('the new module logs nothing', () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')].map((spy) => spy.mockImplementation(() => undefined));
    normalizeGooglePhotos([rawPhoto(), { name: 'bad' }, null, rawPhoto({ authorAttributions: 'x' })]);
    expect(spies.flatMap((spy) => spy.mock.calls)).toEqual([]);
  });

  it('the resource-name pattern is identical to the photo proxy\'s own (so a name accepted here is one the proxy accepts)', () => {
    const route = read('app/api/places/photo/route.ts');
    expect(route).toContain(`const PHOTO_NAME_PATTERN = ${PHOTO_RESOURCE_NAME_PATTERN.toString()};`);
  });

  it('the photo proxy, cache headers and Google Maps attribution component are untouched by this change', () => {
    expect(read('app/api/places/photo/route.ts')).toContain("'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable'");
    expect(read('components/ui/GoogleMapsAttribution.tsx')).toContain('GOOGLE_MAPS_LOGO_ASSETS');
  });

  it('Stays stay informational and view-only: no price, availability, booking or enquiry wording in the new code', () => {
    expect(read('lib/googlePhotoAttribution.ts')).not.toMatch(/₹|price|availab|book(ing)? now|whatsapp|wa\.me|enquir/i);
  });
});

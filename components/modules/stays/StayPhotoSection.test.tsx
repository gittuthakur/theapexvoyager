import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFreshPhotoFetcher, type EligiblePlaceId } from '@/lib/googlePhotoFetch';
import type { Stay } from '@/types/stay';
import { PropertyPhotoGallery } from './PropertyPhotoGallery';
import { StayPhotoSection } from './StayPhotoSection';

// Everything is injected: the real D1-3a fetcher runs against a fake `fetch`. No Google request and no request context.
const KEY = 'test-key-not-real-1234567890';
const PLACE = 'ChIJreal_-123' as EligiblePlaceId;
const STORED_MARKER = 'STORED-OLD-PHOTO-MARKER';
const STORED_PHOTOS = [`/api/places/photo?name=${encodeURIComponent(`places/${PLACE}/photos/${STORED_MARKER}-1`)}&w=1200`, `/api/places/photo?name=${encodeURIComponent(`places/${PLACE}/photos/${STORED_MARKER}-2`)}&w=1200`];

const stay: Stay = { placeId: PLACE, name: 'Riverside Hotel', slug: 'riverside-hotel', stayType: 'hotel', photos: STORED_PHOTOS, destinationSlug: 'manali', source: 'google' };
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1' };
const photo = (token: string, extra: Record<string, unknown> = {}) => ({
  name: `places/${PLACE}/photos/${token}`,
  authorAttributions: [AUTHOR],
  googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/${token}`,
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`,
  ...extra
});
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function render(env: Record<string, string | undefined>, respond: () => Promise<Response> = async () => jsonResponse({ photos: [photo('fresh-a'), photo('fresh-b')] }), eligiblePlaceId: EligiblePlaceId | null = PLACE) {
  const fetchImpl = vi.fn(respond);
  const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false });
  const getClientKey = vi.fn(async () => '203.0.113.7');
  const markup = (async () => renderToStaticMarkup(await StayPhotoSection({ stay, eligiblePlaceId, deps: { env, getClientKey, fetchPhotos: fetcher } })))();
  return { markup, fetchImpl, getClientKey };
}

const FRESH = { GOOGLE_PHOTO_METADATA_MODE: 'fresh', GOOGLE_PLACES_API_KEY: KEY };

afterEach(() => vi.restoreAllMocks());

describe('default (legacy) mode preserves the existing output exactly', () => {
  const legacyHtml = renderToStaticMarkup(<PropertyPhotoGallery photos={STORED_PHOTOS} propertyName="Riverside Hotel" />);

  it.each([[{}], [{ GOOGLE_PHOTO_METADATA_MODE: 'legacy' }], [{ GOOGLE_PHOTO_METADATA_MODE: 'unknown' }]])('env %j renders byte-for-byte what the page rendered before and makes no Google request', async (env) => {
    const { markup, fetchImpl, getClientKey } = render({ ...env, GOOGLE_PLACES_API_KEY: KEY });
    expect(await markup).toBe(legacyHtml);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(getClientKey).not.toHaveBeenCalled();
  });

  it('legacy still shows the stored photos (so nothing is removed from production by default)', async () => {
    const html = await render({}).markup;
    expect(html).toContain(STORED_MARKER);
    expect(html).not.toContain('Photo by');
    expect(html).not.toContain('GoogleMaps_Logo');
  });

  it('legacy with no stored photos keeps today\'s "Photo unavailable" placeholder', async () => {
    const html = renderToStaticMarkup(await StayPhotoSection({ stay: { ...stay, photos: [] }, eligiblePlaceId: PLACE, deps: { env: {}, getClientKey: async () => 'x', fetchPhotos: vi.fn() } }));
    expect(html).toBe(renderToStaticMarkup(<PropertyPhotoGallery photos={[]} propertyName="Riverside Hotel" />));
    expect(textOf(html)).toContain('Photo unavailable');
  });
});

describe('disabled mode', () => {
  it('shows "Photos temporarily unavailable" and no stored photo, with no Google request', async () => {
    const { markup, fetchImpl } = render({ GOOGLE_PHOTO_METADATA_MODE: 'disabled', GOOGLE_PLACES_API_KEY: KEY });
    const html = await markup;
    expect(textOf(html)).toContain('Photos temporarily unavailable');
    expect(html).not.toContain(STORED_MARKER);
    expect(html).toContain('role="status"');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('fresh mode', () => {
  it('shows the credited gallery built from FRESH photos: genuine credit, Google Maps links and the official logo', async () => {
    const { markup, fetchImpl } = render(FRESH);
    const html = await markup;

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(textOf(html)).toContain('Photo by Asha Verma');
    expect(html).toContain('/maps/place/@1,1,3a/photos/fresh-a');
    expect(html).toContain('image_key=fresh-a');
    expect(html).toContain('GoogleMaps_Logo_DarkGray.svg');
    expect(html).toContain('fresh-a');
    expect(html).toContain('View all 2 photos');
  });

  it('NEVER uses an old stored photo, even when everything else is fine', async () => {
    const html = await render(FRESH).markup;
    expect(html).not.toContain(STORED_MARKER);
  });

  it.each([429, 500, 503, 403])('Google %s shows "Photos temporarily unavailable" and no stored photo', async (status) => {
    const { markup } = render(FRESH, async () => jsonResponse({}, status));
    const html = await markup;
    expect(textOf(html)).toContain('Photos temporarily unavailable');
    expect(html).not.toContain(STORED_MARKER);
    expect(html).not.toContain('Photo by');
  });

  it('a timeout shows "Photos temporarily unavailable" and no stored photo', async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_res, rej) => (init.signal as AbortSignal).addEventListener('abort', () => rej((init.signal as AbortSignal).reason))));
    const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false, timeoutMs: 20 });
    const html = renderToStaticMarkup(await StayPhotoSection({ stay, eligiblePlaceId: PLACE, deps: { env: FRESH, getClientKey: async () => 'c', fetchPhotos: fetcher } }));
    expect(textOf(html)).toContain('Photos temporarily unavailable');
    expect(html).not.toContain(STORED_MARKER);
  });

  it('Google returns no photos: shows the placeholder, never a stored photo', async () => {
    const html = await render(FRESH, async () => jsonResponse({})).markup;
    expect(textOf(html)).toContain('Photo unavailable');
    expect(textOf(html)).not.toContain('temporarily');
    expect(html).not.toContain(STORED_MARKER);
  });

  it('a photo with an incomplete author credit is hidden; the credited one stays', async () => {
    const body = { photos: [photo('hidden-incomplete', { authorAttributions: [{ displayName: '' }] }), photo('shown-ok')] };
    const html = await render(FRESH, async () => jsonResponse(body)).markup;
    expect(html).toContain('shown-ok');
    expect(html).not.toContain('hidden-incomplete');
    expect(html).not.toContain('View all');
  });

  it('a photo with no valid photo-specific Google Maps link is hidden; the linked one stays', async () => {
    const body = { photos: [photo('hidden-no-link', { googleMapsUri: undefined }), photo('hidden-bad-link', { googleMapsUri: 'javascript:alert(1)' }), photo('shown-ok')] };
    const html = await render(FRESH, async () => jsonResponse(body)).markup;
    expect(html).toContain('shown-ok');
    expect(html).not.toContain('hidden-no-link');
    expect(html).not.toContain('hidden-bad-link');
    expect(html).not.toContain('javascript:');
  });

  it('when no photo qualifies (all incomplete or unlinked) the placeholder is shown, never an uncredited photo', async () => {
    const body = { photos: [photo('a', { authorAttributions: 'x' }), photo('b', { googleMapsUri: undefined })] };
    const html = await render(FRESH, async () => jsonResponse(body)).markup;
    expect(textOf(html)).toContain('Photo unavailable');
    expect(html).not.toContain(STORED_MARKER);
    expect(html).not.toContain('Photo by');
  });

  it('renders several photographers correctly', async () => {
    const body = { photos: [photo('a', { authorAttributions: [{ displayName: 'One' }, { displayName: 'Two' }, { displayName: 'Three' }] })] };
    const html = await render(FRESH, async () => jsonResponse(body)).markup;
    expect(textOf(html)).toContain('Photo by One , Two and Three');
  });

  it('with no EligiblePlaceId (not found, excluded or unavailable lookup) makes ZERO Google requests and shows the unavailable state', async () => {
    const { markup, fetchImpl, getClientKey } = render(FRESH, undefined, null);
    const html = await markup;
    expect(textOf(html)).toContain('Photos temporarily unavailable');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(getClientKey).not.toHaveBeenCalled();
    expect(html).not.toContain(STORED_MARKER);
  });
});

describe('privacy, safety and scope', () => {
  it('the API key appears in no output in any mode or outcome', async () => {
    const htmls = await Promise.all([
      render(FRESH).markup,
      render(FRESH, async () => jsonResponse({ error: { message: `bad ${KEY}` } }, 403)).markup,
      render(FRESH, () => Promise.reject(new Error(`leak ${KEY}`))).markup,
      render({ GOOGLE_PHOTO_METADATA_MODE: 'disabled', GOOGLE_PLACES_API_KEY: KEY }).markup,
      render({ GOOGLE_PLACES_API_KEY: KEY }).markup
    ]);
    for (const html of htmls) {
      expect(html).not.toContain(KEY);
      expect(html).not.toMatch(/X-Goog|AIza|maps\.googleapis\.com/i);
    }
  });

  it('logs nothing (no place ID, photo name, photographer or key)', async () => {
    const sinks = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')].map((spy) => spy.mockImplementation(() => undefined));
    await render(FRESH).markup;
    await render(FRESH, async () => jsonResponse({}, 500)).markup;
    await render({}).markup;
    expect(sinks.flatMap((sink) => sink.mock.calls)).toEqual([]);
  });

  it('renders no price, availability, booking or enquiry wording in any state (Stays stay view-only)', async () => {
    const htmls = await Promise.all([render({}).markup, render(FRESH).markup, render(FRESH, async () => jsonResponse({}, 500)).markup, render(FRESH, async () => jsonResponse({})).markup]);
    // "unavailable" is the honest failure wording, so only genuine availability claims are matched (not after "un").
    for (const html of htmls) expect(textOf(html)).not.toMatch(/₹|\bprice\b|(?<!un)availab(le|ility)|book(ing)? now|whatsapp|enquir|check-?in|reserve/i);
  });

  it('the default dependencies use the real fetcher, the real environment and a lazy request-header read (nothing at import time)', async () => {
    // With the real defaults and no mode set, the section is legacy: it must not read headers or call Google.
    const globalFetch = vi.spyOn(globalThis, 'fetch');
    const html = renderToStaticMarkup(await StayPhotoSection({ stay, eligiblePlaceId: PLACE }));
    expect(globalFetch).not.toHaveBeenCalled();
    expect(html).toBe(renderToStaticMarkup(<PropertyPhotoGallery photos={STORED_PHOTOS} propertyName="Riverside Hotel" />));
  });
});

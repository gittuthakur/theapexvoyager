import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFreshPhotoFetcher, type EligiblePlaceId } from '@/lib/googlePhotoFetch';
import type { Stay } from '@/types/stay';
import { StayPhotoSection } from './StayPhotoSection';

const KEY = 'test-key-not-real-1234567890';
const PLACE = 'ChIJreal_-123' as EligiblePlaceId;
const STORED = [`/api/places/photo?name=${encodeURIComponent(`places/${PLACE}/photos/STORED-OLD-1`)}&w=1200`];
const stay: Stay = { placeId: PLACE, name: 'Riverside Hotel', slug: 'riverside-hotel', stayType: 'hotel', photos: STORED, destinationSlug: 'manali', source: 'google' };
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1' };
const photo = (token: string) => ({
  name: `places/${PLACE}/photos/FRESH-NAME-${token}`,
  authorAttributions: [AUTHOR],
  googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/${token}`,
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function render(env: Record<string, string | undefined>, respond: () => Promise<Response> = async () => json({ photos: [photo('one'), photo('two')] })) {
  const fetchImpl = vi.fn(respond);
  const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false });
  const html = (async () => renderToStaticMarkup(await StayPhotoSection({ stay, eligiblePlaceId: PLACE, deps: { env, getClientKey: async () => '203.0.113.7', fetchPhotos: fetcher } })))();
  return { html, fetchImpl };
}

const DISPLAY = { GOOGLE_PHOTO_DISPLAY_MODE: 'display-time', GOOGLE_PLACES_API_KEY: KEY };
afterEach(() => vi.restoreAllMocks());

describe('detail page in display-time mode', () => {
  it('renders the credited gallery from by-place URLs with no photo name, stored URL or key anywhere in the HTML', async () => {
    const { html: promise, fetchImpl } = render(DISPLAY);
    const html = await promise;

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(html).toContain('/api/places/photo/by-place?placeId=ChIJreal_-123');
    for (const forbidden of ['FRESH-NAME', 'STORED-OLD', 'api/places/photo?name', 'places%2F', '/photos/FRESH', KEY]) expect(html).not.toContain(forbidden);
    // Every image is requested by position with the match key; the thumbnails use the small canonical width.
    expect(html).toMatch(/by-place\?placeId=ChIJreal_-123&amp;i=0&amp;w=1200&amp;k=[0-9a-f]{16}/);
    expect(html).toMatch(/by-place\?placeId=ChIJreal_-123&amp;i=1&amp;w=192&amp;k=[0-9a-f]{16}/);
  });

  it('keeps author credit, the photo-specific Google Maps link, the report link and the Google Maps logo', async () => {
    const html = await render(DISPLAY).html;
    expect(textOf(html)).toContain('Photo by Asha Verma');
    expect(html).toContain('href="https://www.google.com/maps/contrib/1"');
    expect(html).toContain('/maps/place/@1,1,3a/photos/one');
    expect(textOf(html)).toContain('View photo on Google Maps');
    expect(html).toContain('image_key=one');
    expect(textOf(html)).toContain('Report a problem with this photo');
    expect(html).toContain('GoogleMaps_Logo');
  });

  it('does not need GOOGLE_PHOTO_METADATA_MODE=fresh', async () => {
    const html = await render({ ...DISPLAY, GOOGLE_PHOTO_METADATA_MODE: 'legacy' }).html;
    expect(textOf(html)).toContain('Photo by Asha Verma');
  });

  it('a failed Google lookup shows "Photos temporarily unavailable" and never a stored photo', async () => {
    const html = await render(DISPLAY, async () => json({}, 429)).html;
    expect(textOf(html)).toContain('Photos temporarily unavailable');
    expect(html).not.toContain('STORED-OLD');
  });

  it('outside the pilot allowlist: placeholder, no stored photo, no Google request', async () => {
    const { html: promise, fetchImpl } = render({ ...DISPLAY, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJother' });
    const html = await promise;
    expect(html).not.toContain('STORED-OLD');
    expect(html).not.toContain('by-place');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('no price, availability, booking or enquiry wording appears', async () => {
    const text = textOf(await render(DISPLAY).html).toLowerCase();
    for (const word of ['book now', 'per night', 'available', 'price']) expect(text).not.toContain(word);
  });
});

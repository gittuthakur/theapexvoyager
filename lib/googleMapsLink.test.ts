import { describe, expect, it } from 'vitest';
import { buildGoogleMapsUrl } from './googleMapsLink';

describe('buildGoogleMapsUrl', () => {
  it('prefers a real, provider-returned googleMapsUri over generating one', () => {
    const url = buildGoogleMapsUrl({ googleMapsUri: 'https://maps.google.com/?cid=123', placeId: 'ChIJ-real-id' });
    expect(url).toBe('https://maps.google.com/?cid=123');
  });

  it('generates a URL from placeId when no googleMapsUri is present', () => {
    const url = buildGoogleMapsUrl({ placeId: 'ChIJ-real-id' });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Google&query_place_id=ChIJ-real-id');
  });

  it('URL-encodes the placeId in the generated query', () => {
    const url = buildGoogleMapsUrl({ placeId: 'ChIJ special/id+chars' });
    expect(url).toContain(`query_place_id=${encodeURIComponent('ChIJ special/id+chars')}`);
    expect(url).not.toContain('ChIJ special/id+chars'); // the raw, unencoded value must never appear
  });

  it('returns undefined (never a fabricated link) when neither googleMapsUri nor placeId exists', () => {
    expect(buildGoogleMapsUrl({})).toBeUndefined();
  });

  it('returns undefined for an empty-string placeId — never builds a link from nothing', () => {
    expect(buildGoogleMapsUrl({ placeId: '' })).toBeUndefined();
  });
});

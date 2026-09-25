import { describe, expect, it } from 'vitest';
import { clampPhotoWidth, DEFAULT_PHOTO_WIDTH_PX, MAX_PHOTO_WIDTH_PX, MIN_PHOTO_WIDTH_PX, withPhotoWidth } from './placePhotoUrl';

describe('clampPhotoWidth', () => {
  it('accepts a valid width unchanged', () => {
    expect(clampPhotoWidth(640)).toBe(640);
    expect(clampPhotoWidth('640')).toBe(640);
  });

  it('rounds a fractional width', () => {
    expect(clampPhotoWidth(639.6)).toBe(640);
  });

  it('clamps below the minimum bound', () => {
    expect(clampPhotoWidth(1)).toBe(MIN_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(0)).toBe(MIN_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(-500)).toBe(MIN_PHOTO_WIDTH_PX);
  });

  it('clamps above the maximum bound — no arbitrarily large upstream request is possible', () => {
    expect(clampPhotoWidth(999999)).toBe(MAX_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(4800)).toBe(MAX_PHOTO_WIDTH_PX);
  });

  it('defaults safely for non-numeric, NaN, null, or missing input', () => {
    expect(clampPhotoWidth('not-a-number')).toBe(DEFAULT_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(NaN)).toBe(DEFAULT_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(null)).toBe(DEFAULT_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(undefined)).toBe(DEFAULT_PHOTO_WIDTH_PX);
    expect(clampPhotoWidth(Infinity)).toBe(DEFAULT_PHOTO_WIDTH_PX);
  });
});

describe('withPhotoWidth', () => {
  const PHOTO_URL = '/api/places/photo?name=places%2FChIJabc123%2Fphotos%2FAVxyz&w=1200';

  it('rewrites the w parameter to the requested (clamped) width', () => {
    expect(withPhotoWidth(PHOTO_URL, 192)).toBe('/api/places/photo?name=places%2FChIJabc123%2Fphotos%2FAVxyz&w=192');
  });

  it('never changes the photo name/identity — only the w parameter', () => {
    const result = withPhotoWidth(PHOTO_URL, 640);
    const url = new URL(result, 'http://localhost');
    expect(url.searchParams.get('name')).toBe('places/ChIJabc123/photos/AVxyz');
  });

  it('clamps an out-of-range requested width rather than passing it through raw', () => {
    expect(new URL(withPhotoWidth(PHOTO_URL, 99999), 'http://localhost').searchParams.get('w')).toBe(String(MAX_PHOTO_WIDTH_PX));
    expect(new URL(withPhotoWidth(PHOTO_URL, -10), 'http://localhost').searchParams.get('w')).toBe(String(MIN_PHOTO_WIDTH_PX));
  });

  it('works whether or not the original URL already had a w parameter', () => {
    const noWidth = '/api/places/photo?name=places%2FChIJabc123%2Fphotos%2FAVxyz';
    expect(new URL(withPhotoWidth(noWidth, 320), 'http://localhost').searchParams.get('w')).toBe('320');
  });

  it('leaves a non-photo-proxy URL completely untouched — never an open rewriter', () => {
    expect(withPhotoWidth('/images/hero.jpg', 100)).toBe('/images/hero.jpg');
    expect(withPhotoWidth('https://evil.example.com/x?w=1', 100)).toBe('https://evil.example.com/x?w=1');
  });

  it('handles a malformed URL gracefully rather than throwing', () => {
    expect(() => withPhotoWidth('/api/places/photo?name=%', 100)).not.toThrow();
  });
});

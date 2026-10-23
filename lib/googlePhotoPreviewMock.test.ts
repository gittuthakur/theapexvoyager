import { describe, expect, it } from 'vitest';
import { GOOGLE_PHOTO_PREVIEW_MOCK_ENV, PREVIEW_MOCK_JPEG, googlePhotoPreviewMockMode } from './googlePhotoPreviewMock';

describe('Google Photo Preview mock gate', () => {
  it('is off by default and ignores all non-explicit values', () => {
    for (const value of [undefined, '', 'on', 'true', 'mock', 'disabled', ' enabled-now ']) {
      expect(googlePhotoPreviewMockMode({ [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: value, VERCEL: '1', VERCEL_ENV: 'preview' })).toBe('off');
    }
  });

  it('allows only an explicit setting in Vercel Preview', () => {
    expect(googlePhotoPreviewMockMode({ [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: ' Enabled ', VERCEL: '1', VERCEL_ENV: 'preview' })).toBe('enabled');
  });

  it('refuses an explicit setting outside Vercel Preview', () => {
    for (const env of [
      { [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: 'enabled' },
      { [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: 'enabled', VERCEL: '1', VERCEL_ENV: 'production' },
      { [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: 'enabled', VERCEL_ENV: 'preview' },
      { [GOOGLE_PHOTO_PREVIEW_MOCK_ENV]: 'enabled', VERCEL: '1', VERCEL_ENV: 'development' }
    ]) expect(googlePhotoPreviewMockMode(env)).toBe('refused');
  });

  it('embeds a structurally valid 1x1 baseline JPEG', () => {
    const b = Buffer.from(PREVIEW_MOCK_JPEG);
    expect([...b.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect([...b.subarray(-2)]).toEqual([0xff, 0xd9]);
    const markers: number[] = [];
    let dims: [number, number] | null = null;
    for (let i = 2; i < b.length - 2; ) {
      expect(b[i]).toBe(0xff);
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      markers.push(marker);
      if (marker === 0xc0) dims = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
      if (marker === 0xda) break;
    }
    expect(markers).toEqual(expect.arrayContaining([0xdb, 0xc0, 0xc4, 0xda]));
    expect(dims).toEqual([1, 1]);
  });
});

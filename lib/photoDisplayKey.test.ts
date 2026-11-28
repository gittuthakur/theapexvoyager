import { describe, expect, it } from 'vitest';
import { PHOTO_DISPLAY_KEY_PATTERN, photoDisplayKey } from './photoDisplayKey';

describe('photoDisplayKey', () => {
  const uri = 'https://www.google.com/maps/place/@1,1,3a/photos/abc';

  it('is a stable 16-hex key derived from the photo Maps link, and differs per photo', () => {
    expect(photoDisplayKey(uri)).toMatch(PHOTO_DISPLAY_KEY_PATTERN);
    expect(photoDisplayKey(uri)).toBe(photoDisplayKey(uri));
    expect(photoDisplayKey(uri)).not.toBe(photoDisplayKey(`${uri}2`));
  });

  it('does not contain the link or any part of a Google photo name', () => {
    const key = photoDisplayKey('places/ChIJabc/photos/SECRETTOKEN');
    expect(key).not.toContain('SECRET');
    expect(key).toHaveLength(16);
  });

  it('rejects anything that is not exactly 16 lowercase hex characters', () => {
    for (const bad of ['', 'abc', 'ABCDEF0123456789', '0123456789abcdeg', '0123456789abcdef0']) expect(PHOTO_DISPLAY_KEY_PATTERN.test(bad)).toBe(false);
  });
});

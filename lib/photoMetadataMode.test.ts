import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHOTO_METADATA_MODE_ENV, photoMetadataMode } from './photoMetadataMode';

describe('photoMetadataMode', () => {
  it('reads GOOGLE_PHOTO_METADATA_MODE', () => {
    expect(PHOTO_METADATA_MODE_ENV).toBe('GOOGLE_PHOTO_METADATA_MODE');
  });

  it('resolves the three supported modes, ignoring case and surrounding whitespace', () => {
    for (const [raw, mode] of [
      ['legacy', 'legacy'],
      ['fresh', 'fresh'],
      ['disabled', 'disabled'],
      ['FRESH', 'fresh'],
      [' Disabled ', 'disabled'],
      ['\tLegacy\n', 'legacy']
    ] as const) {
      expect(photoMetadataMode({ GOOGLE_PHOTO_METADATA_MODE: raw }), JSON.stringify(raw)).toBe(mode);
    }
  });

  it('unset, empty or unknown values resolve to legacy (a typo can never switch anything on or off)', () => {
    for (const raw of [undefined, '', '   ', 'on', 'true', 'enabled', 'off', 'freshh', 'fresh,disabled', '1', 'null']) {
      expect(photoMetadataMode({ GOOGLE_PHOTO_METADATA_MODE: raw }), JSON.stringify(raw)).toBe('legacy');
    }
    expect(photoMetadataMode({})).toBe('legacy');
  });

  it('ignores every other environment variable, including the photo proxy kill switch', () => {
    expect(photoMetadataMode({ GOOGLE_PHOTO_PROXY_MODE: 'disabled', GOOGLE_PLACES_API_KEY: 'x', NODE_ENV: 'production' })).toBe('legacy');
  });

  it('is pure: it reads only the object it is given and touches no global environment', () => {
    const source = readFileSync(join(process.cwd(), 'lib/photoMetadataMode.ts'), 'utf8');
    expect(source).not.toMatch(/process\.env|import /);
  });

  it('documents that legacy only preserves current behaviour and is not a compliance statement', () => {
    const source = readFileSync(join(process.cwd(), 'lib/photoMetadataMode.ts'), 'utf8').replace(/\s+/g, ' ');
    expect(source).toContain('NOT a statement that the current behaviour complies');
  });
});

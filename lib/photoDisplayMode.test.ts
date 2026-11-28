import { describe, expect, it } from 'vitest';
import { cardPhotoModeFor, isPlaceIdAllowedForDisplay, photoDisplayMode, photoDisplayPilotPlaceIds } from './photoDisplayMode';
import { placePhotoByPlaceUrl } from './placePhotoUrl';

describe('photoDisplayMode', () => {
  it('defaults to legacy for unset, empty and unrecognised values', () => {
    expect(photoDisplayMode({})).toBe('legacy');
    expect(photoDisplayMode({ GOOGLE_PHOTO_DISPLAY_MODE: '' })).toBe('legacy');
    expect(photoDisplayMode({ GOOGLE_PHOTO_DISPLAY_MODE: 'on' })).toBe('legacy');
    expect(photoDisplayMode({ GOOGLE_PHOTO_DISPLAY_MODE: 'true' })).toBe('legacy');
  });
  it('is on only for an explicit display-time (case and whitespace tolerant)', () => {
    expect(photoDisplayMode({ GOOGLE_PHOTO_DISPLAY_MODE: ' Display-Time ' })).toBe('display-time');
  });
});

describe('pilot allowlist', () => {
  const on = { GOOGLE_PHOTO_DISPLAY_MODE: 'display-time' };
  it('is not a restriction when unset or blank', () => {
    expect(photoDisplayPilotPlaceIds(on)).toBeNull();
    expect(photoDisplayPilotPlaceIds({ ...on, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: '  ' })).toBeNull();
    expect(isPlaceIdAllowedForDisplay('ChIJany', on)).toBe(true);
  });
  it('restricts to the listed, valid IDs only', () => {
    const env = { ...on, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJa, ChIJb ,bad id!,' };
    expect([...(photoDisplayPilotPlaceIds(env) ?? [])]).toEqual(['ChIJa', 'ChIJb']);
    expect(isPlaceIdAllowedForDisplay('ChIJa', env)).toBe(true);
    expect(isPlaceIdAllowedForDisplay('ChIJz', env)).toBe(false);
  });
  it('fails closed when the pilot value contains no valid ID', () => {
    const env = { ...on, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: '!!!' };
    expect(isPlaceIdAllowedForDisplay('ChIJa', env)).toBe(false);
  });
  it('nothing is allowed while the mode is legacy, whatever the pilot says', () => {
    expect(isPlaceIdAllowedForDisplay('ChIJa', { GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJa' })).toBe(false);
  });
});

describe('cardPhotoModeFor', () => {
  it('is undefined (legacy rendering) unless the mode is display-time', () => {
    expect(cardPhotoModeFor('ChIJa', {})).toBeUndefined();
    expect(cardPhotoModeFor('ChIJa', { GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJa' })).toBeUndefined();
  });
  it('is display-time for allowed places and unavailable for the rest', () => {
    const env = { GOOGLE_PHOTO_DISPLAY_MODE: 'display-time', GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJa' };
    expect(cardPhotoModeFor('ChIJa', env)).toBe('display-time');
    expect(cardPhotoModeFor('ChIJb', env)).toBe('unavailable');
  });
});

describe('placePhotoByPlaceUrl', () => {
  it('carries a place ID, an index and a canonical width bucket, and never a photo name', () => {
    const url = placePhotoByPlaceUrl('ChIJabc_-1', 0, 600);
    expect(url).toBe('/api/places/photo/by-place?placeId=ChIJabc_-1&i=0&w=640');
    expect(url).not.toContain('name=');
    expect(url).not.toContain('photos');
  });
  it('clamps a bad index to 0', () => {
    expect(placePhotoByPlaceUrl('ChIJa', -1, 640)).toContain('&i=0&');
    expect(placePhotoByPlaceUrl('ChIJa', 99, 640)).toContain('&i=0&');
  });
});

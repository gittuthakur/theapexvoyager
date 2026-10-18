import { describe, expect, it } from 'vitest';
import { PHOTO_PERSISTENCE_MODE_ENV, photoPersistenceMode } from './photoPersistenceMode';

const withMode = (value: string | undefined) => ({ [PHOTO_PERSISTENCE_MODE_ENV]: value });

describe('photoPersistenceMode', () => {
  it('uses the documented variable name', () => {
    expect(PHOTO_PERSISTENCE_MODE_ENV).toBe('GOOGLE_PHOTO_PERSISTENCE_MODE');
  });

  it('defaults to legacy when the variable is unset, undefined or the environment is empty', () => {
    expect(photoPersistenceMode({})).toBe('legacy');
    expect(photoPersistenceMode(withMode(undefined))).toBe('legacy');
  });

  it.each(['', ' ', '\t', '\n'])('treats an empty or blank value (%j) as legacy', (value) => {
    expect(photoPersistenceMode(withMode(value))).toBe('legacy');
  });

  it.each(['legacy', 'LEGACY', ' Legacy '])('accepts legacy explicitly (%j)', (value) => {
    expect(photoPersistenceMode(withMode(value))).toBe('legacy');
  });

  it.each(['shadow', 'SHADOW', 'Shadow', '  shadow  ', '\tshadow\n'])('enables shadow only for an explicit shadow (%j)', (value) => {
    expect(photoPersistenceMode(withMode(value))).toBe('shadow');
  });

  it.each([
    'stop-new-writes',
    'STOP-NEW-WRITES',
    'enforce',
    'enforcement',
    'enforced',
    'disabled',
    'fresh',
    'on',
    'true',
    '1',
    'yes',
    'shadows',
    'shadow-enforce',
    'shad0w',
    'sh adow',
    'shadow;enforce',
    'shadow,legacy',
    '"shadow"',
    "'shadow'",
    'photo-shadow',
    'undefined',
    'null'
  ])('resolves an unknown or reserved value (%j) to legacy, so nothing is ever enabled by accident', (value) => {
    expect(photoPersistenceMode(withMode(value))).toBe('legacy');
  });

  it('never returns anything other than legacy or shadow, for any input', () => {
    for (const value of ['x', 'stop-new-writes', 'enforce', ' shadow', 'SHADOW ', '', undefined, 'shadow\u0000', 'shadow​']) {
      expect(['legacy', 'shadow']).toContain(photoPersistenceMode(withMode(value)));
    }
  });

  it('ignores other variables, including the other photo mode switches', () => {
    expect(photoPersistenceMode({ GOOGLE_PHOTO_METADATA_MODE: 'fresh', GOOGLE_PHOTO_PROXY_MODE: 'shadow', SHADOW: 'shadow' })).toBe('legacy');
  });

  it('does not read process.env itself (the caller passes the environment)', () => {
    const original = process.env[PHOTO_PERSISTENCE_MODE_ENV];
    process.env[PHOTO_PERSISTENCE_MODE_ENV] = 'shadow';
    try {
      expect(photoPersistenceMode({})).toBe('legacy');
    } finally {
      if (original === undefined) delete process.env[PHOTO_PERSISTENCE_MODE_ENV];
      else process.env[PHOTO_PERSISTENCE_MODE_ENV] = original;
    }
  });
});

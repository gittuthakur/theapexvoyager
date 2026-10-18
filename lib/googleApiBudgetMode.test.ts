import { describe, expect, it } from 'vitest';
import { GOOGLE_API_BUDGET_MODE_ENV, googleApiBudgetMode } from './googleApiBudgetMode';

const withMode = (value: string | undefined) => ({ [GOOGLE_API_BUDGET_MODE_ENV]: value });

describe('googleApiBudgetMode', () => {
  it('uses the documented variable name', () => {
    expect(GOOGLE_API_BUDGET_MODE_ENV).toBe('GOOGLE_API_BUDGET_MODE');
  });

  it('is OFF by default: unset variable, undefined value or an empty environment', () => {
    expect(googleApiBudgetMode({})).toBe('off');
    expect(googleApiBudgetMode(withMode(undefined))).toBe('off');
  });

  it.each(['', ' ', '\t', '\n'])('treats an empty or blank value (%j) as off', (value) => {
    expect(googleApiBudgetMode(withMode(value))).toBe('off');
  });

  it.each(['off', 'OFF', ' Off '])('accepts off explicitly (%j)', (value) => {
    expect(googleApiBudgetMode(withMode(value))).toBe('off');
  });

  it.each(['shadow', 'SHADOW', 'Shadow', '  shadow  ', '\tshadow\n'])('enables shadow only for an explicit shadow (%j)', (value) => {
    expect(googleApiBudgetMode(withMode(value))).toBe('shadow');
  });

  it.each(['enforce', 'ENFORCE', 'Enforce', '  enforce  ', '\tenforce\n'])('enables enforcement only for an explicit enforce (%j)', (value) => {
    expect(googleApiBudgetMode(withMode(value))).toBe('enforce');
  });

  it.each([
    'enforced',
    'enforcing',
    'enforcement',
    'enforce-all',
    'enforce;shadow',
    'enforce,shadow',
    'shadow,enforce',
    'shadow-enforce',
    '"enforce"',
    "'enforce'",
    'enfore',
    'enforce\u0000',
    'enforce​',
    'ｅｎｆｏｒｃｅ',
    'en force',
    'on',
    'true',
    'yes',
    '1',
    'block',
    'blocking',
    'strict',
    'stop-new-writes',
    'disabled',
    'live',
    'fresh',
    'shadows',
    'undefined',
    'null',
    'false',
    '0'
  ])('an invalid or look-alike value (%j) can never enable enforcement or shadow: it is off', (value) => {
    expect(googleApiBudgetMode(withMode(value))).toBe('off');
  });

  it('never returns anything other than off, shadow or enforce, whatever the input', () => {
    for (const value of ['x', 'enforce', ' SHADOW ', '', undefined, 'enforce\u0000', 'ENFORCE ', '﻿enforce']) {
      expect(['off', 'shadow', 'enforce']).toContain(googleApiBudgetMode(withMode(value)));
    }
  });

  it('ignores every other variable, including the other Google switches', () => {
    expect(
      googleApiBudgetMode({
        GOOGLE_REGION_ATTRACTIONS_MODE: 'disabled',
        GOOGLE_DESTINATION_LIVE_SEARCH: 'disabled',
        GOOGLE_PHOTO_PROXY_MODE: 'disabled',
        GOOGLE_PHOTO_METADATA_MODE: 'fresh',
        GOOGLE_PHOTO_PERSISTENCE_MODE: 'shadow',
        GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY: '5',
        BUDGET_MODE: 'enforce',
        MODE: 'enforce'
      })
    ).toBe('off');
  });

  it('does not read process.env itself (the caller passes the environment)', () => {
    const original = process.env[GOOGLE_API_BUDGET_MODE_ENV];
    process.env[GOOGLE_API_BUDGET_MODE_ENV] = 'enforce';
    try {
      expect(googleApiBudgetMode({})).toBe('off');
    } finally {
      if (original === undefined) delete process.env[GOOGLE_API_BUDGET_MODE_ENV];
      else process.env[GOOGLE_API_BUDGET_MODE_ENV] = original;
    }
  });
});

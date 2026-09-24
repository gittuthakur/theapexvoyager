import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidCalendarDateISO, todayISOInIST, validateJourneyTravelDate } from './dateValidation';

describe('isValidCalendarDateISO', () => {
  it('accepts a well-formed future calendar date', () => {
    expect(isValidCalendarDateISO('2026-10-10')).toBe(true);
  });

  it('rejects a non-YYYY-MM-DD format', () => {
    expect(isValidCalendarDateISO('10-10-2026')).toBe(false);
    expect(isValidCalendarDateISO('2026-1-1')).toBe(false);
    expect(isValidCalendarDateISO('2026-10-10T00:00:00Z')).toBe(false);
    expect(isValidCalendarDateISO('')).toBe(false);
  });

  it('rejects an impossible calendar date instead of silently rolling it over', () => {
    expect(isValidCalendarDateISO('2026-02-30')).toBe(false);
    expect(isValidCalendarDateISO('2026-13-01')).toBe(false);
    expect(isValidCalendarDateISO('2026-04-31')).toBe(false);
  });

  it('correctly handles a real leap day', () => {
    expect(isValidCalendarDateISO('2028-02-29')).toBe(true); // 2028 is a leap year
    expect(isValidCalendarDateISO('2026-02-29')).toBe(false); // 2026 is not
  });
});

describe('todayISOInIST / validateJourneyTravelDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes IST "today" independent of the host process timezone (fixed +5:30, no DST)', () => {
    // 2026-01-01T20:00:00Z is 2026-01-02T01:30 IST — a different calendar day in UTC vs
    // IST, which is exactly the off-by-one this function must avoid.
    vi.setSystemTime(new Date('2026-01-01T20:00:00.000Z'));
    expect(todayISOInIST()).toBe('2026-01-02');
  });

  it('accepts a future date', () => {
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    expect(validateJourneyTravelDate('2026-06-15')).toEqual({ valid: true });
  });

  it('rejects an invalid format before ever checking "is it in the past"', () => {
    expect(validateJourneyTravelDate('2026-02-30')).toEqual({ valid: false, reason: 'INVALID_FORMAT' });
    expect(validateJourneyTravelDate('')).toEqual({ valid: false, reason: 'INVALID_FORMAT' });
  });

  it('rejects a past date', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    expect(validateJourneyTravelDate('2026-06-01')).toEqual({ valid: false, reason: 'PAST_DATE' });
  });

  it('accepts today itself (IST) as the boundary, not "past"', () => {
    // 2026-06-15T10:00:00Z = 2026-06-15T15:30 IST — same IST calendar day.
    vi.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));
    expect(validateJourneyTravelDate('2026-06-15')).toEqual({ valid: true });
  });

  it('the IST midnight boundary never produces a UTC/local off-by-one: a date that is "today" in IST but still "yesterday" in UTC is accepted, not rejected', () => {
    // 2026-06-15T19:00:00Z is still 2026-06-16T00:30 IST — travelDate "2026-06-16" must
    // be accepted (it IS today-in-IST), which a naive UTC-based comparison would get wrong.
    vi.setSystemTime(new Date('2026-06-15T19:00:00.000Z'));
    expect(validateJourneyTravelDate('2026-06-16')).toEqual({ valid: true });
    expect(validateJourneyTravelDate('2026-06-15')).toEqual({ valid: false, reason: 'PAST_DATE' });
  });
});

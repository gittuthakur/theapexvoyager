import { describe, expect, it } from 'vitest';
import {
  copyTripPreferences,
  describeStayPreferences,
  describeTripPreferences,
  journeyPreferenceParams,
  parsePreferenceCount,
  parsePreferenceDate,
  readStayPreferences,
  readTripPreferences,
  singleDatePreferenceParams
} from '@/lib/tripPreferences';

const NOW = new Date('2027-01-10T09:00:00');

describe('parsePreferenceDate', () => {
  it('accepts today and future real dates', () => {
    expect(parsePreferenceDate('2027-01-10', NOW)).toBe('2027-01-10');
    expect(parsePreferenceDate('2027-03-05', NOW)).toBe('2027-03-05');
  });
  it('rejects past, malformed and calendar-rollover dates', () => {
    for (const bad of ['2027-01-09', '2026-12-31', '2027-02-30', '2027-13-01', '27-01-20', 'tomorrow', '', undefined, null]) {
      expect(parsePreferenceDate(bad as string | undefined, NOW), String(bad)).toBeUndefined();
    }
  });
});

describe('parsePreferenceCount', () => {
  it('accepts whole numbers within range, boundaries included', () => {
    expect(parsePreferenceCount('1', { min: 1, max: 16 })).toBe('1');
    expect(parsePreferenceCount('16', { min: 1, max: 16 })).toBe('16');
    expect(parsePreferenceCount('0', { min: 0, max: 10 })).toBe('0');
  });
  it('rejects out-of-range, fractional, negative and non-numeric values', () => {
    for (const bad of ['0', '17', '-1', '2.5', 'abc', '1e2', '', ' 2', '1000']) {
      expect(parsePreferenceCount(bad, { min: 1, max: 16 }), bad).toBeUndefined();
    }
  });
});

describe('readTripPreferences', () => {
  it('reads valid journey, experience and expert preferences from URLSearchParams', () => {
    const params = new URLSearchParams(
      'travelStartDate=2027-02-01&travelEndDate=2027-02-05&adults=2&children=1&preferredDate=2027-03-01&participants=4&travelers=3'
    );
    expect(readTripPreferences(params, NOW)).toEqual({
      travelStartDate: '2027-02-01',
      travelEndDate: '2027-02-05',
      adults: '2',
      children: '1',
      preferredDate: '2027-03-01',
      participants: '4',
      travelers: '3'
    });
  });
  it('reads from a Next searchParams record (arrays take the first value)', () => {
    expect(readTripPreferences({ travelStartDate: ['2027-02-01', '2027-02-09'], adults: '3' }, NOW)).toEqual({
      travelStartDate: '2027-02-01',
      adults: '3'
    });
  });
  it('drops an end date that has no valid start or precedes it', () => {
    expect(readTripPreferences(new URLSearchParams('travelEndDate=2027-02-05'), NOW)).toEqual({});
    expect(readTripPreferences(new URLSearchParams('travelStartDate=2027-02-05&travelEndDate=2027-02-01'), NOW)).toEqual({
      travelStartDate: '2027-02-05'
    });
  });
  it('drops every malformed value instead of showing or carrying it', () => {
    const junk = new URLSearchParams('travelStartDate=2020-01-01&adults=abc&children=99&participants=0&travelers=-3&preferredDate=soon');
    expect(readTripPreferences(junk, NOW)).toEqual({});
  });
  it('ignores unrelated params', () => {
    expect(readTripPreferences(new URLSearchParams('destination=Manali&category=Adventure'), NOW)).toEqual({});
  });
});

describe('copyTripPreferences (explorers rebuild their query but must keep preferences)', () => {
  it('keeps valid preferences and nothing else when rebuilding a query', () => {
    const rebuilt = new URLSearchParams('destination=Kullu&category=Adventure');
    copyTripPreferences(new URLSearchParams('destination=OLD&travelStartDate=2099-02-01&adults=2&bogus=1'), rebuilt);
    expect(rebuilt.get('destination')).toBe('Kullu');
    expect(rebuilt.get('travelStartDate')).toBe('2099-02-01');
    expect(rebuilt.get('adults')).toBe('2');
    expect(rebuilt.has('bogus')).toBe(false);
  });
  it('does not invent preferences when there are none', () => {
    const rebuilt = new URLSearchParams('destination=Kullu');
    copyTripPreferences(new URLSearchParams(''), rebuilt);
    expect(rebuilt.toString()).toBe('destination=Kullu');
  });
});

describe('preference param builders', () => {
  const noDates = { checkIn: null, checkOut: null };
  it('Journeys: an untouched default party and no dates emits nothing', () => {
    expect(journeyPreferenceParams(noDates, { adults: 2, children: 0 })).toEqual({
      travelStartDate: undefined,
      travelEndDate: undefined,
      adults: undefined,
      children: undefined
    });
  });
  it('Journeys: dates emit the party alongside; a changed party emits without dates', () => {
    const withDates = journeyPreferenceParams({ checkIn: new Date(2027, 1, 1), checkOut: new Date(2027, 1, 5) }, { adults: 2, children: 0 });
    expect(withDates).toMatchObject({ travelStartDate: '2027-02-01', travelEndDate: '2027-02-05', adults: '2', children: undefined });
    const partyOnly = journeyPreferenceParams(noDates, { adults: 3, children: 2 });
    expect(partyOnly).toMatchObject({ travelStartDate: undefined, adults: '3', children: '2' });
  });
  it('Journeys: a check-in without a check-out emits only the start', () => {
    expect(journeyPreferenceParams({ checkIn: new Date(2027, 1, 1), checkOut: null }, { adults: 2, children: 0 })).toMatchObject({
      travelStartDate: '2027-02-01',
      travelEndDate: undefined
    });
  });
  it('Experiences / Experts: emit only when stated (date set or count changed)', () => {
    expect(singleDatePreferenceParams('participants', '', 2)).toEqual({ preferredDate: undefined, participants: undefined });
    expect(singleDatePreferenceParams('participants', '2027-03-01', 2)).toEqual({ preferredDate: '2027-03-01', participants: '2' });
    expect(singleDatePreferenceParams('travelers', '', 5)).toEqual({ preferredDate: undefined, travelers: '5' });
  });
});

describe('describeTripPreferences', () => {
  it('words preferences as preferences, never as availability', () => {
    const lines = describeTripPreferences({ travelStartDate: '2027-02-01', travelEndDate: '2027-02-05', adults: '2', children: '1' });
    expect(lines).toEqual(['Travel dates: 1 Feb – 5 Feb 2027', 'Travelers: 2 adults, 1 child']);
    expect(describeTripPreferences({ preferredDate: '2027-03-01', participants: '4' })).toEqual(['Preferred date: 1 Mar 2027', 'Participants: 4']);
    expect(describeTripPreferences({})).toEqual([]);
    for (const line of lines) expect(line).not.toMatch(/available|booked|booking|confirmed/i);
  });
});

describe('Stays preferences (checkIn / checkOut / guests)', () => {
  it('keeps valid values', () => {
    expect(readStayPreferences({ checkIn: '2027-02-01', checkOut: '2027-02-04', guests: '3' }, NOW)).toEqual({
      checkIn: '2027-02-01',
      checkOut: '2027-02-04',
      guests: '3'
    });
  });
  it('drops a check-out that is not after check-in (no zero-night stays) and any invalid value', () => {
    expect(readStayPreferences({ checkIn: '2027-02-01', checkOut: '2027-02-01' }, NOW)).toEqual({ checkIn: '2027-02-01' });
    expect(readStayPreferences({ checkOut: '2027-02-04' }, NOW)).toEqual({});
    expect(readStayPreferences({ checkIn: '2020-01-01', guests: 'abc' }, NOW)).toEqual({});
    expect(readStayPreferences({ guests: '0' }, NOW)).toEqual({});
  });
  it('describes them with singular/plural guests', () => {
    expect(describeStayPreferences({ checkIn: '2027-02-01', checkOut: '2027-02-04', guests: '1' })).toEqual([
      'Check-in 1 Feb 2027',
      'Check-out 4 Feb 2027',
      '1 guest'
    ]);
    expect(describeStayPreferences({ guests: '4' })).toEqual(['4 guests']);
  });
});

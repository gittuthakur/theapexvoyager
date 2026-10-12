import { describe, expect, it } from 'vitest';
import { findDestinationByText, resolveDestinationByLocationText } from '@/lib/search/destinationResolver';

const catalog = [
  { slug: 'manali', title: 'Manali' },
  { slug: 'dharamshala', title: 'Dharamshala' },
  { slug: 'mcleod-ganj', title: 'McLeod Ganj' },
  { slug: 'spiti-valley', title: 'Spiti Valley' },
  { slug: 'kaza', title: 'Kaza' },
  { slug: 'joshimath', title: 'Joshimath (Jyotirmath)' },
  { slug: 'shimla', title: 'Shimla' },
  { slug: 'kinnaur-valley', title: 'Kinnaur Valley' },
  { slug: 'sangla-valley', title: 'Sangla Valley' }
];
const slug = (text: string) => findDestinationByText(catalog, text)?.slug;

describe('destination resolution from free text', () => {
  it('resolves titles, slugs, parentheticals, no-space typing and verified aliases', () => {
    expect(slug('Manali')).toBe('manali');
    expect(slug('  mcleod-ganj ')).toBe('mcleod-ganj');
    expect(slug('Mcleodganj')).toBe('mcleod-ganj');
    expect(slug('Dharamsala')).toBe('dharamshala');
    expect(slug('Jyotirmath')).toBe('joshimath');
    expect(slug('Simla')).toBe('shimla');
  });
  it('resolves a whole-word part of exactly one title, and a title plus a generic locality word', () => {
    expect(slug('Spiti')).toBe('spiti-valley');
    expect(slug('Manali Bus Stand')).toBe('manali');
    expect(slug('manali  bus-stop')).toBe('manali');
    expect(slug('Shimla Market')).toBe('shimla');
  });
  it('text naming a second place or an airport/station is NOT reduced to the first destination found', () => {
    expect(slug('Kaza Manali')).toBeUndefined();
    expect(slug('Manali Kaza')).toBeUndefined();
    expect(slug('Manali, Kaza')).toBeUndefined();
    expect(slug('Manali Airport')).toBeUndefined();
    expect(slug('Shimla Railway Station')).toBeUndefined();
    expect(slug('Delhi Manali')).toBeUndefined();
  });
  it('is ambiguous, not arbitrary, when several destinations fit', () => {
    expect(resolveDestinationByLocationText(catalog, 'Valley').status).toBe('ambiguous');
    expect(slug('Valley')).toBeUndefined();
    expect(slug('Kaza Manali')).toBeUndefined();
  });
  it('never resolves a nearby or unknown place', () => {
    expect(slug('Chandigarh Airport')).toBeUndefined();
    expect(slug('Kullu')).toBeUndefined();
    expect(slug('nali')).toBeUndefined();
    expect(slug('')).toBeUndefined();
  });
});

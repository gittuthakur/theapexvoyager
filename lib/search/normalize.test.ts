import { describe, expect, it } from 'vitest';
import {
  compactSearchText,
  everyTokenIsWordPrefix,
  expandQueryTerms,
  hasPhrase,
  normalizeSearchText,
  searchForms,
  slugSearchForm,
  startsWithPhrase,
  stripDiacritics,
  tokenizeSearchText
} from '@/lib/search/normalize';
import { LOCATION_ALIASES } from '@/config/searchAliases.config';

describe('normalizeSearchText', () => {
  it('is case-insensitive and collapses/trims whitespace', () => {
    expect(normalizeSearchText('  MANALI   Premium\tEscape ')).toBe('manali premium escape');
  });
  it('treats slug and human-readable spellings as the same text', () => {
    expect(normalizeSearchText('spiti-valley')).toBe(normalizeSearchText('Spiti Valley'));
    expect(normalizeSearchText('kinnaur_spiti-circuit')).toBe('kinnaur spiti circuit');
  });
  it('reads "&" as "and" so region names match however they are typed', () => {
    expect(normalizeSearchText('Jammu & Kashmir')).toBe('jammu and kashmir');
    expect(normalizeSearchText('jammu and kashmir')).toBe('jammu and kashmir');
    expect(normalizeSearchText('Jammu&Kashmir')).toBe('jammu and kashmir');
  });
  it('normalizes punctuation safely (parentheses, commas, slashes, dots, apostrophes)', () => {
    expect(normalizeSearchText('Joshimath (Jyotirmath)')).toBe('joshimath jyotirmath');
    expect(normalizeSearchText('Day 1: Manali -> Kasol, 2 nights')).toBe('day 1 manali kasol 2 nights');
    expect(normalizeSearchText("McLeod's Ganj")).toBe('mcleods ganj');
    expect(normalizeSearchText('Auli/Chopta')).toBe('auli chopta');
  });
  it('removes diacritics', () => {
    expect(stripDiacritics('Café Zürich')).toBe('Cafe Zurich');
    expect(normalizeSearchText('Kāśmīr')).toBe('kasmir');
  });
  it('handles empty, null and non-string input without throwing', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText(42)).toBe('42');
  });
  it('never lets markup or regex characters through', () => {
    expect(normalizeSearchText('<script>alert(1)</script>')).toBe('script alert 1 script');
    expect(normalizeSearchText('[(.*)]')).toBe('');
  });
});

describe('derived forms', () => {
  it('compact and slug forms', () => {
    expect(compactSearchText('Spiti Valley')).toBe('spitivalley');
    expect(compactSearchText('McLeod Ganj')).toBe('mcleodganj');
    expect(slugSearchForm('Spiti Valley')).toBe('spiti-valley');
  });
  it('derives alternate forms from parentheticals of the stored text itself', () => {
    expect(searchForms('Joshimath (Jyotirmath)').sort()).toEqual(['jyotirmath', 'joshimath', 'joshimath jyotirmath'].sort());
    expect(searchForms('Manali')).toEqual(['manali']);
    expect(searchForms('')).toEqual([]);
  });
  it('tokenizes normalized text', () => {
    expect(tokenizeSearchText('a b  c'.replace('  ', ' '))).toEqual(['a', 'b', 'c']);
    expect(tokenizeSearchText('')).toEqual([]);
  });
});

describe('phrase and partial-word matching (no fuzzy matching)', () => {
  it('hasPhrase is whole-word', () => {
    expect(hasPhrase('day 2 manali to spiti valley', 'spiti valley')).toBe(true);
    expect(hasPhrase('day 2 manali to spiti valley', 'spiti')).toBe(true);
    expect(hasPhrase('manali', 'ali')).toBe(false);
    expect(hasPhrase('', 'x')).toBe(false);
    expect(hasPhrase('x', '')).toBe(false);
  });
  it('startsWithPhrase respects word boundaries', () => {
    expect(startsWithPhrase('spiti valley adventure', 'spiti valley')).toBe(true);
    expect(startsWithPhrase('spiti valley adventure', 'spiti val')).toBe(false);
    expect(startsWithPhrase('spiti', 'spiti')).toBe(true);
  });
  it('everyTokenIsWordPrefix supports partial words only as word prefixes', () => {
    expect(everyTokenIsWordPrefix('kashmir paradise tour', 'kash')).toBe(true);
    expect(everyTokenIsWordPrefix('spiti valley adventure', 'spiti val')).toBe(true);
    expect(everyTokenIsWordPrefix('manali premium escape', 'anali')).toBe(false);
    expect(everyTokenIsWordPrefix('manali', 'manalix')).toBe(false);
    expect(everyTokenIsWordPrefix('manali', '')).toBe(false);
  });
  it('does not forgive typos (no fuzzy matching)', () => {
    expect(everyTokenIsWordPrefix('manali', 'manalli')).toBe(false);
    expect(hasPhrase('shimla', 'simla')).toBe(false);
  });
});

describe('explicit aliases only', () => {
  const aliases = { simla: ['Shimla'], 'j and k': ['Jammu & Kashmir'] };
  it('expands only an exact normalized alias, original term first', () => {
    expect(expandQueryTerms('simla', aliases)).toEqual(['simla', 'shimla']);
    expect(expandQueryTerms('j and k', aliases)).toEqual(['j and k', 'jammu and kashmir']);
  });
  it('never expands a term that is not an explicit alias', () => {
    expect(expandQueryTerms('manali', aliases)).toEqual(['manali']);
    expect(expandQueryTerms('simlaa', aliases)).toEqual(['simlaa']);
    expect(expandQueryTerms('manali')).toEqual(['manali']);
  });
  it('the shipped alias map only holds spellings (normalized keys), no records', () => {
    for (const [alias, targets] of Object.entries(LOCATION_ALIASES)) {
      expect(alias).toBe(normalizeSearchText(alias));
      expect(targets.length).toBeGreaterThan(0);
    }
    expect(Object.keys(LOCATION_ALIASES).length).toBeLessThanOrEqual(10);
  });
});

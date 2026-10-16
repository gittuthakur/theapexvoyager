import { describe, expect, it } from 'vitest';
import robots from './robots';

const rules = () => {
  const value = robots().rules;
  return Array.isArray(value) ? value : [value];
};

describe('robots.txt rules', () => {
  it('keeps every existing disallow entry', () => {
    for (const rule of rules()) {
      const disallow = ([] as string[]).concat(rule.disallow ?? []);
      expect(disallow, String(rule.userAgent)).toEqual(expect.arrayContaining(['/internal/', '/bookings/']));
    }
  });

  it('also disallows the Google photo proxy for the wildcard rule and for every named crawler', () => {
    const all = rules();
    expect(all.length).toBeGreaterThan(1);
    for (const rule of all) {
      expect(([] as string[]).concat(rule.disallow ?? []), String(rule.userAgent)).toContain('/api/places/');
    }
  });

  it('adds nothing else: the disallow list is exactly the three expected paths', () => {
    for (const rule of rules()) expect(([] as string[]).concat(rule.disallow ?? [])).toEqual(['/internal/', '/bookings/', '/api/places/']);
  });

  it('keeps the site crawlable (allow /), the named search crawlers and the sitemap reference', () => {
    const all = rules();
    expect(all.every((rule) => rule.allow === '/')).toBe(true);
    expect(all.map((rule) => rule.userAgent)).toEqual(expect.arrayContaining(['*', 'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User']));
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

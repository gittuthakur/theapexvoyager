import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The repo has no DOM test environment, so the navbar's responsive contract is pinned at the class level. The real geometry
// (no logo/nav/actions overlap from 1280px up, 1366px+ unchanged) was measured in a browser when this guard was added.
const src = readFileSync(new URL('./Navbar.tsx', import.meta.url), 'utf8');

function tagWith(fragment: string): string {
  const start = src.indexOf(fragment);
  expect(start, `missing: ${fragment}`).toBeGreaterThan(-1);
  const open = src.lastIndexOf('<', start);
  return src.slice(open, src.indexOf('>', start) + 1);
}

describe('Navbar responsive layout', () => {
  it('keeps the three-column header grid and its padding', () => {
    expect(src).toContain('grid-cols-[auto_1fr_auto]');
    expect(src).toContain('px-4 py-4 sm:gap-6 sm:px-6 lg:px-8');
  });

  it('desktop nav appears at xl (1280px) and uses the tighter 12px item gap until 1366px, then the original 24px', () => {
    const nav = tagWith('xl:flex xl:gap-3');
    expect(nav).toContain('<nav');
    expect(nav).toContain('hidden');
    expect(nav).toContain('xl:gap-3');
    expect(nav).toContain('min-[1366px]:gap-6');
  });

  it('the desktop nav never carries the unconditional 24px gap that overflowed its track at 1280px', () => {
    const nav = tagWith('xl:flex xl:gap-3');
    expect(nav.split(/\s+/)).not.toContain('gap-6');
  });

  it('the breakpoint did not move: desktop cluster is xl:flex, hamburger cluster and mobile panel are xl:hidden', () => {
    expect(tagWith('hidden items-center justify-end gap-2 xl:flex')).toContain('<div');
    expect(tagWith('flex items-center gap-2 justify-self-end xl:hidden')).toContain('<div');
    expect(src).toContain("'flex flex-col gap-1 px-6 pb-4 overflow-y-auto xl:hidden'");
  });

  it('the logo, hero sizing and sticky/fixed behaviour are untouched', () => {
    expect(src).toContain("isTransparent ? 'h-[34px] sm:h-[60px]' : 'h-[34px] sm:h-[55px]'");
    expect(src).toContain("'absolute border-b border-transparent'");
    expect(src).toContain("[hasHero ? 'fixed' : 'sticky', 'bg-white/70 backdrop-blur-md shadow-sm shadow-slate-900/5']");
  });

  it('every nav link and dropdown is still rendered', () => {
    for (const key of ['journeys', 'stays', 'travelServices']) expect(src).toContain(`menuKey="${key}"`);
    expect(src).toContain('Plan My Journey');
    expect(src).toContain('aria-label="Toggle navigation menu"');
  });
});

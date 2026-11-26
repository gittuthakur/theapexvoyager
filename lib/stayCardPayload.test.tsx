import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StayCard } from '@/components/modules/StaysGrid';
import { STAY_CARD_PHOTO_LIMIT, toCardStay } from '@/lib/stayCardPayload';
import type { Stay } from '@/types/stay';

const photo = (id: number) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJabc123/photos/p${id}`)}&w=1200`;

function stay(photoCount: number): Stay {
  return {
    placeId: 'ChIJabc123',
    name: 'Test Property',
    slug: 'test-property',
    stayType: 'hotel',
    photos: Array.from({ length: photoCount }, (_, i) => photo(i)),
    destinationSlug: 'manali',
    source: 'google',
    rating: 4.6,
    userRatingCount: 120
  };
}

describe('toCardStay', () => {
  it('keeps only the first four photos, in their original order', () => {
    const full = stay(10);
    const card = toCardStay(full);
    expect(card.photos).toEqual(full.photos.slice(0, 4));
    expect(STAY_CARD_PHOTO_LIMIT).toBe(4);
  });

  it('does not mutate the original Stay, so detail pages keep the complete photo list', () => {
    const full = stay(10);
    toCardStay(full);
    expect(full.photos).toHaveLength(10);
  });

  it('returns the same object when there is nothing to trim', () => {
    const four = stay(4);
    expect(toCardStay(four)).toBe(four);
    const none = stay(0);
    expect(toCardStay(none)).toBe(none);
  });

  it('keeps every other field, including the rating', () => {
    const card = toCardStay(stay(10));
    expect(card).toMatchObject({ placeId: 'ChIJabc123', name: 'Test Property', rating: 4.6, userRatingCount: 120, source: 'google' });
  });
});

describe('StayCard output is identical with trimmed or complete photo lists', () => {
  it.each([0, 1, 3, 4, 5, 10])('renders the same markup for %i stored photos', (count) => {
    const full = stay(count);
    expect(renderToStaticMarkup(<StayCard stay={toCardStay(full)} />)).toBe(renderToStaticMarkup(<StayCard stay={full} />));
  });

  it('still shows the rating and the main photo plus three thumbnails', () => {
    const html = renderToStaticMarkup(<StayCard stay={toCardStay(stay(10))} />);
    expect(html).toContain('4.6');
    expect(html).toContain('(120)');
    expect([...html.matchAll(/api\/places\/photo/g)].length).toBe(4);
  });
});

describe('page wiring', () => {
  const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

  it('both server pages trim every card Stay', () => {
    for (const file of ['app/stays/search/page.tsx', 'app/stays/[...segments]/page.tsx']) {
      const source = read(file);
      expect(source).toContain("from '@/lib/stayCardPayload'");
      expect(source).toMatch(/<StayCard [^>]*stay=\{toCardStay\(stay\)\}/);
      expect(source).not.toMatch(/<StayCard [^>]*stay=\{stay\}/);
    }
  });
});

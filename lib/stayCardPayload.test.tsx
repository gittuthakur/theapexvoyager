import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StayCard } from '@/components/modules/StaysGrid';
import { STAY_CARD_PHOTO_LIMIT, toCardStay, withoutLegacyPhotosInDisplayMode } from '@/lib/stayCardPayload';
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

describe('display-time photo mode never exposes stored photo names', () => {
  const NAME_FRAGMENTS = ['places%2FChIJabc123%2Fphotos', 'places/ChIJabc123/photos', 'api/places/photo?name'];

  it.each(['display-time', 'unavailable'] as const)('%s: the card Stay ships with no stored photos', (mode) => {
    const full = { ...stay(10), cardPhotoMode: mode };
    const card = toCardStay(full);
    expect(card.photos).toEqual([]);
    expect(JSON.stringify(card)).not.toMatch(/photo\?name|photos%2F|photos\//);
    expect(full.photos).toHaveLength(10); // the source Stay (used by detail pages) is untouched
  });

  it('legacy mode is unchanged: same object when nothing to trim, still four photos otherwise', () => {
    const four = stay(4);
    expect(toCardStay(four)).toBe(four);
    expect(toCardStay(stay(10)).photos).toHaveLength(4);
    expect(withoutLegacyPhotosInDisplayMode(stay(10)).photos).toHaveLength(10);
  });

  it('the rendered card HTML (what the server serializes) contains no stored name, but keeps rating, count, Maps link and attribution', () => {
    const full: Stay = { ...stay(10), cardPhotoMode: 'display-time', googleMapsUri: 'https://maps.google.com/?cid=1' };
    const html = renderToStaticMarkup(<StayCard stay={toCardStay(full)} />);
    for (const fragment of NAME_FRAGMENTS) expect(html).not.toContain(fragment);
    expect(html).toContain('/api/places/photo/by-place?placeId=ChIJabc123');
    expect(html).toContain('4.6');
    expect(html).toContain('(120)');
    expect(html).toContain('View on Google Maps');
    expect(html).toContain('Property information sourced from');
  });

  it('the unavailable card carries no stored name either', () => {
    const html = renderToStaticMarkup(<StayCard stay={toCardStay({ ...stay(10), cardPhotoMode: 'unavailable' })} />);
    for (const fragment of NAME_FRAGMENTS) expect(html).not.toContain(fragment);
    expect(html).toContain('No photo available');
    expect(html).toContain('4.6');
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

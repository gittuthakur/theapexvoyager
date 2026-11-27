import { describe, expect, it } from 'vitest';
import { stayPhotoAlt } from './stayPhotoAlt';

describe('stayPhotoAlt', () => {
  const stay = { name: 'Himalayan Cottage', stayType: 'cottage' as const, destinationSlug: 'spiti-valley' };

  it('names the property, its kind and its destination for the main photo', () => {
    expect(stayPhotoAlt(stay, 1)).toBe('Himalayan Cottage — Cottage in Spiti Valley');
  });

  it('adds the position for later photos', () => {
    expect(stayPhotoAlt(stay, 3)).toBe('Himalayan Cottage — Cottage in Spiti Valley, photo 3');
  });

  it('omits the destination when the slug is missing or not a plain slug', () => {
    expect(stayPhotoAlt({ ...stay, destinationSlug: '' }, 1)).toBe('Himalayan Cottage — Cottage');
    expect(stayPhotoAlt({ ...stay, destinationSlug: 'Bad Slug!' }, 2)).toBe('Himalayan Cottage — Cottage, photo 2');
  });
});

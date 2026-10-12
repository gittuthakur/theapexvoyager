import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelExpert } from '@/types/expert';

const { regionFind, getCuratedDestinations } = vi.hoisted(() => ({ regionFind: vi.fn(), getCuratedDestinations: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Expert', () => ({ Expert: {} }));
vi.mock('@/models/Region', () => ({ Region: { find: regionFind } }));
vi.mock('@/lib/destinations', () => ({ getCuratedDestinations }));

const { searchPublicExperts } = await import('@/lib/experts');

const expert = (o: Partial<TravelExpert> & Pick<TravelExpert, 'slug' | 'name'>): TravelExpert => ({
  role: 'Planner', profileImage: '/x.jpg', bio: 'b', destinationSlugs: [], travelStyles: [], expertise: [], active: true, publiclyListed: true, ...o
});
const regionDocs = (docs: unknown[]) => regionFind.mockReturnValue({ select: () => ({ lean: async () => docs }) });
const slugs = (list: TravelExpert[]) => list.map((e) => e.slug);

const anita = expert({ slug: 'anita', name: 'Anita', destinationSlugs: ['manali'], regionIds: ['r1'] });
const hidden = expert({ slug: 'hidden', name: 'Hidden', publiclyListed: false, destinationSlugs: ['manali'] });

beforeEach(() => {
  regionFind.mockReset();
  getCuratedDestinations.mockReset().mockResolvedValue([{ slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' }]);
  regionDocs([{ _id: 'r1', name: 'Himachal Pradesh', slug: 'himachal-pradesh' }]);
});

describe('searchPublicExperts', () => {
  it('resolves linked destination titles and regionIds through real records', async () => {
    expect(slugs(await searchPublicExperts([anita], 'Manali'))).toEqual(['anita']);
    expect(slugs(await searchPublicExperts([anita], 'Himachal'))).toEqual(['anita']);
    expect(regionFind).toHaveBeenCalledWith({ _id: { $in: ['r1'] } });
  });
  it('never returns an unlisted expert and reads no context for an empty query', async () => {
    expect(slugs(await searchPublicExperts([anita, hidden], 'Manali'))).toEqual(['anita']);
    expect(slugs(await searchPublicExperts([anita, hidden], undefined))).toEqual(['anita']);
    expect(await searchPublicExperts([hidden], 'Hidden')).toEqual([]);
    regionFind.mockClear();
    getCuratedDestinations.mockClear();
    await searchPublicExperts([anita], '  ');
    expect(regionFind).not.toHaveBeenCalled();
    expect(getCuratedDestinations).not.toHaveBeenCalled();
  });
  it('a failed context read degrades to the expert\'s own fields and never widens results', async () => {
    getCuratedDestinations.mockRejectedValue(new Error('down'));
    regionFind.mockReturnValue({ select: () => ({ lean: async () => { throw new Error('down'); } }) });
    expect(slugs(await searchPublicExperts([anita], 'Anita'))).toEqual(['anita']);
    expect(await searchPublicExperts([anita], 'Himachal')).toEqual([]);
    expect(slugs(await searchPublicExperts([anita], 'Manali'))).toEqual(['anita']); // the stored slug is still searchable
  });
});

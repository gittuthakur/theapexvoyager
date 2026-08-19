import type { Season } from '@/types';

// Canonical season list for the "Best Time to Visit the Himalayas" tabs. `label`
// matches the free-text values already used in `Destination.seasons`.
export const seasons: Season[] = [
  { id: 'spring', label: 'Spring', months: 'Mar – May' },
  { id: 'summer', label: 'Summer', months: 'Jun – Aug' },
  { id: 'monsoon', label: 'Monsoon', months: 'Jul – Sep' },
  { id: 'autumn', label: 'Autumn', months: 'Sep – Nov' },
  { id: 'winter', label: 'Winter', months: 'Dec – Feb' }
];

export function getSeasonById(id: string): Season | undefined {
  return seasons.find((season) => season.id === id);
}

import { images } from './images.config';
import type { Region } from '@/types';

// Himachal Pradesh and Uttarakhand each use a real, named destination photo from
// their own state (Manali; Rishikesh) as their region card/hero image — the same
// pattern, just pointed at a genuine in-region place rather than a generic stock
// shot. Jammu & Kashmir still uses a generic fallback (config/experiences.config.ts's
// mountainDusk) rather than mislabeling a real Himachal photo as Kashmir; the
// Uttarakhand entry previously did the same via `himalayanVista`, but that asset is
// actually Key Monastery in Spiti Valley, Himachal Pradesh — a real, identifiable
// place in the wrong state, not a safe generic fallback — so it was replaced with
// its own real destination photo instead.

// The one canonical list of the three regions The Apex Voyager covers. `name` here
// is deliberately the full, exact string already used on `Destination.state` (see
// config/destinations.config.ts) — the existing /api/destinations route's `region`
// query param already does an exact match against `state`, so keeping these in sync
// means that filter "just works" rather than needing its own parallel lookup.
// Distinct from config/search.config.ts's `regionCategories` and
// config/tripPlanner.config.ts's `PLANNER_REGIONS`, which use shorter display names
// ("Kashmir") for other, unrelated UI (the booking search popover, the trip-planner
// wizard) — left untouched since other pages depend on their exact shape.
export const regions: Region[] = [
  {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    shortName: 'Himachal',
    description: 'Snow passes, apple valleys and the Himalaya’s most-loved hill stations.',
    image: images.destinations.manali
  },
  {
    id: 'jammu-kashmir',
    name: 'Jammu & Kashmir',
    shortName: 'Kashmir',
    description: 'Alpine meadows, gondola rides and the valley’s most cinematic landscapes.',
    image: images.experiences.mountainDusk
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    shortName: 'Uttarakhand',
    description: 'Riverside yoga towns, sacred ghats and the foothills of the high Garhwal.',
    image: images.destinations.rishikesh
  }
];

export function getRegionById(id: string): Region | undefined {
  return regions.find((region) => region.id === id);
}

export function getRegionByName(name?: string): Region | undefined {
  if (!name) return undefined;
  return regions.find((region) => region.name === name);
}

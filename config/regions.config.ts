import { images } from './images.config';
import type { Region } from '@/types';

// All three regions use a real, named destination photo from their own state as
// their region card/hero image (Himachal Pradesh: Manali; Jammu & Kashmir: Srinagar/
// Dal Lake; Uttarakhand: Rishikesh) rather than a generic or mismatched stock shot.
// Uttarakhand previously used `himalayanVista`, which is actually Key Monastery in
// Spiti Valley, Himachal Pradesh — a real, identifiable place in the wrong state —
// and Jammu & Kashmir previously used a generic, non-Kashmir-specific fallback
// (`mountainDusk`); both were replaced once a genuine in-region destination photo
// was confirmed to already exist in the project.

// The one canonical list of the three regions The Apex Voyager India covers. `name` here
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
    image: images.destinations.srinagar
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

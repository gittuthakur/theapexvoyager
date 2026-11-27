import { STAY_TYPE_LABELS, type Stay } from '@/types/stay';

/** "spiti-valley" -> "Spiti Valley". Returns '' for anything that is not a plain slug. */
function placeFromSlug(slug: string | undefined): string {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Property-specific alt text for a stay's photos: the property's own name, what kind of stay it is and the destination
 * it belongs to, plus the photo's position when it is not the main one. Built only from fields the Stay already carries.
 * Used for real photographs only; the unavailable-photo panel is a <div> and never gets this text as an image alt.
 */
export function stayPhotoAlt(stay: Pick<Stay, 'name' | 'stayType' | 'destinationSlug'>, position: number): string {
  const kind = STAY_TYPE_LABELS[stay.stayType] ?? 'Stay';
  const place = placeFromSlug(stay.destinationSlug);
  const base = place ? `${stay.name} — ${kind} in ${place}` : `${stay.name} — ${kind}`;
  return position > 1 ? `${base}, photo ${position}` : base;
}

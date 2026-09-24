/** Explicit slug -> HBX (Hotelbeds) destination-code mapping — see AGENTS.md-style rule
 *  elsewhere in this repo (config/stayLocations.config.ts): never guess a supplier code
 *  from a name; every row here was confirmed against a real HBX Hotel Content API
 *  response (evaluation environment, 2026-09-24 diagnostic) before being added. A
 *  destination slug with no row here has NOT been verified against HBX and must fail
 *  safe (getHbxDestinationMapping returns undefined) rather than have a code guessed
 *  for it — see AGENTS.md's Kinnaur/Spiti/Dharamshala/Dalhousie/Kashmir/Uttarakhand
 *  backlog, none of which are mapped yet. */
export interface HbxDestinationMapping {
  /** config/destinations.config.ts slug this row applies to. */
  slug: string;
  /** HBX's own destination code (locations/destinations `code` field). */
  hbxCode: string;
  /** HBX's own destination name, for audit/debugging only — never shown to a visitor. */
  hbxName: string;
  /** ISO date this mapping was confirmed against a live HBX Content API response. */
  verifiedAt: string;
}

export const HBX_DESTINATION_MAPPINGS: HbxDestinationMapping[] = [
  { slug: 'shimla', hbxCode: 'SLV', hbxName: 'Shimla', verifiedAt: '2026-09-24' },
  { slug: 'manali', hbxCode: 'IN6', hbxName: 'Manali', verifiedAt: '2026-09-24' }
];

const MAPPING_BY_SLUG = new Map(HBX_DESTINATION_MAPPINGS.map((mapping) => [mapping.slug, mapping]));

/** Fails safe: an unmapped/unverified destination slug returns `undefined`, never a
 *  guessed or derived code. Every caller (hotel sampling, availability lookups, the
 *  internal diagnostic route) must treat `undefined` as "no HBX coverage here yet",
 *  not as an error to retry. */
export function getHbxDestinationMapping(destinationSlug: string): HbxDestinationMapping | undefined {
  return MAPPING_BY_SLUG.get(destinationSlug);
}

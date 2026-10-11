import { normalizeSearchText, type AliasMap } from '@/lib/search/normalize';

/**
 * Explicit location-spelling aliases used by search. This is the ONLY hand-maintained search
 * data, and it is deliberately tiny: it holds spellings, never records. No journey, destination
 * or experience title, slug or id belongs here — those are discovered from the live catalog.
 *
 * Everything that CAN be derived from stored data is derived automatically instead (see
 * lib/search/normalize.ts `searchForms`): slug vs. spaced spellings, "&" vs "and", diacritics,
 * parentheticals such as "Joshimath (Jyotirmath)", and no-space typing such as "mcleodganj".
 * Region short names ("Himachal", "Kashmir", "Jammu") are likewise derived from the region name.
 *
 * Each entry maps a normalized alternative spelling to the spelling stored in the catalog. An
 * alias is only useful when its target exists, and it never creates a record relationship by
 * itself. Entries below are alternative spellings of destination names already in the catalog;
 * they are intentionally few and should be reviewed/extended by the business owner.
 */
export const LOCATION_ALIASES: AliasMap = Object.freeze(
  Object.fromEntries(
    Object.entries({
      dharamsala: ['dharamshala'],
      simla: ['shimla']
    }).map(([alias, canonical]) => [normalizeSearchText(alias), canonical])
  )
);

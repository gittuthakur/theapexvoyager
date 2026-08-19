export type SeasonId = 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';

export interface Season {
  id: SeasonId;
  /** Matches the free-text values used in `Destination.seasons`. */
  label: string;
  months: string;
}

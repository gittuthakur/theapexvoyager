export interface DestinationStats {
  journeyCount: number;
  stayCount: number;
  experienceCount: number;
  /** Only ever set when a real matching journey has a price — never fabricated. */
  startingPrice?: number;
}

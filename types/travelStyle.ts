import type { LucideIcon } from 'lucide-react';

// Named Destination* to avoid colliding with the unrelated TravelStyleId already
// exported by types/tripPlanner.ts (the trip-planner wizard's own style options).
export type DestinationStyleId = 'adventure' | 'slow-travel' | 'romantic' | 'family' | 'wellness' | 'offbeat';

export interface DestinationTravelStyle {
  id: DestinationStyleId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Free-text values (from `Destination.travelStyles`/`category`) that count as a match for this style. */
  matchKeywords: string[];
}

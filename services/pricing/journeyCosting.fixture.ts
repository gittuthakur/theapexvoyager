/** DEMO / SYNTHETIC — tests/dev QA only. Never a production supplier quote. */
import { emptyCosting, emptyLine } from './journeyCosting.service';
import type { JourneyContext } from '../../models/JourneyCosting';
export const SYNTHETIC_JOURNEY: JourneyContext = { journeyId: '000000000000000000000014', journeySlug: 'demo-synthetic', title: 'DEMO / SYNTHETIC', duration: '3 Nights / 4 Days', startingCity: 'Demo A', endingCity: 'Demo B', status: 'draft', price: null, itinerary: [] };
export function syntheticCosting() {
  const input = emptyCosting(SYNTHETIC_JOURNEY);
  input.scenarioName = 'DEMO / SYNTHETIC'; input.travelSeason = 'Synthetic test season'; input.validFrom = '2026-01-01'; input.validTo = '2099-12-31';
  input.hotelCosts = [{ ...emptyLine('hotel', 'hotelCosts'), label: 'Synthetic room', quantity: 3, unitCost: 2000 }];
  input.transportCosts = [{ ...emptyLine('cab', 'transportCosts'), label: 'Synthetic fixed cab', costBasis: 'FIXED_ROUTE', unitCost: 4000 }];
  input.mealCosts = [{ ...emptyLine('meal', 'mealCosts'), label: 'Synthetic dinner', costBasis: 'PER_PERSON', quantity: 3, unitCost: 200 }];
  input.activityCosts = [{ ...emptyLine('optional', 'activityCosts'), label: 'Synthetic optional activity', unitCost: 500 }];
  input.contingency = { mode: 'PERCENT', value: 5 }; input.pricing.percent = 20;
  return input;
}

import type { JourneyContext, JourneyCosting } from '../../models/JourneyCosting';
import type { Supplier, SupplierRate } from '../../models/SupplierLibrary';
import { matchingRates, rateValidity } from './supplierLibrary.service';
import { calculateJourneyCosting } from './journeyCosting.service';

/** Conservative route-derived collection checklist, not a promise that all destinations need overnight stays. */
export function supplierCoverage(journeys: JourneyContext[], suppliers: Supplier[], rates: SupplierRate[], costings: JourneyCosting[] = []) {
  suppliers = suppliers.filter(s => s.input.dataClassification === 'REAL');
  rates = rates.filter(r => suppliers.some(s => s.id === r.input.supplierId));
  const rows = journeys.filter(j => j.status === 'draft').map(journey => {
    const hotelDestinations = [...new Set(journey.destinationSlugs ?? [])];
    const hotelMatches = hotelDestinations.map(destination => ({ destination, rates: matchingRates(rates, suppliers, { category: 'hotelCosts', destination }).filter(r => ['QUOTED', 'CONFIRMED'].includes(r.input.confirmationStatus)).map(r => ({ id: r.id, version: r.version })) }));
    // Exact whole-circuit mapping is explicitly entered on supplier rate, never inferred from a partial leg or price.
    const transportMatches = matchingRates(rates, suppliers, { category: 'transportCosts' }).filter(r => r.input.transport?.journeySlugs.includes(journey.journeySlug) && ['QUOTED', 'CONFIRMED'].includes(r.input.confirmationStatus));
    const relevantText = journey.itinerary.map(day => `${day.title} ${day.description}`).join(' ');
    const possibleLocalServices = [...new Set([...relevantText.matchAll(/\b(shuttle|pony|palki|helicopter|porter|guide|permit|oxygen|snow vehicle|local vehicle|union taxi|ropeway|gondola)\b/gi)].map(m => m[1].toLowerCase()))];
    const latestCostings = costings.filter(c => c.input.journeyId === journey.journeyId && !/DEMO|SYNTHETIC/i.test(c.input.scenarioName) && !costings.some(other => other.id === c.id && other.version > c.version));
    const fullyCostable = latestCostings.some(c => { try { const result = calculateJourneyCosting(c.input); return !Object.values(c.input).filter(Array.isArray).flat().some(l => l.supplierRateSnapshot?.supplierDataClassification === 'DEMO_SYNTHETIC') && !result.reviewBlockers.length && result.subtotal > 0 && result.supplierConfirmationStatus === 'CONFIRMED' && c.input.hotelCosts.some(l => l.includedInPackage) && c.input.transportCosts.some(l => l.includedInPackage); } catch { return false; } });
    const hotelCovered = hotelMatches.length > 0 && hotelMatches.every(match => match.rates.length > 0);
    const transportCovered = transportMatches.length > 0;
    return { journeyId: journey.journeyId, slug: journey.journeySlug, title: journey.title, duration: journey.duration,
      hotelDestinations, hotelMatches, hotelCovered, transportCovered, transportRateIds: transportMatches.map(r => r.id),
      overnightEvidence: journey.itinerary.filter(day => /\bovernight\b|\bstay\b|\bbase\b|\bbases\b/i.test(`${day.title} ${day.description}`)).map(day => ({ day: day.day, title: day.title, description: day.description })),
      transportLegs: journey.itinerary.filter(day => /\bto\b|arrival|departure|return/i.test(day.title)).map(day => ({ day: day.day, label: day.title })),
      route: `${journey.startingCity} → ${journey.endingCity}`, possibleLocalServices, fullyCostable,
      missing: [...hotelMatches.filter(m => !m.rates.length).map(m => `Hotel quote candidate: ${m.destination}`), ...(!transportCovered ? ['Explicit whole-route supplier transport quote'] : []), ...(!fullyCostable ? ['Complete confirmed costing scenario (including actual overnight plan, fees and inclusions)'] : [])],
      caveat: 'Hotel destinations are route candidates, not confirmed overnight requirements. Read the full itinerary and ask the owner to confirm overnight locations. Transport day titles are quote-request context; km and inclusions are unknown. Optional/local services are not included automatically.' };
  });
  return { rows, summary: { draftJourneys: rows.length, hotel: rows.filter(r => r.hotelCovered).length, transport: rows.filter(r => r.transportCovered).length, fullyCostable: rows.filter(r => r.fullyCostable).length, awaitingQuote: rows.filter(r => !r.fullyCostable).length, expired: rates.filter(r => rateValidity(r.input) === 'EXPIRED').length } };
}
export function quoteRequest(journey: JourneyContext, input: { kind: 'HOTEL' | 'TRANSPORT'; destination: string; travelFrom: string; travelTo: string; season: string; rooms: number; adults: number; children: number; nights: number; mealPlan: string; vehicle: string; approximateKm: number | null }) {
  const context = `${journey.title} (${journey.journeySlug})\nDates: ${input.travelFrom || 'To confirm'} to ${input.travelTo || 'To confirm'}; season: ${input.season || 'To confirm'}\nOccupancy: ${input.adults} adults, ${input.children} children; ${input.rooms} rooms\n`;
  if (input.kind === 'HOTEL') return `HOTEL SUPPLIER QUOTE REQUEST — DRAFT TEXT ONLY\n${context}Destination: ${input.destination || 'To confirm'}\nNights at this property: ${input.nights || 'To confirm (do not use total tour nights blindly)'}\nRequested meal plan: ${input.mealPlan || 'To confirm'}\nPlease quote single/double/triple, extra adult, child with/without bed rates and guest basis.\nState rate validity, minimum stay, included meals and tax inclusion.\nList mandatory/weekend/peak supplements and exclusions separately.\nNo booking or supplier confirmation is implied.`;
  return `TRANSPORT SUPPLIER QUOTE REQUEST — DRAFT TEXT ONLY\n${context}Route: ${journey.startingCity} → ${journey.endingCity}\nDuration: ${journey.duration}\n${journey.itinerary.map(d => `Day ${d.day}: ${d.title}`).join('\n')}\nVehicle: ${input.vehicle || 'To confirm'}\nApprox km: ${input.approximateKm ?? 'Unknown; supplier to quote'}\nPickup/drop details: ${journey.startingCity || 'To confirm'} / ${journey.endingCity || 'To confirm'}\nPlease specify pricing basis, days, minimum km/day, dead km policy/rate, driver and night allowances, toll, parking, state tax, permits, fuel and local/union/snow vehicle exclusions.\nState quote validity and tax inclusion. No booking or confirmation is implied.`;
}

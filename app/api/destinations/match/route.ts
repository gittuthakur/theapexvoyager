import { NextResponse } from 'next/server';
import { getCuratedDestinations } from '@/lib/destinations';
import type { DestinationMatchScores } from '@/types/destination';

const DIMENSIONS: Array<keyof DestinationMatchScores> = ['adventure', 'nature', 'luxury', 'crowds', 'slowTravel'];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * A transparent, explainable weighted-distance heuristic — NOT a machine-learning
 * model. Each destination carries editorial 0-100 scores per dimension
 * (destination.matchScores); each visitor preference is also 0-100. A destination's
 * fit is 100 minus its preference-weighted average distance from those preferences,
 * so a visitor who cares a lot about "adventure" is penalized more heavily by a
 * low-adventure destination than someone who barely weighted that dimension at all.
 */
function scoreDestination(preferences: DestinationMatchScores, destinationScores: DestinationMatchScores): number {
  const totalWeight = DIMENSIONS.reduce((sum, dimension) => sum + preferences[dimension], 0);
  if (totalWeight === 0) return 50;

  const weightedDistance = DIMENSIONS.reduce((sum, dimension) => {
    const distance = Math.abs(preferences[dimension] - destinationScores[dimension]);
    return sum + distance * preferences[dimension];
  }, 0);

  return Math.round(clamp(100 - weightedDistance / totalWeight, 0, 100));
}

// GET /api/destinations/match?adventure=80&nature=60&luxury=20&crowds=10&slowTravel=70
// Every param is optional and defaults to 50 (neutral). Returns the top 5 curated
// destinations ranked by fit against the given preferences.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const preferences = DIMENSIONS.reduce((acc, dimension) => {
    const raw = searchParams.get(dimension);
    const parsed = raw !== null ? Number(raw) : 50;
    acc[dimension] = Number.isFinite(parsed) ? clamp(parsed, 0, 100) : 50;
    return acc;
  }, {} as DestinationMatchScores);

  const ranked = getCuratedDestinations()
    .filter((destination) => Boolean(destination.matchScores))
    .map((destination) => ({
      destination,
      score: scoreDestination(preferences, destination.matchScores as DestinationMatchScores)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json({ preferences, results: ranked });
}

import { connectDB } from '../../lib/mongodb';
import { Journey } from '../../models/Journey';
import type { JourneyContext } from '../../models/JourneyCosting';

/** Read-only context. Costs never enter Journey documents or public serializers. */
export async function getCostingJourneys(): Promise<JourneyContext[]> {
  await connectDB();
  const rows = await Journey.find().select('_id slug name duration startingCity endingCity status price itinerary destinationSlugs regionId').sort({ status: 1, name: 1 }).lean();
  return rows.map(row => ({ destinationSlugs: row.destinationSlugs ?? [], regionId: row.regionId ? String(row.regionId) : '', journeyId: String(row._id), journeySlug: row.slug, title: row.name, duration: row.duration, startingCity: row.startingCity ?? '', endingCity: row.endingCity ?? '', status: row.status, price: row.price ?? null,
    itinerary: row.itinerary.map((day: { day: number; title: string; description: string }) => ({ day: day.day, title: day.title, description: day.description })) }));
}

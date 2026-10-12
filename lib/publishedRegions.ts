import { connectDB } from '@/lib/mongodb';
import { Region } from '@/models/Region';
import type { RegionRef } from '@/lib/search/globalSearch';

/**
 * Published Regions reduced to what global search needs (a projection read of a handful of documents).
 * `status: 'published'` is the same public-visibility gate every Region Hub read uses
 * (services/regions/regionHub.service.ts): a draft Region (e.g. Ladakh today) is never returned.
 * `maxTimeMS` makes MongoDB itself abandon a slow read; omitted, the query is unbounded.
 */
export async function getPublishedRegionRefs(options: { maxTimeMS?: number } = {}): Promise<RegionRef[]> {
  await connectDB();
  const query = Region.find({ status: 'published' }, { name: 1, slug: 1, shortDescription: 1, cardImage: 1 }).sort({ sortOrder: 1 });
  const docs = await (options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query).lean<
    Array<{ _id: unknown; name: string; slug: string; shortDescription?: string; cardImage?: string }>
  >();
  return docs.map((doc) => ({ id: String(doc._id), slug: doc.slug, name: doc.name, shortDescription: doc.shortDescription, image: doc.cardImage }));
}

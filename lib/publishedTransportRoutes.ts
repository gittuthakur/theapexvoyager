import { connectDB } from '@/lib/mongodb';
import { TransportRoute } from '@/models/TransportRoute';
import type { TransportRoute as TransportRouteType } from '@/types/transport';

/**
 * Active Transport routes reduced to what global search needs (one projected read of a few dozen documents).
 * `active: true` is the same public gate getRoutes() and the /transport page use, and the order is theirs too
 * (featured first, then creation order, straight off the model's index), so a search never lists a route the
 * page would not. No fare, vehicle or availability field is read: a search row never shows one.
 * `maxTimeMS` makes MongoDB itself abandon a slow read; `signal` lets the caller cancel it.
 */
export async function getActiveTransportRouteRefs(options: { maxTimeMS?: number; signal?: AbortSignal } = {}): Promise<TransportRouteType[]> {
  await connectDB();
  const query = TransportRoute.find({ active: true }, { origin: 1, destination: 1, routeType: 1, estimatedDuration: 1, active: 1 }).sort({ featured: -1, createdAt: 1 });
  const bounded = options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query;
  const docs = await (options.signal ? bounded.setOptions({ signal: options.signal } as never) : bounded).lean<
    Array<{ _id: unknown; origin: string; destination: string; routeType?: string; estimatedDuration?: string; active: boolean }>
  >();
  return docs.map((doc) => ({
    id: String(doc._id),
    origin: doc.origin,
    destination: doc.destination,
    routeType: doc.routeType,
    estimatedDuration: doc.estimatedDuration,
    supportedVehicleCategories: [],
    active: doc.active
  }));
}

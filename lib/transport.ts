import { connectDB } from '@/lib/mongodb';
import { TransportVehicle, type TransportVehicleDocument } from '@/models/TransportVehicle';
import { TransportRoute, type TransportRouteDocument } from '@/models/TransportRoute';
import type { VehicleOption, TransportRoute as TransportRouteType } from '@/types/transport';

// Re-exported for existing server-side callers — the definition itself now lives in
// config/transportServiceTypes.config.ts (pure, DB-free) so client components can use
// it too without bundling mongoose.
export { getRecommendedServiceTypesForRoute } from '@/config/transportServiceTypes.config';

export function toVehicleOption(doc: TransportVehicleDocument): VehicleOption {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    seats: doc.seats,
    image: doc.images[0],
    images: doc.images,
    luggageCapacity: doc.luggageCapacity,
    acType: doc.acType,
    estimatedFromPrice: doc.estimatedFromPrice,
    priceNote: doc.priceNote ?? '',
    inclusions: doc.inclusions,
    exclusions: doc.exclusions,
    serviceAreas: doc.serviceAreas,
    active: doc.active,
    featured: doc.featured,
    description: doc.description,
    regionIds: doc.regionIds?.map(String),
    serviceType: doc.serviceType,
    destinationSlugs: doc.destinationSlugs,
    partnerId: doc.partnerId ? String(doc.partnerId) : undefined,
    securityDeposit: doc.securityDeposit,
    includedKilometres: doc.includedKilometres,
    extraKmCharge: doc.extraKmCharge,
    fuelPolicy: doc.fuelPolicy,
    minimumAge: doc.minimumAge,
    drivingLicenceRequired: doc.drivingLicenceRequired,
    dropOffPolicy: doc.dropOffPolicy,
    transmission: doc.transmission,
    helmetAvailable: doc.helmetAvailable,
    engineCategory: doc.engineCategory,
    licenceRequired: doc.licenceRequired,
    rentalTerms: doc.rentalTerms,
    withDriver: doc.withDriver,
    mountainSuitable: doc.mountainSuitable,
    remoteRouteSuitable: doc.remoteRouteSuitable,
    pickupLocation: doc.pickupLocation
  };
}

export function toTransportRoute(doc: TransportRouteDocument): TransportRouteType {
  return {
    origin: doc.origin,
    destination: doc.destination,
    routeType: doc.routeType,
    estimatedDuration: doc.estimatedDuration,
    distanceKm: doc.distanceKm,
    supportedVehicleCategories: doc.supportedVehicleCategories,
    startingFare: doc.startingFare,
    seasonalStatus: doc.seasonalStatus,
    active: doc.active,
    featured: doc.featured,
    regionId: doc.regionId ? String(doc.regionId) : undefined
  };
}

export interface VehicleFilter {
  category?: string;
  minSeats?: number;
  serviceArea?: string;
  serviceType?: string;
  /** Exact match against a set of canonical service-type values (our own constants,
   *  not user-typed text — no regex needed). Used by the Chauffeur catalog section to
   *  span both 'Cab with Driver' and 'Group Transport' in one query. */
  serviceTypeIn?: string[];
  withDriver?: boolean;
  /** Self-Drive filter bar — real `TransportVehicle.transmission` values only. */
  transmission?: string;
  /** Self-Drive filter bar — matches against the real, required `estimatedFromPrice`. */
  maxPrice?: number;
  /** Exact match against a set of real category values — mirrors `serviceTypeIn`.
   *  Used by the motorcycle-TYPE cards, since one customer-facing type ("Classic /
   *  Retro Bikes") legitimately spans more than one real `category` value. */
  categoryIn?: string[];
}

export interface RouteFilter {
  origin?: string;
  destination?: string;
}

export async function getVehicles(filter?: VehicleFilter): Promise<VehicleOption[]> {
  await connectDB();

  const query: Record<string, unknown> = { active: true };
  if (filter?.category) {
    query.category = new RegExp(`^${filter.category.trim()}$`, 'i');
  }
  if (filter?.minSeats) {
    query.seats = { $gte: filter.minSeats };
  }
  if (filter?.serviceArea) {
    query.serviceAreas = new RegExp(filter.serviceArea.trim(), 'i');
  }
  if (filter?.serviceType) {
    query.serviceType = new RegExp(`^${filter.serviceType.trim()}$`, 'i');
  }
  if (filter?.serviceTypeIn) {
    query.serviceType = { $in: filter.serviceTypeIn };
  }
  if (filter?.withDriver !== undefined) {
    query.withDriver = filter.withDriver;
  }
  if (filter?.transmission) {
    query.transmission = new RegExp(`^${filter.transmission.trim()}$`, 'i');
  }
  if (filter?.maxPrice !== undefined) {
    query.estimatedFromPrice = { $lte: filter.maxPrice };
  }
  if (filter?.categoryIn) {
    query.category = { $in: filter.categoryIn };
  }

  const docs = await TransportVehicle.find(query).sort({ featured: -1, createdAt: 1 }).lean<TransportVehicleDocument[]>();
  return docs.map(toVehicleOption);
}

export async function getVehicleBySlug(slug: string): Promise<VehicleOption | null> {
  await connectDB();
  const doc = await TransportVehicle.findOne({ slug }).lean<TransportVehicleDocument | null>();
  return doc ? toVehicleOption(doc) : null;
}

/** Local Mobility's primary data contract — mirrors lib/tours.ts's getToursByDestinationSlug. */
export async function getVehiclesByDestinationSlug(destinationSlug: string): Promise<VehicleOption[]> {
  await connectDB();
  const docs = await TransportVehicle.find({ active: true, destinationSlugs: destinationSlug })
    .sort({ featured: -1, createdAt: 1 })
    .lean<TransportVehicleDocument[]>();
  return docs.map(toVehicleOption);
}

export async function getRoutes(filter?: RouteFilter): Promise<TransportRouteType[]> {
  await connectDB();

  const clauses: Record<string, unknown>[] = [{ active: true }];
  if (filter?.origin) {
    clauses.push({ origin: new RegExp(filter.origin.trim(), 'i') });
  }
  if (filter?.destination) {
    clauses.push({ destination: new RegExp(filter.destination.trim(), 'i') });
  }
  const query = clauses.length > 1 ? { $and: clauses } : clauses[0];

  const docs = await TransportRoute.find(query).sort({ featured: -1, createdAt: 1 }).lean<TransportRouteDocument[]>();
  return docs.map(toTransportRoute);
}


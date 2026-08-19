import { connectDB } from '@/lib/mongodb';
import { TransportVehicle, type TransportVehicleDocument } from '@/models/TransportVehicle';
import { TransportRoute, type TransportRouteDocument } from '@/models/TransportRoute';
import { vehicleOptions } from '@/config/transport.config';
import { transportRoutes } from '@/config/transportRoutes.config';
import type { VehicleOption, TransportRoute as TransportRouteType } from '@/types/transport';

function toVehicleOption(doc: TransportVehicleDocument): VehicleOption {
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
    description: doc.description
  };
}

function toTransportRoute(doc: TransportRouteDocument): TransportRouteType {
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
    featured: doc.featured
  };
}

export interface VehicleFilter {
  category?: string;
  minSeats?: number;
  serviceArea?: string;
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

  const docs = await TransportVehicle.find(query).sort({ featured: -1, createdAt: 1 }).lean<TransportVehicleDocument[]>();
  return docs.map(toVehicleOption);
}

export async function getVehicleBySlug(slug: string): Promise<VehicleOption | null> {
  await connectDB();
  const doc = await TransportVehicle.findOne({ slug }).lean<TransportVehicleDocument | null>();
  return doc ? toVehicleOption(doc) : null;
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

function matchesVehicleFilter(vehicle: VehicleOption, filter?: VehicleFilter): boolean {
  if (filter?.category && vehicle.category?.toLowerCase() !== filter.category.trim().toLowerCase()) return false;
  if (filter?.minSeats && vehicle.seats < filter.minSeats) return false;
  if (filter?.serviceArea) {
    const area = filter.serviceArea.trim().toLowerCase();
    if (!vehicle.serviceAreas?.some((a) => a.toLowerCase().includes(area))) return false;
  }
  return true;
}

function matchesRouteFilter(route: TransportRouteType, filter?: RouteFilter): boolean {
  if (filter?.origin && !route.origin.toLowerCase().includes(filter.origin.trim().toLowerCase())) return false;
  if (filter?.destination && !route.destination.toLowerCase().includes(filter.destination.trim().toLowerCase())) return false;
  return true;
}

// The transport catalog page should never render empty just because the database is
// unreachable or hasn't been seeded yet — fall back to the demo config data in either
// case, filtered in-memory the same way the DB query would filter it. Mirrors
// getToursWithFallback (lib/tours.ts), simplified: the config array is already in
// memory here, so there's no need for tours.ts's extra self-fetch-over-HTTP step.
export async function getVehiclesWithFallback(filter?: VehicleFilter): Promise<VehicleOption[]> {
  try {
    const vehicles = await getVehicles(filter);
    if (vehicles.length > 0) return vehicles;
    console.warn('getVehicles() returned no results — falling back to demo transport config data');
  } catch (error) {
    console.error('Failed to fetch transport vehicles from the database — falling back to demo config data', error);
  }
  return vehicleOptions.filter((vehicle) => matchesVehicleFilter(vehicle, filter));
}

export async function getRoutesWithFallback(filter?: RouteFilter): Promise<TransportRouteType[]> {
  try {
    const routes = await getRoutes(filter);
    if (routes.length > 0) return routes;
    console.warn('getRoutes() returned no results — falling back to demo transport routes config data');
  } catch (error) {
    console.error('Failed to fetch transport routes from the database — falling back to demo config data', error);
  }
  return transportRoutes.filter((route) => matchesRouteFilter(route, filter));
}

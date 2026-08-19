import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface TransportRouteDocument extends Document {
  origin: string;
  destination: string;
  routeType?: string;
  estimatedDuration?: string;
  distanceKm?: number;
  supportedVehicleCategories: string[];
  startingFare?: number;
  seasonalStatus?: string;
  active: boolean;
  featured?: boolean;
}

const TransportRouteSchema = new Schema<TransportRouteDocument>(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    routeType: { type: String },
    estimatedDuration: { type: String },
    distanceKm: { type: Number },
    supportedVehicleCategories: { type: [String], required: true },
    startingFare: { type: Number },
    seasonalStatus: { type: String },
    active: { type: Boolean, required: true, default: true },
    featured: { type: Boolean }
  },
  { timestamps: true }
);

// Routes have no natural single-field business key like `slug` — {origin, destination} is
// the stable, unique-in-practice pair used by scripts/seed.ts's upsert.
TransportRouteSchema.index({ origin: 1, destination: 1 }, { unique: true });
// Matches getRoutes()'s default sort so an unfiltered listing reads straight off the index.
TransportRouteSchema.index({ featured: -1, createdAt: 1 });

// `models.TransportRoute` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const TransportRoute =
  models.TransportRoute ?? model<TransportRouteDocument>('TransportRoute', TransportRouteSchema);

import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface TransportVehicleDocument extends Document {
  slug: string;
  name: string;
  category: 'Comfort' | 'SUV' | 'Tempo Traveller' | 'Premium' | 'Coach';
  images: string[];
  seats: number;
  luggageCapacity?: string;
  acType?: 'AC' | 'Non-AC';
  inclusions: string[];
  exclusions?: string[];
  serviceAreas: string[];
  estimatedFromPrice: number;
  priceNote?: string;
  description: string;
  active: boolean;
  featured?: boolean;
}

const TransportVehicleSchema = new Schema<TransportVehicleDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['Comfort', 'SUV', 'Tempo Traveller', 'Premium', 'Coach'],
      required: true
    },
    images: { type: [String], required: true },
    seats: { type: Number, required: true },
    luggageCapacity: { type: String },
    acType: { type: String, enum: ['AC', 'Non-AC'] },
    inclusions: { type: [String], required: true },
    exclusions: { type: [String] },
    serviceAreas: { type: [String], required: true },
    estimatedFromPrice: { type: Number, required: true },
    priceNote: { type: String },
    description: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    featured: { type: Boolean }
  },
  { timestamps: true }
);

// Matches getVehicles()'s default sort (lib/transport.ts) so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
TransportVehicleSchema.index({ featured: -1, createdAt: 1 });
// Supports the `category` filter in getVehicles().
TransportVehicleSchema.index({ category: 1 });

// `models.TransportVehicle` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const TransportVehicle =
  models.TransportVehicle ?? model<TransportVehicleDocument>('TransportVehicle', TransportVehicleSchema);

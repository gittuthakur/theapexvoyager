import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingDocument extends Document {
  tourSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  dates?: string;
  guests?: number;
  status: BookingStatus;
  createdAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    tourSlug: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    dates: { type: String },
    guests: { type: Number },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

export const Booking = models.Booking ?? model<BookingDocument>('Booking', BookingSchema);
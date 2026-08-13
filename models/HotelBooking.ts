import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface HotelBookingDocument extends Document {
  hotelName: string;
  userName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  createdAt: Date;
}

const HotelBookingSchema = new Schema<HotelBookingDocument>(
  {
    hotelName: { type: String, required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    checkInDate: { type: String, required: true },
    checkOutDate: { type: String, required: true },
    guests: { type: Number, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// `models.HotelBooking` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const HotelBooking = models.HotelBooking ?? model<HotelBookingDocument>('HotelBooking', HotelBookingSchema);

import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export type BookingRequestType = 'stay' | 'journey' | 'tour' | 'experience' | 'transport' | 'expert';

export interface BookingRequestDocument extends Document {
  referenceId: string;
  type: BookingRequestType;
  name: string;
  phone: string;
  email?: string;
  itemName: string;
  destination?: string;
  dates?: string;
  travelers?: string;
  details?: Record<string, unknown>;
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

const BookingRequestSchema = new Schema<BookingRequestDocument>(
  {
    referenceId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['stay', 'journey', 'tour', 'experience', 'transport', 'expert'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    itemName: { type: String, required: true },
    destination: { type: String },
    dates: { type: String },
    travelers: { type: String },
    details: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['new', 'contacted', 'confirmed', 'cancelled'], default: 'new' }
  },
  { timestamps: true }
);

// `models.BookingRequest` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const BookingRequest = models.BookingRequest ?? model<BookingRequestDocument>('BookingRequest', BookingRequestSchema);

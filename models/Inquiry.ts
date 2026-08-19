import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface InquiryDocument extends Document {
  name: string;
  phone: string;
  selection: string;
  selectionType: 'stay' | 'destination';
  stayType?: string;
  date?: string;
  createdAt: Date;
}

const InquirySchema = new Schema<InquiryDocument>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    selection: { type: String, required: true },
    selectionType: { type: String, enum: ['stay', 'destination'], required: true },
    stayType: { type: String },
    date: { type: String }
  },
  { timestamps: true }
);

// `models.Inquiry` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const Inquiry = models.Inquiry ?? model<InquiryDocument>('Inquiry', InquirySchema);

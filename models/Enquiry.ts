import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface EnquiryDocument extends Document {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  budgetRange?: string;
  createdAt: Date;
}

const EnquirySchema = new Schema<EnquiryDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    budgetRange: { type: String }
  },
  { timestamps: true }
);

export const Enquiry = models.Enquiry ?? model<EnquiryDocument>('Enquiry', EnquirySchema);
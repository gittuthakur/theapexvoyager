import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface NewsletterSubscriberDocument extends Document {
  email: string;
  /** Pathname the signup was submitted from, for lead-source attribution — mirrors models/Inquiry.ts's sourcePage. */
  sourcePage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<NewsletterSubscriberDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sourcePage: { type: String }
  },
  { timestamps: true }
);

// `models.NewsletterSubscriber` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const NewsletterSubscriber =
  models.NewsletterSubscriber ?? model<NewsletterSubscriberDocument>('NewsletterSubscriber', NewsletterSubscriberSchema);

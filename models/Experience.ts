import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface ExperienceDocument extends Document {
  id: string;
  slug: string;
  title: string;
  location: string;
  region: 'Himachal Pradesh' | 'Jammu & Kashmir' | 'Uttarakhand';
  regionId?: Types.ObjectId;
  category: 'Adventure' | 'Culture' | 'Food' | 'Nature' | 'Wellness' | 'Romance' | 'Family' | 'Offbeat';
  subCategory: string;
  mood: 'adventure' | 'romantic-escapes' | 'family' | 'slow-soulful' | 'local-life' | 'taste-himalayas' | 'wild-offbeat';
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  rating?: number;
  reviewCount?: number;
  duration: string;
  durationBand: 'under-3-hours' | 'half-day' | 'full-day' | 'multi-day';
  groupSize: string;
  groupSizeMax: number;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging';
  price: number;
  currency: 'INR';
  bestFor: Array<'Couples' | 'Families' | 'Friends & Groups' | 'Solo Travellers'>;
  seasons: Array<'Spring' | 'Summer' | 'Monsoon' | 'Autumn' | 'Winter'>;
  highlights: string[];
  whatYoullExperience: string[];
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string;
  whatToBring: string[];
  importantInfo?: string[];
  availability: 'Available' | 'Seasonal' | 'On Request';
  verified: boolean;
  featured?: boolean;
  badge?: 'Best Seller' | 'Popular' | 'New';
  basePrice?: number;
  commission?: number;
  partner?: string;
  bookingMethod?: 'whatsapp' | 'partner-managed' | 'instant';
}

const ExperienceSchema = new Schema<ExperienceDocument>(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    region: { type: String, enum: ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand'], required: true },
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
    category: {
      type: String,
      enum: ['Adventure', 'Culture', 'Food', 'Nature', 'Wellness', 'Romance', 'Family', 'Offbeat'],
      required: true
    },
    subCategory: { type: String, required: true },
    mood: {
      type: String,
      enum: ['adventure', 'romantic-escapes', 'family', 'slow-soulful', 'local-life', 'taste-himalayas', 'wild-offbeat'],
      required: true
    },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    gallery: { type: [String], required: true },
    rating: { type: Number },
    reviewCount: { type: Number },
    duration: { type: String, required: true },
    durationBand: { type: String, enum: ['under-3-hours', 'half-day', 'full-day', 'multi-day'], required: true },
    groupSize: { type: String, required: true },
    groupSizeMax: { type: Number, required: true },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'] },
    price: { type: Number, required: true },
    currency: { type: String, enum: ['INR'], required: true, default: 'INR' },
    bestFor: { type: [String], required: true },
    seasons: { type: [String], required: true },
    highlights: { type: [String], required: true },
    whatYoullExperience: { type: [String], required: true },
    inclusions: { type: [String], required: true },
    exclusions: { type: [String], required: true },
    meetingPoint: { type: String, required: true },
    whatToBring: { type: [String], required: true },
    importantInfo: { type: [String] },
    availability: { type: String, enum: ['Available', 'Seasonal', 'On Request'], required: true },
    verified: { type: Boolean, required: true, default: false },
    featured: { type: Boolean },
    badge: { type: String, enum: ['Best Seller', 'Popular', 'New'] },
    basePrice: { type: Number },
    commission: { type: Number },
    partner: { type: String },
    bookingMethod: { type: String, enum: ['whatsapp', 'partner-managed', 'instant'] }
  },
  { timestamps: true }
);

// Supports the Region Hub's per-region experience listing.
ExperienceSchema.index({ regionId: 1, featured: -1 });
// Retained for back-compat with any free-text `region` filtering still in use.
ExperienceSchema.index({ region: 1 });

// `models.Experience` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const Experience = models.Experience ?? model<ExperienceDocument>('Experience', ExperienceSchema);

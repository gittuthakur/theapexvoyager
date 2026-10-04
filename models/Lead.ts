import mongoose, { Schema, type Document } from 'mongoose';
import type { MetaProvenance } from '@/lib/metaProvenance';
import { CAPTURE_KINDS, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, type CaptureKind, type LeadEvent, type LeadPriority, type LeadSource, type LeadStatus, type LeadType } from '@/lib/leads';

const { model, models } = mongoose;

/**
 * Canonical internal Lead. INTERNAL ONLY — never serialize a Lead document into a public
 * response (lib/leads.ts's toPublicLeadAck is the only public shape). Legacy collections
 * (Inquiry / BookingRequest / Enquiry) keep being written by their existing routes;
 * `legacyRef` links a Lead back to the row it mirrors and makes capture idempotent.
 * No ID/payment/passport fields exist by design.
 */
export interface LeadDocument extends Document {
  name?: string;
  phone?: string;
  phoneNormalized?: string;
  email?: string;
  whatsappNumber?: string;
  captureKind: CaptureKind;
  leadType: LeadType;
  status: LeadStatus;
  priority: LeadPriority;
  destination?: string;
  journeySlug?: string;
  propertyRef?: string;
  travelStartDate?: Date;
  travelEndDate?: Date;
  duration?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  budget?: string;
  pickupLocation?: string;
  travelStyle?: string;
  message?: string;
  source: LeadSource;
  sourceDetail?: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  nextFollowUpAt?: Date;
  lastContactedAt?: Date;
  quotedAmount?: number;
  finalAmount?: number;
  assignedTo?: string;
  duplicateOf?: mongoose.Types.ObjectId;
  legacyRef?: { model: string; id: string };
  meta?: MetaProvenance;
  events: LeadEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<LeadEvent>(
  {
    at: { type: Date, required: true },
    type: { type: String, required: true },
    actor: { type: String, required: true },
    text: { type: String },
    from: { type: String },
    to: { type: String }
  },
  { _id: false }
);

const LeadSchema = new Schema<LeadDocument>(
  {
    // Optional only for a WHATSAPP_CLICK: nothing about the visitor is known at click time.
    name: { type: String, maxlength: 200, required: function (this: { captureKind?: string }) { return this.captureKind !== 'WHATSAPP_CLICK'; } },
    phone: { type: String, maxlength: 30 },
    phoneNormalized: { type: String, maxlength: 20 },
    email: { type: String, maxlength: 200 },
    whatsappNumber: { type: String, maxlength: 30 },
    captureKind: { type: String, enum: CAPTURE_KINDS, required: true },
    leadType: { type: String, enum: LEAD_TYPES, required: true },
    status: { type: String, enum: LEAD_STATUSES, default: 'NEW', required: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'NORMAL', required: true },
    destination: { type: String, maxlength: 200 },
    journeySlug: { type: String, maxlength: 200 },
    propertyRef: { type: String, maxlength: 200 },
    travelStartDate: { type: Date },
    travelEndDate: { type: Date },
    duration: { type: String, maxlength: 60 },
    adults: { type: Number, min: 0, max: 100 },
    children: { type: Number, min: 0, max: 100 },
    infants: { type: Number, min: 0, max: 100 },
    rooms: { type: Number, min: 0, max: 50 },
    budget: { type: String, maxlength: 100 },
    pickupLocation: { type: String, maxlength: 200 },
    travelStyle: { type: String, maxlength: 100 },
    message: { type: String, maxlength: 5000 },
    source: { type: String, enum: LEAD_SOURCES, default: 'website', required: true },
    sourceDetail: { type: String, maxlength: 100 },
    landingPage: { type: String, maxlength: 300 },
    referrer: { type: String, maxlength: 300 },
    utmSource: { type: String, maxlength: 100 },
    utmMedium: { type: String, maxlength: 100 },
    utmCampaign: { type: String, maxlength: 150 },
    utmContent: { type: String, maxlength: 150 },
    utmTerm: { type: String, maxlength: 150 },
    nextFollowUpAt: { type: Date },
    lastContactedAt: { type: Date },
    quotedAmount: { type: Number, min: 0 },
    finalAmount: { type: Number, min: 0 },
    assignedTo: { type: String, maxlength: 100 },
    duplicateOf: { type: Schema.Types.ObjectId },
    legacyRef: { type: new Schema({ model: String, id: String }, { _id: false }) },
    // Meta Lead Ads provenance (no tokens/secrets). Idempotency is legacyRef = { MetaLeadAd, leadgen id } (unique index above).
    meta: {
      type: new Schema({
        leadId: String, pageId: String, formId: String, formName: String, campaignId: String, campaignName: String,
        adSetId: String, adSetName: String, adId: String, adName: String, platform: String, isOrganic: Boolean, createdTime: Date,
        answers: [new Schema({ name: String, values: [String] }, { _id: false })]
      }, { _id: false })
    },
    events: { type: [EventSchema], default: [] }
  },
  { timestamps: true }
);

// status+createdAt: the default inbox/filter query. Partial nextFollowUpAt: follow-up
// views only ever touch leads that have one. source+createdAt: source filter/summary.
// phoneNormalized+createdAt: duplicate detection and phone search. journeySlug: package
// filter. legacyRef (unique, partial): idempotent mirroring of legacy rows.
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ nextFollowUpAt: 1 }, { partialFilterExpression: { nextFollowUpAt: { $exists: true } } });
LeadSchema.index({ source: 1, createdAt: -1 });
LeadSchema.index({ phoneNormalized: 1, createdAt: -1 }, { partialFilterExpression: { phoneNormalized: { $exists: true } } });
LeadSchema.index({ journeySlug: 1 }, { partialFilterExpression: { journeySlug: { $exists: true } } });
LeadSchema.index({ 'legacyRef.model': 1, 'legacyRef.id': 1 }, { unique: true, partialFilterExpression: { 'legacyRef.id': { $exists: true } } });

export const Lead = models.Lead ?? model<LeadDocument>('Lead', LeadSchema);

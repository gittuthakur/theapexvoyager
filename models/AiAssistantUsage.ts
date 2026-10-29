import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

/** One document per UTC day: the shared, cross-instance usage counter for the AI Travel Assistant. Holds counts only, never any conversation content. */
export interface AiAssistantUsageDocument extends Document {
  day: string;
  requests: number;
  tokens: number;
  expireAt: Date;
}

const AiAssistantUsageSchema = new Schema<AiAssistantUsageDocument>(
  {
    day: { type: String, required: true, unique: true },
    requests: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    expireAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Old daily counters clean themselves up.
AiAssistantUsageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const AiAssistantUsage = models.AiAssistantUsage ?? model<AiAssistantUsageDocument>('AiAssistantUsage', AiAssistantUsageSchema);

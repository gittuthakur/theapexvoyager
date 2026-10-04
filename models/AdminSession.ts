import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

/** Server-side session. Only a SHA-256 of the cookie token is stored, so a database read
 *  never yields a usable session. Mongo's TTL monitor removes expired rows; every lookup
 *  also checks `expiresAt` itself (the monitor runs only about once a minute). */
export interface AdminSessionDocument extends Document {
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const AdminSessionSchema = new Schema<AdminSessionDocument>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminSession = models.AdminSession ?? model<AdminSessionDocument>('AdminSession', AdminSessionSchema);

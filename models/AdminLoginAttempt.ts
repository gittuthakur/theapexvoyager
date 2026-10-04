import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

/** Failed-login counter shared by every serverless instance (durable, unlike an in-memory
 *  Map). `key` is `<scope>:<sha256 of ip-or-email>:<window bucket>` - no raw email or IP is
 *  stored. Rows expire via TTL once their window is over. */
export interface AdminLoginAttemptDocument extends Document {
  key: string;
  count: number;
  expiresAt: Date;
}

const AdminLoginAttemptSchema = new Schema<AdminLoginAttemptDocument>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true }
});
AdminLoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminLoginAttempt = models.AdminLoginAttempt ?? model<AdminLoginAttemptDocument>('AdminLoginAttempt', AdminLoginAttemptSchema);

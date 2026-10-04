import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export const ADMIN_ROLES = ['OWNER', 'EMPLOYEE'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Minimal admin identity. No profile data. `passwordHash` must never leave the server. */
export interface AdminUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<AdminUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

// At most one OWNER can ever exist (DB-level backstop for the bootstrap's own check).
AdminUserSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'OWNER' } });

export const AdminUser = models.AdminUser ?? model<AdminUserDocument>('AdminUser', AdminUserSchema);

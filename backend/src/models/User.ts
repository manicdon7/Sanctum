import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  tokenHash: string; // SHA-256(SHA-256(derivedKey || userId)) — never stores actual key
  createdAt: Date;
  lastSeenAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);

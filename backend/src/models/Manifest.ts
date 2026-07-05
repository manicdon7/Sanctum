import mongoose, { Schema, Document } from 'mongoose';

export interface IManifest extends Document {
  userId: string;
  encryptedManifest: string; // base64-encoded AES-256-GCM ciphertext — server never decrypts
  updatedAt: Date;
}

const ManifestSchema = new Schema<IManifest>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    encryptedManifest: { type: String, required: true },
  },
  { timestamps: true },
);

export const Manifest = mongoose.model<IManifest>('Manifest', ManifestSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBlob extends Document {
  blobId: string;     // UUID assigned by server
  userId: string;     // owner
  filename: string;   // original sanitized filename from client
  sizeBytes: number;
  gridfsId: mongoose.Types.ObjectId; // reference to GridFS file
  createdAt: Date;
}

const BlobSchema = new Schema<IBlob>(
  {
    blobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    sizeBytes: { type: Number, required: true, default: 0 },
    gridfsId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

export const Blob = mongoose.model<IBlob>('Blob', BlobSchema);

/**
 * MongoDB connection — Sanctum Sync Backend
 *
 * Connects once on startup and reuses the connection.
 * All models use this connection via Mongoose's default connection.
 */

import mongoose from 'mongoose';

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;

  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/sanctum';

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  connected = true;
  console.log('[Sanctum Backend] MongoDB connected:', mongoose.connection.host);
}

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) throw new Error('[Sanctum] MongoDB not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'blobs' });
}

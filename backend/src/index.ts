/**
 * Sanctum Sync Backend
 *
 * MongoDB-backed encrypted blob sync server.
 * The server NEVER has access to the encryption key.
 * The server NEVER decrypts any content.
 * All content is stored as received — opaque, encrypted bytes.
 *
 * Auth: Bearer token = SHA-256(derivedKey || userId).
 *       Server stores SHA-256(token) per user.
 *
 * Routes:
 *   POST   /sync/push         — upload encrypted manifest
 *   GET    /sync/pull/:userId — download encrypted manifest
 *   POST   /sync/blob         — upload encrypted blob (GridFS)
 *   GET    /sync/blob/:id     — download encrypted blob
 *   GET    /sync/blobs        — list blob IDs for user
 *   DELETE /sync/blob/:id     — delete single blob
 *   DELETE /sync/user/:userId — wipe all user data
 *   POST   /sync/ai/reframe   — gentle AI reframe
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectMongo } from './db/mongo';
import { syncRouter } from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
  }),
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Sanctum-User-Id', 'X-Blob-Filename'],
  }),
);

// Rate limiting — prevent brute force and abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});

app.use(limiter);

// Body parsing — JSON for manifests, raw binary for blobs
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '200mb' }));

// ── Routes ───────────────────────────────────────────────────────────────────

app.use('/sync', syncRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Sanctum Backend Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────

async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`[Sanctum Sync Backend] Listening on port ${PORT}`);
      console.log(`[Sanctum Sync Backend] MongoDB: ${process.env.MONGODB_URI ?? 'localhost:27017/sanctum'}`);
      console.log(`[Sanctum Sync Backend] Zero-knowledge: server never decrypts content`);
    });
  } catch (err) {
    console.error('[Sanctum Backend] Failed to start:', err);
    process.exit(1);
  }
}

start();

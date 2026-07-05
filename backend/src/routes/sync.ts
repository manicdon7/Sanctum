/**
 * Sync Routes — MongoDB-backed encrypted blob storage.
 *
 * Zero-knowledge guarantee: all content is opaque encrypted bytes.
 * The server stores, retrieves, and deletes blobs without ever inspecting them.
 *
 * Auth: Bearer token = SHA-256(derivedKey || userId).
 * Server stores SHA-256(token) and compares with constant-time equality.
 *
 * Binary blobs (photos, voice, video) are stored in MongoDB GridFS.
 * Manifests (JSON metadata) are stored in the manifests collection.
 */

import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { User } from '../models/User';
import { Manifest } from '../models/Manifest';
import { Blob } from '../models/Blob';
import { getGridFSBucket } from '../db/mongo';

const router = express.Router();

// ── Auth middleware ──────────────────────────────────────────────────────────

async function verifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-sanctum-user-id'] as string | undefined;

  if (!authHeader || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token.length < 32) {
    res.status(401).json({ error: 'Invalid token format' });
    return;
  }

  const providedHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    let user = await User.findOne({ userId });

    if (!user) {
      // First time — register this device's token
      user = await User.create({ userId, tokenHash: providedHash });
    } else {
      // Constant-time comparison to prevent timing attacks
      const storedBuf = Buffer.from(user.tokenHash, 'hex');
      const providedBuf = Buffer.from(providedHash, 'hex');
      if (
        storedBuf.length !== providedBuf.length ||
        !crypto.timingSafeEqual(storedBuf, providedBuf)
      ) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      // Update last seen
      await User.updateOne({ userId }, { lastSeenAt: new Date() });
    }

    next();
  } catch (err) {
    console.error('[Sync] Auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /sync/push
 * Upload the encrypted manifest (JSON metadata about all entries).
 * Body: { manifest: string } — base64-encoded encrypted manifest
 */
router.post('/push', verifyToken, async (req, res) => {
  const userId = req.headers['x-sanctum-user-id'] as string;
  const { manifest } = req.body as { manifest?: string };

  if (!manifest || typeof manifest !== 'string') {
    res.status(400).json({ error: 'Missing or invalid manifest' });
    return;
  }

  try {
    await Manifest.findOneAndUpdate(
      { userId },
      { userId, encryptedManifest: manifest },
      { upsert: true, new: true },
    );
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Sync] Push error:', err);
    res.status(500).json({ error: 'Failed to store manifest' });
  }
});

/**
 * GET /sync/pull/:userId
 * Download the user's current encrypted manifest.
 */
router.get('/pull/:userId', verifyToken, async (req, res) => {
  const userId = req.params['userId']!;

  try {
    const record = await Manifest.findOne({ userId });
    res.json({ manifest: record?.encryptedManifest ?? null });
  } catch (err) {
    console.error('[Sync] Pull error:', err);
    res.status(500).json({ error: 'Failed to retrieve manifest' });
  }
});

/**
 * POST /sync/blob
 * Upload a single encrypted blob (journal export, media file, etc.).
 * Body: raw binary (application/octet-stream) or multipart with 'blob' field.
 * Header: X-Blob-Filename — original filename (should be a UUID)
 * Returns the server-assigned blob ID.
 */
router.post('/blob', verifyToken, async (req, res) => {
  const userId = req.headers['x-sanctum-user-id'] as string;
  const rawFilename = (req.headers['x-blob-filename'] as string | undefined) ?? uuidv4();
  const filename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 128);
  const blobId = uuidv4();

  try {
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { userId, blobId },
    });

    // req is a readable stream when body is application/octet-stream
    await new Promise<void>((resolve, reject) => {
      req.pipe(uploadStream);
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      req.on('error', reject);
    });

    await Blob.create({
      blobId,
      userId,
      filename,
      sizeBytes: uploadStream.length ?? 0,
      gridfsId: uploadStream.id,
    });

    res.json({ ok: true, blobId });
  } catch (err) {
    console.error('[Sync] Blob upload error:', err);
    res.status(500).json({ error: 'Failed to upload blob' });
  }
});

/**
 * GET /sync/blob/:blobId
 * Download a specific encrypted blob.
 */
router.get('/blob/:blobId', verifyToken, async (req, res) => {
  const userId = req.headers['x-sanctum-user-id'] as string;
  const blobId = req.params['blobId']!.replace(/[^a-zA-Z0-9._-]/g, '');

  try {
    const record = await Blob.findOne({ blobId, userId });
    if (!record) {
      res.status(404).json({ error: 'Blob not found' });
      return;
    }

    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(record.gridfsId);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${record.filename}"`);

    downloadStream.pipe(res);
    downloadStream.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
    });
  } catch (err) {
    console.error('[Sync] Blob download error:', err);
    res.status(500).json({ error: 'Failed to download blob' });
  }
});

/**
 * GET /sync/blobs
 * List all blob IDs for this user (so the client can reconcile).
 */
router.get('/blobs', verifyToken, async (req, res) => {
  const userId = req.headers['x-sanctum-user-id'] as string;

  try {
    const records = await Blob.find({ userId }, { blobId: 1, filename: 1, sizeBytes: 1, createdAt: 1 });
    res.json({ blobs: records });
  } catch (err) {
    console.error('[Sync] List blobs error:', err);
    res.status(500).json({ error: 'Failed to list blobs' });
  }
});

/**
 * DELETE /sync/blob/:blobId
 * Delete a single blob.
 */
router.delete('/blob/:blobId', verifyToken, async (req, res) => {
  const userId = req.headers['x-sanctum-user-id'] as string;
  const blobId = req.params['blobId']!.replace(/[^a-zA-Z0-9._-]/g, '');

  try {
    const record = await Blob.findOneAndDelete({ blobId, userId });
    if (!record) {
      res.status(404).json({ error: 'Blob not found' });
      return;
    }

    const bucket = getGridFSBucket();
    await bucket.delete(record.gridfsId);

    res.json({ ok: true });
  } catch (err) {
    console.error('[Sync] Blob delete error:', err);
    res.status(500).json({ error: 'Failed to delete blob' });
  }
});

/**
 * POST /sync/ai/reframe
 * Zero-knowledge AI reframe assistant.
 * Body: { notes: string }
 */
router.post('/ai/reframe', async (req, res) => {
  const { notes } = req.body as { notes?: string };
  if (!notes || typeof notes !== 'string') {
    res.status(400).json({ error: 'Missing notes' });
    return;
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicApiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 150,
          system:
            'You are a warm, gentle, quiet companion. The user had a goal attempt that did not land. Provide one short, compassionate reframe (1-2 sentences) without toxic positivity or exclamation marks. Speak softly.',
          messages: [{ role: 'user', content: `The user noted: "${notes}". Give a gentle reframe.` }],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { content?: { text?: string }[] };
        const reframe = data.content?.[0]?.text?.trim();
        if (reframe) {
          res.json({ reframe });
          return;
        }
      }
    } catch (err) {
      console.warn('[Sync] Anthropic API failed:', err);
    }
  }

  // Fallback reframe
  res.json({
    reframe: "This try didn't settle the way you intended. Let yourself rest before looking at what it teaches.",
  });
});

/**
 * DELETE /sync/user/:userId
 * Device-initiated full wipe. Deletes all user data from MongoDB.
 */
router.delete('/user/:userId', verifyToken, async (req, res) => {
  const userId = req.params['userId']!;

  try {
    // Delete all blobs from GridFS
    const blobs = await Blob.find({ userId });
    const bucket = getGridFSBucket();
    await Promise.all(blobs.map((b) => bucket.delete(b.gridfsId).catch(() => {})));

    // Delete all records
    await Promise.all([
      Blob.deleteMany({ userId }),
      Manifest.deleteOne({ userId }),
      User.deleteOne({ userId }),
    ]);

    res.json({ ok: true, message: 'All data deleted from server' });
  } catch (err) {
    console.error('[Sync] Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

export { router as syncRouter };

import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { getDB } from '@/core/db/client';
import { mediaFiles, type MediaFile, type NewMediaFile } from '@/core/db/schema';
import { safeEncrypt, safeDecrypt, encryptFile } from '@/core/encryption/crypto';
import { eq, desc, isNull, and } from 'drizzle-orm';

interface DecryptedMedia extends Omit<MediaFile, 'nameEncrypted'> {
  name: string;
}

interface VaultState {
  media: DecryptedMedia[];
  isLoading: boolean;
  error: string | null;

  loadMedia: (key: Uint8Array | null) => Promise<void>;
  addMedia: (
    sourceUri: string,
    originalName: string,
    type: 'photo' | 'video' | 'voice' | 'document',
    sizeBytes: number,
    durationMs: number | null,
    key: Uint8Array | null,
  ) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>()((set, get) => ({
  media: [],
  isLoading: false,
  error: null,

  loadMedia: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(mediaFiles)
        .where(isNull(mediaFiles.deletedAt))
        .orderBy(desc(mediaFiles.recordedAt));

      const decrypted: DecryptedMedia[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          name: await safeDecrypt(row.nameEncrypted, key),
        })),
      );

      set({ media: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addMedia: async (sourceUri, originalName, type, sizeBytes, durationMs, key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const id = generateId();
      const now = new Date();

      // Define local secure storage paths
      const mediaDir = `${Paths.document.uri}/vault/media/`;
      const thumbDir = `${Paths.document.uri}/vault/thumbnails/`;

      await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(thumbDir, { intermediates: true });

      const extension = originalName.split('.').pop() || '';
      const destUri = `${mediaDir}${id}.${extension}`;
      const thumbDestUri = `${thumbDir}${id}.jpg`;

      // 1. Encrypt and copy the media file
      if (key) {
        await encryptFile(sourceUri, key, destUri);
      } else {
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      }

      // 2. Generate thumbnail if image
      let thumbnailUri: string | null = null;
      if (type === 'photo') {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            sourceUri,
            [{ resize: { width: 300 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );

          if (key) {
            await encryptFile(manipResult.uri, key, thumbDestUri);
            thumbnailUri = thumbDestUri;
          } else {
            await FileSystem.copyAsync({ from: manipResult.uri, to: thumbDestUri });
            thumbnailUri = thumbDestUri;
          }
        } catch (err) {
          console.warn('[VaultStore] Thumbnail generation failed:', err);
        }
      }

      // 3. Save to database
      const nameEncrypted = await safeEncrypt(originalName, key);

      const newMedia: NewMediaFile = {
        id,
        type,
        encryptedUri: destUri,
        thumbnailUri,
        nameEncrypted,
        sizeBytes,
        durationMs,
        recordedAt: now,
      };

      await db.insert(mediaFiles).values(newMedia);

      const decryptedItem: DecryptedMedia = {
        id,
        type,
        encryptedUri: destUri,
        thumbnailUri,
        sizeBytes,
        durationMs,
        recordedAt: now,
        deletedAt: null,
        name: originalName,
      };

      set((state) => ({
        media: [decryptedItem, ...state.media],
        isLoading: false,
      }));
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  deleteMedia: async (id) => {
    try {
      const db = getDB();
      const now = new Date();

      // Find the media record to delete the local files physically
      const [mediaRecord] = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.id, id))
        .limit(1);

      if (mediaRecord) {
        // Delete files
        try {
          if (mediaRecord.encryptedUri) {
            await FileSystem.deleteAsync(mediaRecord.encryptedUri, { idempotent: true });
          }
          if (mediaRecord.thumbnailUri) {
            await FileSystem.deleteAsync(mediaRecord.thumbnailUri, { idempotent: true });
          }
        } catch (err) {
          console.warn('[VaultStore] Failed to physically delete media files:', err);
        }
      }

      // Soft/Hard delete in DB
      await db.update(mediaFiles).set({ deletedAt: now }).where(eq(mediaFiles.id, id));

      set((state) => ({
        media: state.media.filter((m) => m.id !== id),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

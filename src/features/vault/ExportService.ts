import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { getDB } from '@/core/db/client';
import { entries, notes, mediaFiles } from '@/core/db/schema';
import { safeDecrypt } from '@/core/encryption/crypto';
import { isNull } from 'drizzle-orm';

export class ExportService {
  /**
   * Decrypts all journal entries, vent entries, and notes,
   * copies all media files, generates a manifest, zips it up,
   * and opens the sharing dialog.
   * 
   * @param key - The current session encryption key
   * @returns The path of the created zip file
   */
  static async exportAll(key: Uint8Array | null): Promise<string> {
    const db = getDB();
    const tempDir = `${Paths.cache.uri}/sanctum_export_${Date.now()}/`;
    const zipDest = `${Paths.cache.uri}/sanctum_export_${Date.now()}.zip`;

    // Ensure temp directory exists
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

    try {
      // 1. Export Entries (Journal & Vent)
      const allEntries = await db
        .select()
        .from(entries)
        .where(isNull(entries.deletedAt));

      const entriesDir = `${tempDir}entries/`;
      await FileSystem.makeDirectoryAsync(entriesDir, { intermediates: true });

      const entryManifests = [];

      for (const entry of allEntries) {
        const decryptedBody = await safeDecrypt(entry.bodyEncrypted, key);
        const fileName = `${entry.type}_${entry.id}.md`;
        const filePath = `${entriesDir}${fileName}`;

        // Format as Markdown with frontmatter
        const markdown = `---
id: ${entry.id}
type: ${entry.type}
tagColor: ${entry.tagColor || ''}
createdAt: ${entry.createdAt.toISOString()}
updatedAt: ${entry.updatedAt.toISOString()}
---

${decryptedBody}
`;

        await FileSystem.writeAsStringAsync(filePath, markdown, {
          encoding: 'utf8',
        });

        entryManifests.push({
          id: entry.id,
          type: entry.type,
          tagColor: entry.tagColor,
          fileName,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        });
      }

      // 2. Export Notes (Knowledge Garden)
      const allNotes = await db
        .select()
        .from(notes)
        .where(isNull(notes.deletedAt));

      const notesDir = `${tempDir}notes/`;
      await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });

      const noteManifests = [];

      for (const note of allNotes) {
        const decryptedTitle = await safeDecrypt(note.titleEncrypted, key);
        const decryptedBody = await safeDecrypt(note.bodyEncrypted, key);
        const fileName = `${decryptedTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${note.id}.md`;
        const filePath = `${notesDir}${fileName}`;

        const markdown = `---
id: ${note.id}
title: ${decryptedTitle}
createdAt: ${note.createdAt.toISOString()}
updatedAt: ${note.updatedAt.toISOString()}
---

# ${decryptedTitle}

${decryptedBody}
`;

        await FileSystem.writeAsStringAsync(filePath, markdown, {
          encoding: 'utf8',
        });

        noteManifests.push({
          id: note.id,
          title: decryptedTitle,
          fileName,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        });
      }

      // 3. Export Media Files
      const allMedia = await db
        .select()
        .from(mediaFiles)
        .where(isNull(mediaFiles.deletedAt));

      const mediaDir = `${tempDir}media/`;
      await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });

      const mediaManifests = [];

      for (const media of allMedia) {
        const decryptedName = await safeDecrypt(media.nameEncrypted, key);
        const fileName = `${media.id}_${decryptedName}`;
        const destPath = `${mediaDir}${fileName}`;

        // In production, decrypt the file blob here using libsodium
        // For MVP, we copy the encrypted/raw file
        try {
          if (await FileSystem.getInfoAsync(media.encryptedUri).then(i => i.exists)) {
            await FileSystem.copyAsync({
              from: media.encryptedUri,
              to: destPath,
            });
          }
        } catch (err) {
          console.warn(`[ExportService] Failed to copy media ${media.id}:`, err);
        }

        mediaManifests.push({
          id: media.id,
          type: media.type,
          originalName: decryptedName,
          fileName,
          sizeBytes: media.sizeBytes,
          recordedAt: media.recordedAt.toISOString(),
        });
      }

      // 4. Generate Manifest JSON
      const manifest = {
        exportedAt: new Date().toISOString(),
        app: 'Sanctum',
        version: '1.0.0',
        entries: entryManifests,
        notes: noteManifests,
        media: mediaManifests,
      };

      await FileSystem.writeAsStringAsync(
        `${tempDir}manifest.json`,
        JSON.stringify(manifest, null, 2),
        { encoding: 'utf8' },
      );

      // 5. Zip it up using pure JS JSZip and FileSystem
      const zip = new JSZip();

      // Recursive helper to traverse the temp export directory and pack it
      const addDirToZip = async (currentDir: string, zipFolder: JSZip) => {
        const contents = await FileSystem.readDirectoryAsync(currentDir);
        for (const file of contents) {
          const filePath = `${currentDir}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          if (info.isDirectory) {
            // Append trailing slash for directory resolution in expo-file-system
            const subFolder = zipFolder.folder(file) || zipFolder;
            await addDirToZip(`${filePath}/`, subFolder);
          } else {
            // Read file in base64 format for binary compatibility (supports media files + markdown)
            const fileBase64 = await FileSystem.readAsStringAsync(filePath, {
              encoding: 'base64',
            });
            zipFolder.file(file, fileBase64, { base64: true });
          }
        }
      };

      await addDirToZip(tempDir, zip);
      const zipBase64 = await zip.generateAsync({ type: 'base64' });

      await FileSystem.writeAsStringAsync(zipDest, zipBase64, {
        encoding: 'base64',
      });

      // 6. Share Zip file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipDest, {
          mimeType: 'application/zip',
          dialogTitle: 'Export Sanctum Data',
          UTI: 'public.zip-archive',
        });
      } else {
        throw new Error('Sharing is not available on this device.');
      }

      return zipDest;
    } finally {
      // Clean up decrypted temp directory
      try {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      } catch (err) {
        console.warn('[ExportService] Cleanup failed:', err);
      }
    }
  }
}

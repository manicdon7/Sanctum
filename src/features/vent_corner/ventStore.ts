/**
 * Vent Corner Store — Zustand
 * Manages vent/journal entries, drafts, and tag color selection.
 */

import { create } from 'zustand';
import { getDB } from '@/core/db/client';
import { entries, type Entry, type NewEntry } from '@/core/db/schema';
import { safeEncrypt, safeDecrypt } from '@/core/encryption/crypto';
import { eq, desc, isNull, and } from 'drizzle-orm';

const TAG_COLORS = [
  '#7B9BAF', // dusty blue
  '#7A9E7E', // sage
  '#D4903A', // amber
  '#B87461', // terracotta
  '#9B7FB6', // soft violet
  '#6B8CAE', // slate blue
  '#A89B8C', // warm taupe
];

interface DecryptedEntry extends Omit<Entry, 'bodyEncrypted'> {
  body: string;
}

interface VentState {
  entries: DecryptedEntry[];
  draft: string;
  draftTagColor: string;
  isLoading: boolean;
  error: string | null;

  loadEntries: (key: Uint8Array | null) => Promise<void>;
  saveDraft: () => void;
  clearDraft: () => void;
  saveEntry: (
    body: string,
    tagColor: string,
    key: Uint8Array | null,
    type?: 'vent' | 'journal',
  ) => Promise<void>;
  updateEntry: (id: string, body: string, key: Uint8Array | null) => Promise<void>;
  updateTagColor: (id: string, color: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setDraft: (text: string) => void;
  setDraftTagColor: (color: string) => void;
  getRandomTagColor: () => string;
}

export const useVentStore = create<VentState>()((set, get) => ({
  entries: [],
  draft: '',
  draftTagColor: TAG_COLORS[0] ?? '#7B9BAF',
  isLoading: false,
  error: null,

  loadEntries: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(entries)
        .where(and(isNull(entries.deletedAt), eq(entries.isDraft, false)))
        .orderBy(desc(entries.createdAt))
        .limit(200);

      const decrypted: DecryptedEntry[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          body: await safeDecrypt(row.bodyEncrypted, key),
        })),
      );

      set({ entries: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  saveDraft: () => {
    // Draft persisted in store only (not DB) for quick access
  },

  clearDraft: () => set({ draft: '', draftTagColor: TAG_COLORS[0] ?? '#7B9BAF' }),

  saveEntry: async (body, tagColor, key, type = 'vent') => {
    if (!body.trim()) return;
    const db = getDB();
    const now = new Date();
    const id = generateId();

    const bodyEncrypted = await safeEncrypt(body, key);

    const newEntry: NewEntry = {
      id,
      type,
      bodyEncrypted,
      tagColor,
      isDraft: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(entries).values(newEntry);

    const decryptedEntry: DecryptedEntry = {
      id,
      type,
      tagColor: tagColor ?? '#7B9BAF',
      isDraft: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      body,
    };

    set((state) => ({
      entries: [decryptedEntry, ...state.entries],
      draft: '',
    }));
  },

  updateEntry: async (id, body, key) => {
    const db = getDB();
    const now = new Date();
    const bodyEncrypted = await safeEncrypt(body, key);

    await db
      .update(entries)
      .set({ bodyEncrypted, updatedAt: now })
      .where(eq(entries.id, id));

    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, body, bodyEncrypted, updatedAt: now } : e,
      ),
    }));
  },

  updateTagColor: async (id, color) => {
    const db = getDB();
    const now = new Date();
    await db.update(entries).set({ tagColor: color, updatedAt: now }).where(eq(entries.id, id));
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, tagColor: color } : e)),
    }));
  },

  deleteEntry: async (id) => {
    const db = getDB();
    const now = new Date();
    // Soft delete
    await db.update(entries).set({ deletedAt: now }).where(eq(entries.id, id));
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  setDraft: (text) => set({ draft: text }),
  setDraftTagColor: (color) => set({ draftTagColor: color }),

  getRandomTagColor: () => {
    const idx = Math.floor(Math.random() * TAG_COLORS.length);
    return TAG_COLORS[idx] ?? '#7B9BAF';
  },
}));

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { TAG_COLORS };

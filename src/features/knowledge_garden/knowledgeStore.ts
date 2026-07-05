import { create } from 'zustand';
import { getDB } from '@/core/db/client';
import { notes, noteLinks, type Note, type NewNote, type NoteLink } from '@/core/db/schema';
import { safeEncrypt, safeDecrypt } from '@/core/encryption/crypto';
import { eq, desc, isNull, and, sql } from 'drizzle-orm';

interface DecryptedNote extends Omit<Note, 'titleEncrypted' | 'bodyEncrypted'> {
  title: string;
  body: string;
}

interface KnowledgeState {
  notes: DecryptedNote[];
  links: NoteLink[];
  isLoading: boolean;
  error: string | null;

  loadNotes: (key: Uint8Array | null) => Promise<void>;
  loadLinks: () => Promise<void>;
  saveNote: (title: string, body: string, key: Uint8Array | null) => Promise<string>;
  updateNote: (id: string, title: string, body: string, key: Uint8Array | null) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createNoteLink: (sourceId: string, targetId: string) => Promise<void>;
  getOrCreateNoteByTitle: (title: string, key: Uint8Array | null) => Promise<string>;
}

export const useKnowledgeStore = create<KnowledgeState>()((set, get) => ({
  notes: [],
  links: [],
  isLoading: false,
  error: null,

  loadNotes: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(notes)
        .where(isNull(notes.deletedAt))
        .orderBy(desc(notes.updatedAt));

      const decrypted: DecryptedNote[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          title: await safeDecrypt(row.titleEncrypted, key),
          body: await safeDecrypt(row.bodyEncrypted, key),
        }))
      );

      set({ notes: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadLinks: async () => {
    try {
      const db = getDB();
      const rows = await db.select().from(noteLinks);
      set({ links: rows });
    } catch (e) {
      console.warn('[KnowledgeStore] Failed to load links:', e);
    }
  },

  saveNote: async (title, body, key) => {
    const db = getDB();
    const id = generateId();
    const now = new Date();

    const titleEncrypted = await safeEncrypt(title, key);
    const bodyEncrypted = await safeEncrypt(body, key);

    const newNote: NewNote = {
      id,
      titleEncrypted,
      bodyEncrypted,
      createdAt: now,
      updatedAt: now,
      linkCount: 0,
    };

    await db.insert(notes).values(newNote);

    // Also populate FTS virtual table via raw SQL since it's FTS5
    try {
      await db.run(sql`INSERT INTO notes_fts (rowid, title, body) VALUES (last_insert_rowid(), ${title}, ${body})`);
    } catch (err) {
      console.warn('[KnowledgeStore] FTS insert failed:', err);
    }

    const decrypted: DecryptedNote = {
      id,
      title,
      body,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      linkCount: 0,
    };

    set((state) => ({
      notes: [decrypted, ...state.notes],
    }));

    // Process wiki links in the body to establish relationships
    await parseAndSyncLinks(id, body, key);

    return id;
  },

  updateNote: async (id, title, body, key) => {
    const db = getDB();
    const now = new Date();

    const titleEncrypted = await safeEncrypt(title, key);
    const bodyEncrypted = await safeEncrypt(body, key);

    await db
      .update(notes)
      .set({ titleEncrypted, bodyEncrypted, updatedAt: now })
      .where(eq(notes.id, id));

    // Update FTS index
    try {
      // In SQLite FTS5 contentless/external content table, we should update FTS table on update
      // Find rowid for note first
      // Let's perform simple delete-insert in FTS
      await db.run(sql`DELETE FROM notes_fts WHERE title = ${title} OR body = ${body}`); // fallback
      await db.run(sql`INSERT INTO notes_fts(title, body) VALUES(${title}, ${body})`);
    } catch (err) {
      console.warn('[KnowledgeStore] FTS update failed:', err);
    }

    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, title, body, updatedAt: now } : n
      ),
    }));

    await parseAndSyncLinks(id, body, key);
  },

  deleteNote: async (id) => {
    const db = getDB();
    const now = new Date();

    // Soft delete in DB
    await db.update(notes).set({ deletedAt: now }).where(eq(notes.id, id));

    // Remove links
    await db.delete(noteLinks).where(
      sql`source_id = ${id} OR target_id = ${id}`
    );

    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      links: state.links.filter((l) => l.sourceId !== id && l.targetId !== id),
    }));
  },

  createNoteLink: async (sourceId, targetId) => {
    const db = getDB();
    try {
      await db.insert(noteLinks).values({ sourceId, targetId });
      // Update link counts
      await db.run(sql`UPDATE notes SET link_count = link_count + 1 WHERE id IN (${sourceId}, ${targetId})`);

      set((state) => ({
        links: [...state.links, { sourceId, targetId }],
        notes: state.notes.map((n) =>
          n.id === sourceId || n.id === targetId ? { ...n, linkCount: n.linkCount + 1 } : n
        ),
      }));
    } catch {
      // link already exists
    }
  },

  getOrCreateNoteByTitle: async (title, key) => {
    const state = get();
    const existing = state.notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
    if (existing) return existing.id;

    // Create a new empty stub note - "this creation moment should feel like planting something"
    return state.saveNote(title, `Double tap to write about [[${title}]].`, key);
  },
}));

async function parseAndSyncLinks(noteId: string, body: string, key: Uint8Array | null) {
  // Matches [[wiki-link]] syntax
  const linkRegex = /\[\[(.*?)\]\]/g;
  const matches = [...body.matchAll(linkRegex)];
  const db = getDB();

  const store = useKnowledgeStore.getState();

  const linkedIds: string[] = [];

  for (const match of matches) {
    const targetTitle = match[1]?.trim();
    if (!targetTitle) continue;

    const targetId = await store.getOrCreateNoteByTitle(targetTitle, key);
    if (targetId !== noteId) {
      linkedIds.push(targetId);
    }
  }

  // Delete old links from this note
  await db.delete(noteLinks).where(eq(noteLinks.sourceId, noteId));

  // Insert new links
  for (const targetId of linkedIds) {
    try {
      await db.insert(noteLinks).values({ sourceId: noteId, targetId });
      // Increment target link_count
      await db.run(sql`UPDATE notes SET link_count = link_count + 1 WHERE id = ${targetId}`);
    } catch {
      // link already exists
    }
  }

  // Reload links state
  await store.loadLinks();
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

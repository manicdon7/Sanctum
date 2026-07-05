import { create } from 'zustand';
import { getDB } from '@/core/db/client';
import { goals, goalAttempts, type Goal, type GoalAttempt } from '@/core/db/schema';
import { safeEncrypt, safeDecrypt } from '@/core/encryption/crypto';
import { eq, desc, isNull, and } from 'drizzle-orm';

interface DecryptedGoal extends Omit<Goal, 'nameEncrypted' | 'descriptionEncrypted'> {
  name: string;
  description: string;
}

interface DecryptedAttempt extends Omit<GoalAttempt, 'notesEncrypted' | 'reframeEncrypted'> {
  notes: string;
  reframe: string;
}

interface GrowthState {
  goals: DecryptedGoal[];
  attempts: DecryptedAttempt[];
  isLoading: boolean;
  error: string | null;

  loadGoals: (key: Uint8Array | null) => Promise<void>;
  loadAttempts: (key: Uint8Array | null) => Promise<void>;
  createGoal: (name: string, description: string, key: Uint8Array | null) => Promise<void>;
  createAttempt: (
    goalId: string,
    outcome: 'worked' | 'didnt_land',
    notes: string,
    reframe: string | null,
    key: Uint8Array | null
  ) => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;
}

export const useGrowthStore = create<GrowthState>()((set, get) => ({
  goals: [],
  attempts: [],
  isLoading: false,
  error: null,

  loadGoals: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(goals)
        .where(isNull(goals.archivedAt))
        .orderBy(desc(goals.createdAt));

      const decrypted: DecryptedGoal[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          name: await safeDecrypt(row.nameEncrypted, key),
          description: await safeDecrypt(row.descriptionEncrypted || '', key),
        }))
      );

      set({ goals: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadAttempts: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(goalAttempts)
        .orderBy(desc(goalAttempts.attemptedAt));

      const decrypted: DecryptedAttempt[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          notes: await safeDecrypt(row.notesEncrypted || '', key),
          reframe: await safeDecrypt(row.reframeEncrypted || '', key),
        }))
      );

      set({ attempts: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createGoal: async (name, description, key) => {
    const db = getDB();
    const id = generateId();
    const now = new Date();

    const nameEncrypted = await safeEncrypt(name, key);
    const descriptionEncrypted = await safeEncrypt(description, key);

    await db.insert(goals).values({
      id,
      nameEncrypted,
      descriptionEncrypted,
      createdAt: now,
    });

    const decrypted: DecryptedGoal = {
      id,
      name,
      description,
      createdAt: now,
      archivedAt: null,
    };

    set((state) => ({
      goals: [decrypted, ...state.goals],
    }));
  },

  createAttempt: async (goalId, outcome, notes, reframe, key) => {
    const db = getDB();
    const id = generateId();
    const now = new Date();

    const notesEncrypted = await safeEncrypt(notes, key);
    const reframeEncrypted = reframe ? await safeEncrypt(reframe, key) : null;

    await db.insert(goalAttempts).values({
      id,
      goalId,
      outcome,
      notesEncrypted,
      reframeEncrypted,
      attemptedAt: now,
    });

    const decrypted: DecryptedAttempt = {
      id,
      goalId,
      outcome,
      notes,
      reframe: reframe || '',
      attemptedAt: now,
    };

    set((state) => ({
      attempts: [decrypted, ...state.attempts],
    }));
  },

  archiveGoal: async (id) => {
    const db = getDB();
    const now = new Date();

    await db
      .update(goals)
      .set({ archivedAt: now })
      .where(eq(goals.id, id));

    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },
}));

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

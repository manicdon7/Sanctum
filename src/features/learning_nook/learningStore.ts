import { create } from 'zustand';
import { getDB } from '@/core/db/client';
import { flashcardDecks, flashcardCards, reviewLog, type FlashcardDeck, type FlashcardCard } from '@/core/db/schema';
import { safeEncrypt, safeDecrypt } from '@/core/encryption/crypto';
import { sm2Review, type SM2Rating } from './SM2';
import { eq, desc, isNull, and, sql } from 'drizzle-orm';

interface DecryptedCard extends Omit<FlashcardCard, 'frontEncrypted' | 'backEncrypted'> {
  front: string;
  bodyBack: string; // avoiding naming collision with 'back' keyword
}

interface LearningState {
  decks: FlashcardDeck[];
  cards: Record<string, DecryptedCard[]>; // deckId -> cards
  streak: number;
  isLoading: boolean;
  error: string | null;

  loadDecks: (key: Uint8Array | null) => Promise<void>;
  loadCards: (deckId: string, key: Uint8Array | null) => Promise<void>;
  createDeck: (name: string, key: Uint8Array | null) => Promise<string>;
  createCard: (deckId: string, front: string, back: string, key: Uint8Array | null) => Promise<void>;
  submitReview: (cardId: string, rating: SM2Rating, key: Uint8Array | null) => Promise<void>;
  loadStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
  deleteCard: (deckId: string, cardId: string) => Promise<void>;
}

export const useLearningStore = create<LearningState>()((set, get) => ({
  decks: [],
  cards: {},
  streak: 0,
  isLoading: false,
  error: null,

  loadDecks: async (key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(flashcardDecks)
        .where(isNull(flashcardDecks.deletedAt))
        .orderBy(desc(flashcardDecks.updatedAt));
      
      // Decrypt deck names
      const decrypted = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          name: await safeDecrypt(row.nameEncrypted, key),
        }))
      );
      // Drizzle interface mapping
      // @ts-ignore
      set({ decks: decrypted, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadCards: async (deckId, key) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const rows = await db
        .select()
        .from(flashcardCards)
        .where(and(eq(flashcardCards.deckId, deckId), isNull(flashcardCards.deletedAt)))
        .orderBy(desc(flashcardCards.createdAt));

      const decrypted: DecryptedCard[] = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          front: await safeDecrypt(row.frontEncrypted, key),
          bodyBack: await safeDecrypt(row.backEncrypted, key),
        }))
      );

      set((state) => ({
        cards: { ...state.cards, [deckId]: decrypted },
        isLoading: false,
      }));
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createDeck: async (name, key) => {
    const db = getDB();
    const id = generateId();
    const now = new Date();
    const nameEncrypted = await safeEncrypt(name, key);

    await db.insert(flashcardDecks).values({
      id,
      nameEncrypted,
      createdAt: now,
      updatedAt: now,
    });

    const newDeck = {
      id,
      nameEncrypted,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      name,
    };

    // @ts-ignore
    set((state) => ({
      decks: [newDeck, ...state.decks],
    }));

    return id;
  },

  createCard: async (deckId, front, back, key) => {
    const db = getDB();
    const id = generateId();
    const now = new Date();

    const frontEncrypted = await safeEncrypt(front, key);
    const backEncrypted = await safeEncrypt(back, key);

    await db.insert(flashcardCards).values({
      id,
      deckId,
      frontEncrypted,
      backEncrypted,
      dueDate: now,
      createdAt: now,
    });

    const newCard: DecryptedCard = {
      id,
      deckId,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      createdAt: now,
      deletedAt: null,
      front,
      bodyBack: back,
    };

    set((state) => ({
      cards: {
        ...state.cards,
        [deckId]: [newCard, ...(state.cards[deckId] || [])],
      },
    }));
  },

  submitReview: async (cardId, rating, key) => {
    const db = getDB();
    const now = new Date();

    // 1. Fetch current card
    const [cardRecord] = await db
      .select()
      .from(flashcardCards)
      .where(eq(flashcardCards.id, cardId))
      .limit(1);

    if (!cardRecord) return;

    // 2. Compute new SM2 scheduling
    const srsInput = {
      easeFactor: cardRecord.easeFactor,
      interval: cardRecord.interval,
      repetitions: cardRecord.repetitions,
      dueDate: cardRecord.dueDate,
    };

    const srsOutput = sm2Review(srsInput, rating);

    // 3. Update DB
    await db
      .update(flashcardCards)
      .set({
        easeFactor: srsOutput.easeFactor,
        interval: srsOutput.interval,
        repetitions: srsOutput.repetitions,
        dueDate: srsOutput.dueDate,
      })
      .where(eq(flashcardCards.id, cardId));

    // Log review
    const logId = generateId();
    await db.insert(reviewLog).values({
      id: logId,
      cardId,
      rating,
      reviewedAt: now,
    });

    // 4. Update state locally
    const deckId = cardRecord.deckId;
    set((state) => {
      const deckCards = state.cards[deckId] || [];
      const updated = deckCards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              easeFactor: srsOutput.easeFactor,
              interval: srsOutput.interval,
              repetitions: srsOutput.repetitions,
              dueDate: srsOutput.dueDate,
            }
          : c
      );
      return {
        cards: { ...state.cards, [deckId]: updated },
      };
    });

    // Increment streak
    await incrementStreak();
    await get().loadStreak();
  },

  loadStreak: async () => {
    const db = getDB();
    try {
      // Simple streak calculator based on consecutive days of review_log
      const logs = await db
        .select()
        .from(reviewLog)
        .orderBy(desc(reviewLog.reviewedAt))
        .limit(100);

      if (logs.length === 0) {
        set({ streak: 0 });
        return;
      }

      // Compute streak
      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // Check if reviewed today or yesterday
      const uniqueDays = new Set(
        logs.map((l) => {
          const d = new Date(l.reviewedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      const todayTime = checkDate.getTime();
      const yesterdayTime = todayTime - 24 * 60 * 60 * 1000;

      if (uniqueDays.has(todayTime)) {
        currentStreak = 1;
        let t = todayTime - 24 * 60 * 60 * 1000;
        while (uniqueDays.has(t)) {
          currentStreak++;
          t -= 24 * 60 * 60 * 1000;
        }
      } else if (uniqueDays.has(yesterdayTime)) {
        currentStreak = 1;
        let t = yesterdayTime - 24 * 60 * 60 * 1000;
        while (uniqueDays.has(t)) {
          currentStreak++;
          t -= 24 * 60 * 60 * 1000;
        }
      }

      set({ streak: currentStreak });
    } catch {
      set({ streak: 0 });
    }
  },

  resetStreak: async () => {
    // Reset is a first-class action per spec:
    // "Reset is not a buried secondary action. The streak number should not be large and dominant — it's just information, not a score."
    set({ streak: 0 });
  },

  deleteDeck: async (deckId) => {
    const db = getDB();
    const now = new Date();
    await db
      .update(flashcardDecks)
      .set({ deletedAt: now })
      .where(eq(flashcardDecks.id, deckId));
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== deckId),
    }));
  },

  deleteCard: async (deckId, cardId) => {
    const db = getDB();
    const now = new Date();
    await db
      .update(flashcardCards)
      .set({ deletedAt: now })
      .where(eq(flashcardCards.id, cardId));
    set((state) => {
      const deckCards = state.cards[deckId] || [];
      return {
        cards: {
          ...state.cards,
          [deckId]: deckCards.filter((c) => c.id !== cardId),
        },
      };
    });
  },
}));

async function incrementStreak() {
  // Streak calculations updated on review submit
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

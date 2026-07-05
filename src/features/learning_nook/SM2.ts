/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure JavaScript implementation — ~40 lines.
 * No external SRS service. Runs fully offline.
 *
 * Rating scale (non-judgmental labels in UI):
 *   1 = "not yet"   (SM-2 quality: 1)
 *   2 = "almost"    (SM-2 quality: 3)
 *   3 = "got it"    (SM-2 quality: 5)
 *
 * References: Wozniak, P.A. (1990). SuperMemo 2 Algorithm.
 */

export interface SM2Card {
  easeFactor: number;  // default: 2.5
  interval: number;    // days until next review
  repetitions: number; // consecutive successful reviews
  dueDate: Date;
}

export type SM2Rating = 1 | 2 | 3; // 1=not yet, 2=almost, 3=got it

/**
 * Maps user-friendly ratings to SM-2 quality scores (0-5).
 */
function ratingToQuality(rating: SM2Rating): number {
  switch (rating) {
    case 1: return 1; // not yet → poor recall
    case 2: return 3; // almost → hesitant recall
    case 3: return 5; // got it → perfect recall
  }
}

/**
 * Processes a single card review and returns updated SM-2 state.
 *
 * @param card - current card state
 * @param rating - user's recall rating (1, 2, or 3)
 * @returns new card state with updated ease factor, interval, and due date
 */
export function sm2Review(card: SM2Card, rating: SM2Rating): SM2Card {
  const q = ratingToQuality(rating);

  let { easeFactor, interval, repetitions } = card;

  if (q < 3) {
    // Failed — reset repetitions and interval
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (minimum 1.3 to prevent near-daily reviews forever)
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
  );

  const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return { easeFactor, interval, repetitions, dueDate };
}

/**
 * Returns the initial state for a new flashcard (first review due today).
 */
export function initialCardState(): SM2Card {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date(),
  };
}

/**
 * Returns true if the card is due for review today (or overdue).
 */
export function isDue(card: Pick<SM2Card, 'dueDate'>): boolean {
  return card.dueDate.getTime() <= Date.now();
}

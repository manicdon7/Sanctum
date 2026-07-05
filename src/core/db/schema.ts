/**
 * Sanctum Database Schema — Drizzle ORM
 *
 * All sensitive content fields (body, title, notes) are stored encrypted.
 * Encryption is applied at the application layer (see src/core/encryption)
 * before values are written to the DB.
 *
 * Column naming: _encrypted suffix on columns holding AES-256-GCM ciphertext.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────
// Journal / Vent Entries
// ─────────────────────────────────────────────

export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(), // UUID v4
    type: text('type', { enum: ['vent', 'journal'] }).notNull(),
    bodyEncrypted: text('body_encrypted').notNull(),
    tagColor: text('tag_color').default('#7B9BAF'), // user-chosen, not sentiment-assigned
    isDraft: integer('is_draft', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }), // soft delete
  },
  (t) => ({
    typeIdx: index('entries_type_idx').on(t.type),
    createdAtIdx: index('entries_created_at_idx').on(t.createdAt),
  }),
);

// ─────────────────────────────────────────────
// Mood Log
// ─────────────────────────────────────────────

export const moods = sqliteTable(
  'moods',
  {
    id: text('id').primaryKey(),
    value: integer('value').notNull(), // 1-5
    emojiKey: text('emoji_key').notNull(), // 'devastated'|'sad'|'neutral'|'good'|'joyful'
    noteEncrypted: text('note_encrypted'), // optional encrypted annotation
    recordedAt: integer('recorded_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    recordedAtIdx: index('moods_recorded_at_idx').on(t.recordedAt),
  }),
);

// ─────────────────────────────────────────────
// Knowledge Garden Notes
// ─────────────────────────────────────────────

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    titleEncrypted: text('title_encrypted').notNull(),
    bodyEncrypted: text('body_encrypted').notNull(), // raw markdown
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    linkCount: integer('link_count').notNull().default(0), // denormalized for graph sizing
  },
  (t) => ({
    updatedAtIdx: index('notes_updated_at_idx').on(t.updatedAt),
  }),
);

// FTS5 virtual table — created via raw SQL in migrations
// CREATE VIRTUAL TABLE notes_fts USING fts5(title, body, content=notes, content_rowid=rowid);

export const noteLinks = sqliteTable(
  'note_links',
  {
    sourceId: text('source_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    targetId: text('target_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    sourceIdx: index('note_links_source_idx').on(t.sourceId),
    targetIdx: index('note_links_target_idx').on(t.targetId),
  }),
);

// ─────────────────────────────────────────────
// Learning Nook — Flashcards & SM-2
// ─────────────────────────────────────────────

export const flashcardDecks = sqliteTable('flashcard_decks', {
  id: text('id').primaryKey(),
  nameEncrypted: text('name_encrypted').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

export const flashcardCards = sqliteTable(
  'flashcard_cards',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: 'cascade' }),
    frontEncrypted: text('front_encrypted').notNull(),
    backEncrypted: text('back_encrypted').notNull(),
    // SM-2 state
    easeFactor: real('ease_factor').notNull().default(2.5),
    interval: integer('interval').notNull().default(0),    // days
    repetitions: integer('repetitions').notNull().default(0),
    dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    deckIdx: index('flashcard_cards_deck_idx').on(t.deckId),
    dueDateIdx: index('flashcard_cards_due_date_idx').on(t.dueDate),
  }),
);

export const reviewLog = sqliteTable(
  'review_log',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => flashcardCards.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1=not yet, 2=almost, 3=got it
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }).notNull(),
    responseTimeMs: integer('response_time_ms').notNull().default(0),
  },
  (t) => ({
    cardIdx: index('review_log_card_idx').on(t.cardId),
    reviewedAtIdx: index('review_log_reviewed_at_idx').on(t.reviewedAt),
  }),
);

// ─────────────────────────────────────────────
// Growth — Goals & Attempts
// ─────────────────────────────────────────────

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  nameEncrypted: text('name_encrypted').notNull(),
  descriptionEncrypted: text('description_encrypted'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
});

export const goalAttempts = sqliteTable(
  'goal_attempts',
  {
    id: text('id').primaryKey(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    outcome: text('outcome', { enum: ['worked', 'didnt_land'] }).notNull(),
    notesEncrypted: text('notes_encrypted'),
    reframeEncrypted: text('reframe_encrypted'), // AI-generated reframe, lazy-loaded
    attemptedAt: integer('attempted_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    goalIdx: index('goal_attempts_goal_idx').on(t.goalId),
    attemptedAtIdx: index('goal_attempts_attempted_at_idx').on(t.attemptedAt),
  }),
);

// ─────────────────────────────────────────────
// Vault — Encrypted Media Files
// ─────────────────────────────────────────────

export const mediaFiles = sqliteTable(
  'media_files',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['photo', 'video', 'voice', 'document'] }).notNull(),
    encryptedUri: text('encrypted_uri').notNull(), // local filesystem path to encrypted blob
    thumbnailUri: text('thumbnail_uri'), // local path to encrypted thumbnail
    nameEncrypted: text('name_encrypted').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    durationMs: integer('duration_ms'), // for audio/video
    recordedAt: integer('recorded_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    typeIdx: index('media_files_type_idx').on(t.type),
    recordedAtIdx: index('media_files_recorded_at_idx').on(t.recordedAt),
  }),
);

// ─────────────────────────────────────────────
// Prompt Tracking
// ─────────────────────────────────────────────

export const promptsShown = sqliteTable('prompts_shown', {
  promptId: integer('prompt_id').primaryKey(),
  shownAt: integer('shown_at', { mode: 'timestamp_ms' }).notNull(),
});

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Mood = typeof moods.$inferSelect;
export type NewMood = typeof moods.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteLink = typeof noteLinks.$inferSelect;
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type NewFlashcardDeck = typeof flashcardDecks.$inferInsert;
export type FlashcardCard = typeof flashcardCards.$inferSelect;
export type NewFlashcardCard = typeof flashcardCards.$inferInsert;
export type ReviewLog = typeof reviewLog.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalAttempt = typeof goalAttempts.$inferSelect;
export type NewGoalAttempt = typeof goalAttempts.$inferInsert;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;
export type Setting = typeof settings.$inferSelect;

/**
 * Sanctum DB Client
 *
 * Opens the SQLite database and applies Drizzle migrations.
 * The DB is opened once at app start and reused everywhere via
 * the useDB() hook or direct import of `db`.
 */

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'sanctum.db';

let _db: ReturnType<typeof drizzle> | null = null;
let _sqliteDb: SQLite.SQLiteDatabase | null = null;

/**
 * Opens and initializes the Sanctum database.
 * Idempotent — safe to call multiple times.
 */
export async function initDB(): Promise<ReturnType<typeof drizzle>> {
  if (_db) return _db;

  _sqliteDb = await SQLite.openDatabaseAsync(DB_NAME);
  _db = drizzle(_sqliteDb, { schema });

  // Run migrations
  await runMigrations(_sqliteDb);

  return _db;
}

/**
 * Returns the initialized DB client.
 * Call initDB() first (done in App.tsx on mount).
 */
export function getDB(): ReturnType<typeof drizzle> {
  if (!_db) {
    throw new Error('[Sanctum] DB not initialized. Call initDB() first.');
  }
  return _db;
}

/**
 * Run all schema migrations.
 * Uses raw SQL for pragmas and FTS5 virtual table creation.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA secure_delete = ON;

    -- Entries
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('vent', 'journal')),
      body_encrypted TEXT NOT NULL,
      tag_color TEXT DEFAULT '#7B9BAF',
      is_draft INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS entries_type_idx ON entries(type);
    CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries(created_at);

    -- Moods
    CREATE TABLE IF NOT EXISTS moods (
      id TEXT PRIMARY KEY,
      value INTEGER NOT NULL,
      emoji_key TEXT NOT NULL,
      note_encrypted TEXT,
      recorded_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS moods_recorded_at_idx ON moods(recorded_at);

    -- Notes
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title_encrypted TEXT NOT NULL,
      body_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      link_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);

    -- Note FTS5 (for full-text search)
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title,
      body,
      content=notes,
      content_rowid=rowid
    );

    -- Note links (bidirectional)
    CREATE TABLE IF NOT EXISTS note_links (
      source_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      PRIMARY KEY (source_id, target_id)
    );
    CREATE INDEX IF NOT EXISTS note_links_source_idx ON note_links(source_id);
    CREATE INDEX IF NOT EXISTS note_links_target_idx ON note_links(target_id);

    -- Flashcard Decks
    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      name_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );

    -- Flashcard Cards
    CREATE TABLE IF NOT EXISTS flashcard_cards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      front_encrypted TEXT NOT NULL,
      back_encrypted TEXT NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS flashcard_cards_deck_idx ON flashcard_cards(deck_id);
    CREATE INDEX IF NOT EXISTS flashcard_cards_due_date_idx ON flashcard_cards(due_date);

    -- Review Log
    CREATE TABLE IF NOT EXISTS review_log (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES flashcard_cards(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      reviewed_at INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS review_log_card_idx ON review_log(card_id);
    CREATE INDEX IF NOT EXISTS review_log_reviewed_at_idx ON review_log(reviewed_at);

    -- Goals
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name_encrypted TEXT NOT NULL,
      description_encrypted TEXT,
      created_at INTEGER NOT NULL,
      archived_at INTEGER
    );

    -- Goal Attempts
    CREATE TABLE IF NOT EXISTS goal_attempts (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      outcome TEXT NOT NULL CHECK(outcome IN ('worked', 'didnt_land')),
      notes_encrypted TEXT,
      reframe_encrypted TEXT,
      attempted_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS goal_attempts_goal_idx ON goal_attempts(goal_id);
    CREATE INDEX IF NOT EXISTS goal_attempts_attempted_at_idx ON goal_attempts(attempted_at);

    -- Media Files
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('photo', 'video', 'voice', 'document')),
      encrypted_uri TEXT NOT NULL,
      thumbnail_uri TEXT,
      name_encrypted TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      duration_ms INTEGER,
      recorded_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS media_files_type_idx ON media_files(type);
    CREATE INDEX IF NOT EXISTS media_files_recorded_at_idx ON media_files(recorded_at);

    -- Prompts Shown
    CREATE TABLE IF NOT EXISTS prompts_shown (
      prompt_id INTEGER PRIMARY KEY,
      shown_at INTEGER NOT NULL
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

export { schema };

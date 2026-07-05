import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, blob, real } from 'drizzle-orm/sqlite-core';

// User profile table — stores basic user information and companion AI name
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  userName: text('user_name'),
  companionName: text('companion_name').default('Juliet'),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Conversations table — stores all Juliet message history by session
export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  metadata: text('metadata', { mode: 'json' }), // for any additional data
});

// User context table — stores the persistent context JSON that makes Juliet remember
export const userContext = sqliteTable('user_context', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  contextData: text('context_data', { mode: 'json' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Notes table — private thoughts and entries from the room
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  encrypted: integer('encrypted', { mode: 'boolean' }).default(false),
});

// Moods table — timestamped mood dots from the room interface
export const moods = sqliteTable('moods', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  moodIndex: integer('mood_index').notNull(), // 0-4 for the 5 mood dots
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Ambiance presets table — user-saved sound combinations
export const ambiancePresets = sqliteTable('ambiance_presets', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  sounds: text('sounds', { mode: 'json' }).notNull(), // array of sound IDs with volume levels
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Settings table — all app configuration
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type UserContextRow = typeof userContext.$inferSelect;
export type InsertUserContext = typeof userContext.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
export type Mood = typeof moods.$inferSelect;
export type InsertMood = typeof moods.$inferInsert;
export type AmbiancePreset = typeof ambiancePresets.$inferSelect;
export type InsertAmbiancePreset = typeof ambiancePresets.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
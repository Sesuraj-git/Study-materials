import { pgTable, uuid, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title"),
  sourceType: text("source_type"),
  rawText: text("raw_text"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").references(() => notes.id),
  userId: uuid("user_id").references(() => users.id),
  front: text("front"),
  back: text("back"),
  easeFactor: doublePrecision("ease_factor").default(2.5),
  interval: integer("interval").default(0),
  repetitions: integer("repetitions").default(0),
  nextReview: timestamp("next_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  durationHours: integer("duration_hours").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerName: text("partner_name").notNull(),
  subtitle: text("subtitle"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [messages.workspaceId], references: [workspaces.id] }),
}));

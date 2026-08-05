/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Initializes all database tables.
 * @param {import('better-sqlite3').Database} db
 */
export function initializeDatabase(db) {
  // Enable WAL mode for better performance & concurrency
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    -- ─── Guilds ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS guilds (
      guild_id    TEXT PRIMARY KEY,
      prefix      TEXT    NOT NULL DEFAULT 'b',
      staff_roles TEXT    NOT NULL DEFAULT '[]',  -- JSON array of role IDs
      welcome     TEXT    NOT NULL DEFAULT '{}',  -- JSON welcome config
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─── Blacklisted Users ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS blacklisted_users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id        TEXT    NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
      user_id         TEXT    NOT NULL,
      reason          TEXT,
      blacklisted_by  TEXT,
      blacklisted_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_blacklist_guild ON blacklisted_users(guild_id);

    -- ─── Panels ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS panels (
      panel_id            TEXT PRIMARY KEY,
      guild_id            TEXT    NOT NULL,
      name                TEXT    NOT NULL,
      channel_id          TEXT,
      message_id          TEXT,
      panel_title         TEXT    NOT NULL DEFAULT 'Ticket Panel',
      panel_description   TEXT    NOT NULL DEFAULT 'Select a category below to create a ticket',
      select_placeholder  TEXT    NOT NULL DEFAULT 'Select a ticket category',
      select_min          INTEGER NOT NULL DEFAULT 1,
      select_max          INTEGER NOT NULL DEFAULT 1,
      logs                TEXT    NOT NULL DEFAULT '{}',  -- JSON object
      is_active           INTEGER NOT NULL DEFAULT 1,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_panels_guild    ON panels(guild_id);
    CREATE INDEX IF NOT EXISTS idx_panels_active   ON panels(guild_id, is_active);

    -- ─── Categories (children of panels) ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      category_id             TEXT PRIMARY KEY,
      panel_id                TEXT    NOT NULL REFERENCES panels(panel_id) ON DELETE CASCADE,
      name                    TEXT    NOT NULL,
      description             TEXT,
      emoji                   TEXT,
      support_roles           TEXT    NOT NULL DEFAULT '[]',  -- JSON array
      ticket_channel_category TEXT,
      naming_format           TEXT    NOT NULL DEFAULT 'ticket-{username}-{number}',
      settings                TEXT    NOT NULL DEFAULT '{}',  -- JSON object
      is_active               INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_categories_panel ON categories(panel_id);

    -- ─── Tickets ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id          TEXT PRIMARY KEY,
      guild_id           TEXT    NOT NULL,
      panel_id           TEXT    NOT NULL,
      category_id        TEXT    NOT NULL,
      channel_id         TEXT,
      user_id            TEXT    NOT NULL,
      status             TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      control_message_id TEXT,
      closed_by          TEXT,
      closed_at          TEXT,
      close_reason       TEXT,
      rating_stars       INTEGER CHECK(rating_stars BETWEEN 1 AND 5),
      rating_feedback    TEXT,
      rating_rated_at    TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_guild        ON tickets(guild_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status       ON tickets(guild_id, status);
    CREATE INDEX IF NOT EXISTS idx_tickets_user         ON tickets(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_tickets_panel_cat    ON tickets(panel_id, category_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_channel      ON tickets(channel_id);

    -- ─── Ticket Added Users ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ticket_added_users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  TEXT    NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      user_id    TEXT    NOT NULL,
      added_by   TEXT,
      added_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_added_ticket ON ticket_added_users(ticket_id);

    -- ─── Ticket Removed Users ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ticket_removed_users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id   TEXT    NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      user_id     TEXT    NOT NULL,
      removed_by  TEXT,
      removed_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_removed_ticket ON ticket_removed_users(ticket_id);

    -- ─── User Levels & Experience ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_levels (
      guild_id    TEXT    NOT NULL,
      user_id     TEXT    NOT NULL,
      xp          INTEGER NOT NULL DEFAULT 0,
      level       INTEGER NOT NULL DEFAULT 0,
      messages    INTEGER NOT NULL DEFAULT 0,
      last_xp_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (guild_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_levels_guild_xp ON user_levels(guild_id, xp DESC);

    -- ─── Level Role Rewards ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS level_roles (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id  TEXT    NOT NULL,
      level     INTEGER NOT NULL,
      role_id   TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_level_roles_guild ON level_roles(guild_id, level);

    -- ─── Suggestions System ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS suggestion_config (
      guild_id        TEXT PRIMARY KEY,
      channel_id      TEXT,
      auto_upvote     INTEGER NOT NULL DEFAULT 1,
      anonymous       INTEGER NOT NULL DEFAULT 0,
      logs_channel_id TEXT
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      suggestion_id   TEXT PRIMARY KEY,
      guild_id        TEXT    NOT NULL,
      user_id         TEXT    NOT NULL,
      channel_id      TEXT    NOT NULL,
      message_id      TEXT,
      content         TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'pending',
      staff_response  TEXT,
      staff_id        TEXT,
      upvotes         TEXT    NOT NULL DEFAULT '[]',
      downvotes       TEXT    NOT NULL DEFAULT '[]',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sug_guild ON suggestions(guild_id);
    CREATE INDEX IF NOT EXISTS idx_sug_status ON suggestions(guild_id, status);

    -- ─── Feedback & Review System ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS feedback_config (
      guild_id    TEXT PRIMARY KEY,
      channel_id  TEXT
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      feedback_id TEXT PRIMARY KEY,
      guild_id    TEXT    NOT NULL,
      user_id     TEXT    NOT NULL,
      stars       INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      message     TEXT    NOT NULL,
      channel_id  TEXT,
      message_id  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fb_guild ON feedbacks(guild_id);
    CREATE INDEX IF NOT EXISTS idx_fb_stars ON feedbacks(guild_id, stars);

    -- ─── Poll System ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS polls (
      poll_id     TEXT PRIMARY KEY,
      guild_id    TEXT    NOT NULL,
      user_id     TEXT    NOT NULL,
      channel_id  TEXT    NOT NULL,
      message_id  TEXT,
      question    TEXT    NOT NULL,
      options     TEXT    NOT NULL DEFAULT '[]', -- JSON array of option strings
      votes       TEXT    NOT NULL DEFAULT '{}', -- JSON object { userId: optionIndex }
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_polls_guild ON polls(guild_id);

    -- ─── Leveling Configuration ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS level_config (
      guild_id      TEXT PRIMARY KEY,
      channel_id    TEXT,
      xp_channel_id TEXT,
      enabled       INTEGER NOT NULL DEFAULT 1,
      max_level     INTEGER NOT NULL DEFAULT 50,
      xp_per_level  INTEGER NOT NULL DEFAULT 100,
      xp_rate       REAL NOT NULL DEFAULT 1.0
    );
  `);
}

/**
 * Ensures the directory for the database file exists.
 * @param {string} dbPath
 */
export function ensureDbDir(dbPath) {
  try {
    mkdirSync(dirname(dbPath), { recursive: true });
  } catch {
    // already exists
  }
}

// bread end

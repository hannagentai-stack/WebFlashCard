/**
 * SQLite Schema Definition for WebFlashCard
 * Tables: users, decks, cards, progress, study_logs, uploads
 * All tables enforce relational integrity with foreign keys and cascade rules.
 */

export const SCHEMA_SQL = `
-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. DECKS TABLE
CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  language TEXT NOT NULL CHECK(language IN ('en', 'zh')),
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_lang ON decks(user_id, language);

-- 3. CARDS TABLE
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  ipa TEXT DEFAULT '',
  pinyin TEXT DEFAULT '',
  meaning TEXT NOT NULL,
  example TEXT DEFAULT '',
  example_trans TEXT DEFAULT '',
  pos TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_user ON cards(deck_id, user_id);

-- 4. PROGRESS TABLE (SM-2 SRS)
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'learning', 'review', 'mastered')),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT NOT NULL,
  last_reviewed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_card_id ON progress(card_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_due ON progress(user_id, next_review_date, status);
CREATE INDEX IF NOT EXISTS idx_progress_status ON progress(status);

-- 5. STUDY_LOGS TABLE
CREATE TABLE IF NOT EXISTS study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  deck_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 4),
  study_mode TEXT DEFAULT 'review',
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_reviewed ON study_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_study_logs_card_id ON study_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_deck_id ON study_logs(deck_id);

-- 6. UPLOADS TABLE
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  deck_id INTEGER DEFAULT NULL,
  filename TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'extracted', 'committed', 'failed')),
  extracted_count INTEGER DEFAULT 0,
  committed_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
`;

/**
 * Initialize all tables and indexes on the provided SQLite instance
 * @param {import('better-sqlite3').Database} db
 */
export function initSchema(db) {
  db.exec(SCHEMA_SQL);
}

/**
 * SQLite Connection Singleton using better-sqlite3
 * Manages database lifecycle, directory creation, pragmas, and schema initialization.
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { initSchema } from './schema.js';

let dbInstance = null;
let currentDbPath = null;

/**
 * Get or initialize SQLite database connection
 * @param {string} [customPath] - Optional custom path or ':memory:'
 * @returns {import('better-sqlite3').Database}
 */
export function getDb(customPath) {
  const targetPath = customPath || process.env.DB_PATH || path.join(process.cwd(), 'data', 'webflashcard.db');

  if (dbInstance && currentDbPath === targetPath && dbInstance.open) {
    return dbInstance;
  }

  if (dbInstance && dbInstance.open) {
    dbInstance.close();
  }

  // Ensure enclosing directory exists if not an in-memory database
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(targetPath);

  // Configure SQLite Pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');

  // Initialize all tables and indexes
  initSchema(db);

  dbInstance = db;
  currentDbPath = targetPath;
  return dbInstance;
}

/**
 * Close active database connection cleanly
 */
export function closeDb() {
  if (dbInstance && dbInstance.open) {
    dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }
}

// Graceful cleanup on process exit
process.on('exit', () => closeDb());

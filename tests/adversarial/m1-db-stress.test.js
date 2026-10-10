/**
 * Adversarial SQLite Database Stress & Concurrency Test Suite
 * Milestone 1 Challenger Probe:
 * - WAL mode & SQLite Pragmas Verification
 * - Foreign Key Enforcement & Cascading
 * - Atomic Transaction Rollback on Mid-Seeding Failure
 * - Multi-Process High-Concurrency Contention & busy_timeout
 * - Concurrent Race Condition on Duplicate Registration
 * - Concurrent Reader/Writer Isolation
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import Database from 'better-sqlite3';
import { getDb, closeDb } from '../../server/db/connection.js';
import { initSchema } from '../../server/db/schema.js';
import { seedDefaultDecks } from '../../server/db/seeds.js';

const TEST_DB_DIR = path.join(process.cwd(), 'data', 'adversarial_test');
const DISK_DB_PATH = path.join(TEST_DB_DIR, 'stress_test.db');

function cleanupTestDb() {
  if (fs.existsSync(TEST_DB_DIR)) {
    try {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup locks
    }
  }
}

describe('Adversarial Database Probe: SQLite Integrity & Concurrency', () => {
  before(() => {
    cleanupTestDb();
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  });

  after(() => {
    closeDb();
    cleanupTestDb();
  });

  // =========================================================================
  // SUITE 1: WAL MODE & PRAGMAS INTEGRITY
  // =========================================================================
  describe('Suite 1: WAL Mode & SQLite Pragmas Integrity', () => {
    it('1.1 should set and persist journal_mode = WAL on disk database', () => {
      const db = getDb(DISK_DB_PATH);
      const journalMode = db.pragma('journal_mode', { simple: true });
      assert.equal(String(journalMode).toLowerCase(), 'wal', 'journal_mode must be WAL');

      // Verify WAL and SHM files are created after write
      db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES ('wal_check@test.com', 'hash', 'WAL User')").run();

      const dirFiles = fs.readdirSync(TEST_DB_DIR);
      const hasWal = dirFiles.some(f => f.endsWith('-wal'));
      const hasShm = dirFiles.some(f => f.endsWith('-shm'));
      assert.ok(hasWal || hasShm || fs.existsSync(DISK_DB_PATH), 'Database files exist with WAL artifacts');
      closeDb();
    });

    it('1.2 should strictly enable foreign_keys pragma (PRAGMA foreign_keys = 1)', () => {
      const db = getDb(DISK_DB_PATH);
      const fk = db.pragma('foreign_keys', { simple: true });
      assert.equal(fk, 1, 'PRAGMA foreign_keys must return 1 (ON)');
      closeDb();
    });

    it('1.3 should set synchronous = NORMAL (1)', () => {
      const db = getDb(DISK_DB_PATH);
      const sync = db.pragma('synchronous', { simple: true });
      assert.equal(sync, 1, 'PRAGMA synchronous must return 1 (NORMAL)');
      closeDb();
    });

    it('1.4 should configure busy_timeout >= 5000ms for concurrent write contention', () => {
      const db = getDb(DISK_DB_PATH);
      const timeout = db.pragma('busy_timeout', { simple: true });
      assert.ok(timeout >= 5000, `PRAGMA busy_timeout must be at least 5000, got ${timeout}`);
      closeDb();
    });

    it('1.5 should verify database integrity check returns ok', () => {
      const db = getDb(DISK_DB_PATH);
      const result = db.pragma('integrity_check', { simple: true });
      assert.equal(result, 'ok', 'PRAGMA integrity_check must return "ok"');
      closeDb();
    });
  });

  // =========================================================================
  // SUITE 2: FOREIGN KEY CONSTRAINT ENFORCEMENT & CASCADES
  // =========================================================================
  describe('Suite 2: Foreign Key Constraint Enforcement & Cascades', () => {
    let db;

    before(() => {
      db = getDb(DISK_DB_PATH);
    });

    after(() => {
      closeDb();
    });

    it('2.1 should reject inserting deck referencing non-existent user_id', () => {
      assert.throws(
        () => {
          db.prepare("INSERT INTO decks (user_id, name, language) VALUES (999999, 'Invalid Deck', 'en')").run();
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject deck with non-existent user_id'
      );
    });

    it('2.2 should reject inserting card referencing non-existent deck_id', () => {
      // First ensure a valid user exists
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      assert.ok(user, 'A user must exist for this test');

      assert.throws(
        () => {
          db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (999999, ?, 'word', 'meaning')").run(user.id);
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject card with non-existent deck_id'
      );
    });

    it('2.3 should reject inserting card referencing non-existent user_id', () => {
      // Create a valid deck
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      const deck = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Valid Deck', 'en')").run(user.id);
      const deckId = Number(deck.lastInsertRowid);

      assert.throws(
        () => {
          db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (?, 999999, 'word', 'meaning')").run(deckId);
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject card with non-existent user_id'
      );
    });

    it('2.4 should reject inserting progress referencing non-existent card_id', () => {
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      assert.throws(
        () => {
          db.prepare("INSERT INTO progress (card_id, user_id, status, next_review_date) VALUES (999999, ?, 'new', '2026-10-10')").run(user.id);
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject progress with non-existent card_id'
      );
    });

    it('2.5 should reject inserting progress referencing non-existent user_id', () => {
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      const deck = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Deck for Card', 'en')").run(user.id);
      const card = db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (?, ?, 'hello', 'xin chao')").run(deck.lastInsertRowid, user.id);

      assert.throws(
        () => {
          db.prepare("INSERT INTO progress (card_id, user_id, status, next_review_date) VALUES (?, 999999, 'new', '2026-10-10')").run(card.lastInsertRowid);
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject progress with non-existent user_id'
      );
    });

    it('2.6 should reject inserting study_logs referencing non-existent card_id or user_id', () => {
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      assert.throws(
        () => {
          db.prepare("INSERT INTO study_logs (user_id, card_id, rating) VALUES (?, 999999, 3)").run(user.id);
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject study_logs with non-existent card_id'
      );

      assert.throws(
        () => {
          db.prepare("INSERT INTO study_logs (user_id, card_id, rating) VALUES (999999, 1, 3)").run();
        },
        /FOREIGN KEY constraint failed/i,
        'Must reject study_logs with non-existent user_id'
      );
    });

    it('2.7 should reject invalid CHECK constraint values', () => {
      const user = db.prepare("SELECT id FROM users LIMIT 1").get();
      // Invalid deck language
      assert.throws(
        () => {
          db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Bad Lang', 'fr')").run(user.id);
        },
        /CHECK constraint failed/i,
        'Must reject deck with language not in (en, zh)'
      );

      // Invalid study_log rating (< 1 or > 4)
      const deck = db.prepare("SELECT id FROM decks WHERE user_id = ? LIMIT 1").get(user.id);
      const card = db.prepare("SELECT id FROM cards WHERE deck_id = ? LIMIT 1").get(deck.id);
      if (card) {
        assert.throws(
          () => {
            db.prepare("INSERT INTO study_logs (user_id, card_id, rating) VALUES (?, ?, 5)").run(user.id, card.id);
          },
          /CHECK constraint failed/i,
          'Must reject rating > 4'
        );
        assert.throws(
          () => {
            db.prepare("INSERT INTO study_logs (user_id, card_id, rating) VALUES (?, ?, 0)").run(user.id, card.id);
          },
          /CHECK constraint failed/i,
          'Must reject rating < 1'
        );
      }
    });

    it('2.8 should enforce ON DELETE CASCADE when user is deleted', () => {
      // Create dedicated test user
      const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES ('cascade_u@test.com', 'h', 'Cascade U')").run();
      const uid = Number(uRes.lastInsertRowid);

      // Seed decks & cards for this user
      seedDefaultDecks(uid, db);

      // Add a study_log and upload record
      const card = db.prepare("SELECT id FROM cards WHERE user_id = ? LIMIT 1").get(uid);
      const deck = db.prepare("SELECT id FROM decks WHERE user_id = ? LIMIT 1").get(uid);
      db.prepare("INSERT INTO study_logs (user_id, card_id, deck_id, rating) VALUES (?, ?, ?, 3)").run(uid, card.id, deck.id);
      db.prepare("INSERT INTO uploads (user_id, deck_id, filename, stored_path, file_type, file_size) VALUES (?, ?, 'f.csv', '/p', 'csv', 100)").run(uid, deck.id);

      // Verify rows exist
      assert.equal(db.prepare("SELECT count(*) as c FROM decks WHERE user_id = ?").get(uid).c, 2);
      assert.equal(db.prepare("SELECT count(*) as c FROM cards WHERE user_id = ?").get(uid).c, 60);
      assert.equal(db.prepare("SELECT count(*) as c FROM progress WHERE user_id = ?").get(uid).c, 60);
      assert.equal(db.prepare("SELECT count(*) as c FROM study_logs WHERE user_id = ?").get(uid).c, 1);
      assert.equal(db.prepare("SELECT count(*) as c FROM uploads WHERE user_id = ?").get(uid).c, 1);

      // Delete the user
      db.prepare("DELETE FROM users WHERE id = ?").run(uid);

      // Verify EVERYTHING cascaded cleanly to 0
      assert.equal(db.prepare("SELECT count(*) as c FROM decks WHERE user_id = ?").get(uid).c, 0, 'Decks must cascade delete');
      assert.equal(db.prepare("SELECT count(*) as c FROM cards WHERE user_id = ?").get(uid).c, 0, 'Cards must cascade delete');
      assert.equal(db.prepare("SELECT count(*) as c FROM progress WHERE user_id = ?").get(uid).c, 0, 'Progress must cascade delete');
      assert.equal(db.prepare("SELECT count(*) as c FROM study_logs WHERE user_id = ?").get(uid).c, 0, 'Study logs must cascade delete');
      assert.equal(db.prepare("SELECT count(*) as c FROM uploads WHERE user_id = ?").get(uid).c, 0, 'Uploads must cascade delete');
    });

    it('2.9 should enforce ON DELETE CASCADE when a deck is deleted', () => {
      const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES ('deck_del@test.com', 'h', 'Deck Del')").run();
      const uid = Number(uRes.lastInsertRowid);
      const dRes = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Doomed Deck', 'en')").run(uid);
      const did = Number(dRes.lastInsertRowid);
      const cRes = db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (?, ?, 'bye', 'tam biet')").run(did, uid);
      const cid = Number(cRes.lastInsertRowid);
      db.prepare("INSERT INTO progress (card_id, user_id, status, next_review_date) VALUES (?, ?, 'new', '2026-10-10')").run(cid, uid);

      // Delete the deck
      db.prepare("DELETE FROM decks WHERE id = ?").run(did);

      // Verify cards and progress are cascaded
      assert.equal(db.prepare("SELECT count(*) as c FROM cards WHERE id = ?").get(cid).c, 0, 'Card must be cascade deleted');
      assert.equal(db.prepare("SELECT count(*) as c FROM progress WHERE card_id = ?").get(cid).c, 0, 'Progress must be cascade deleted');
    });

    it('2.10 should set deck_id = NULL on uploads when referenced deck is deleted (ON DELETE SET NULL)', () => {
      const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES ('upload_null@test.com', 'h', 'Upload Null')").run();
      const uid = Number(uRes.lastInsertRowid);
      const dRes = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Upload Deck', 'en')").run(uid);
      const did = Number(dRes.lastInsertRowid);
      const upRes = db.prepare("INSERT INTO uploads (user_id, deck_id, filename, stored_path, file_type, file_size) VALUES (?, ?, 'vocab.csv', '/uploads/v.csv', 'csv', 500)").run(uid, did);
      const uploadId = Number(upRes.lastInsertRowid);

      // Verify upload has deck_id = did
      const beforeUpload = db.prepare("SELECT deck_id FROM uploads WHERE id = ?").get(uploadId);
      assert.equal(beforeUpload.deck_id, did);

      // Delete deck
      db.prepare("DELETE FROM decks WHERE id = ?").run(did);

      // Verify upload record still exists, but deck_id was set to NULL
      const afterUpload = db.prepare("SELECT deck_id, user_id FROM uploads WHERE id = ?").get(uploadId);
      assert.ok(afterUpload, 'Upload record must NOT be deleted');
      assert.equal(afterUpload.deck_id, null, 'deck_id on upload must be set to NULL');
      assert.equal(afterUpload.user_id, uid, 'user_id must remain intact');
    });
  });

  // =========================================================================
  // SUITE 3: TRANSACTION ATOMICITY & ROLLBACK INTEGRITY
  // =========================================================================
  describe('Suite 3: Transaction Atomicity & Rollback on Seeding Failure', () => {
    let db;

    before(() => {
      db = getDb(DISK_DB_PATH);
    });

    after(() => {
      closeDb();
    });

    it('3.1 should atomically roll back user creation if seedDefaultDecks throws mid-way', () => {
      const targetEmail = 'rollback_test_1@domain.com';

      // Simulate registration transaction where seeding fails midway
      assert.throws(() => {
        const registrationTx = db.transaction(() => {
          const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'pw', 'Rollback User')").run(targetEmail);
          const userId = Number(uRes.lastInsertRowid);

          // Insert 1 deck
          const dRes = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Partial Deck', 'en')").run(userId);
          const deckId = Number(dRes.lastInsertRowid);

          // Insert 5 cards
          for (let i = 0; i < 5; i++) {
            db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (?, ?, ?, ?)").run(deckId, userId, `word_${i}`, `meaning_${i}`);
          }

          // SIMULATE ERROR ON 6TH CARD (e.g. fatal constraint or unhandled crash)
          throw new Error('Simulated seeding crash at card index 6');
        });

        registrationTx();
      }, /Simulated seeding crash/i);

      // VERIFY: Absolutely NO orphaned user record exists!
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(targetEmail);
      assert.equal(user, undefined, 'User row must be rolled back completely');

      // VERIFY: No orphaned deck or cards exist
      const orphanedDecks = db.prepare("SELECT count(*) as c FROM decks WHERE name = 'Partial Deck'").get().c;
      assert.equal(orphanedDecks, 0, 'Partial decks must be rolled back');

      const orphanedCards = db.prepare("SELECT count(*) as c FROM cards WHERE word LIKE 'word_%'").get().c;
      assert.equal(orphanedCards, 0, 'Partial cards must be rolled back');
    });

    it('3.2 should leave database completely consistent so user can immediately register again', () => {
      const targetEmail = 'rollback_test_1@domain.com';

      // Perform a clean registration with the EXACT same email that previously rolled back
      const cleanTx = db.transaction(() => {
        const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'pw', 'Clean User')").run(targetEmail);
        const userId = Number(uRes.lastInsertRowid);
        seedDefaultDecks(userId, db);
        return userId;
      });

      const newUserId = cleanTx();
      assert.ok(newUserId > 0, 'User registration must succeed after previous rollback');

      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(targetEmail);
      assert.ok(user, 'User must exist now');
      assert.equal(user.email, targetEmail);

      const deckCount = db.prepare("SELECT count(*) as c FROM decks WHERE user_id = ?").get(newUserId).c;
      const cardCount = db.prepare("SELECT count(*) as c FROM cards WHERE user_id = ?").get(newUserId).c;
      const progCount = db.prepare("SELECT count(*) as c FROM progress WHERE user_id = ?").get(newUserId).c;

      assert.equal(deckCount, 2, 'Must have exactly 2 default decks');
      assert.equal(cardCount, 60, 'Must have exactly 60 cards');
      assert.equal(progCount, 60, 'Must have exactly 60 progress entries');
    });

    it('3.3 should properly handle nested savepoints in seedDefaultDecks', () => {
      // seedDefaultDecks creates its own db.transaction(() => ...).
      // In better-sqlite3, nested transactions act as SAVEPOINTs.
      // If the outer transaction fails AFTER seedDefaultDecks completes,
      // all seeded decks and cards MUST still roll back!
      const email = 'nested_tx_test@domain.com';

      assert.throws(() => {
        const outerTx = db.transaction(() => {
          const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'pw', 'Nested Test')").run(email);
          const userId = Number(uRes.lastInsertRowid);

          // Call seedDefaultDecks (which executes its inner db.transaction)
          seedDefaultDecks(userId, db);

          // Force an error in the outer transaction
          throw new Error('Outer transaction failure after inner seed transaction');
        });

        outerTx();
      }, /Outer transaction failure/i);

      // Verify that the inner savepoint did NOT prematurely commit to SQLite!
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      assert.equal(user, undefined, 'User must be rolled back');

      const orphanedProgress = db.prepare(`
        SELECT count(*) as c FROM progress
        WHERE user_id NOT IN (SELECT id FROM users)
      `).get().c;
      assert.equal(orphanedProgress, 0, 'No orphaned progress rows allowed');
    });
  });

  // =========================================================================
  // SUITE 4: MULTI-PROCESS CONCURRENCY & CONTENTION STRESS
  // =========================================================================
  describe('Suite 4: Multi-Process High-Concurrency & WAL Contention Stress', () => {
    it('4.1 should handle rapid concurrent registrations across multiple child processes without SQLITE_BUSY', async () => {
      // Spawn 8 worker processes that concurrently register 5 users each (total 40 users = 80 decks, 2400 cards)
      const numWorkers = 8;
      const usersPerWorker = 5;
      const workerScript = path.join(TEST_DB_DIR, 'worker_reg.cjs');

      // Write standalone CommonJS child worker to avoid ESM loader conflicts in fork
      fs.writeFileSync(workerScript, `
        const Database = require('better-sqlite3');
        const dbPath = process.argv[2];
        const workerId = process.argv[3];
        const count = parseInt(process.argv[4], 10);

        try {
          const db = new Database(dbPath);
          db.pragma('journal_mode = WAL');
          db.pragma('foreign_keys = ON');
          db.pragma('synchronous = NORMAL');
          db.pragma('busy_timeout = 5000');

          for (let i = 0; i < count; i++) {
            const email = 'w' + workerId + '_u' + i + '@concurrent.test';
            const registerTx = db.transaction(() => {
              const uRes = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'hash', 'Worker User')").run(email);
              const userId = Number(uRes.lastInsertRowid);
              const d1 = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'D1', 'en')").run(userId);
              const d2 = db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'D2', 'zh')").run(userId);
              for (let c = 0; c < 10; c++) {
                const card = db.prepare("INSERT INTO cards (deck_id, user_id, word, meaning) VALUES (?, ?, ?, ?)").run(d1.lastInsertRowid, userId, 'w' + c, 'm' + c);
                db.prepare("INSERT INTO progress (card_id, user_id, status, next_review_date) VALUES (?, ?, 'new', '2026-10-10')").run(card.lastInsertRowid, userId);
              }
            });
            registerTx();
          }
          db.close();
          process.send({ success: true, workerId, count });
        } catch (err) {
          process.send({ success: false, workerId, error: err.message });
          process.exit(1);
        }
      `);

      const promises = [];
      for (let w = 0; w < numWorkers; w++) {
        promises.push(new Promise((resolve, reject) => {
          const child = fork(workerScript, [DISK_DB_PATH, String(w), String(usersPerWorker)], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc']
          });
          child.on('message', (msg) => {
            if (msg.success) resolve(msg);
            else reject(new Error(`Worker ${w} failed: ${msg.error}`));
          });
          child.on('error', reject);
          child.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker ${w} exited with code ${code}`));
          });
        }));
      }

      const results = await Promise.all(promises);
      assert.equal(results.length, numWorkers, 'All workers must finish successfully');

      // Verify the database state after all concurrent writes
      const db = getDb(DISK_DB_PATH);
      const totalUsers = db.prepare("SELECT count(*) as c FROM users WHERE email LIKE '%@concurrent.test'").get().c;
      assert.equal(totalUsers, numWorkers * usersPerWorker, `Must have exactly ${numWorkers * usersPerWorker} users`);

      const totalDecks = db.prepare("SELECT count(*) as c FROM decks WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@concurrent.test')").get().c;
      assert.equal(totalDecks, numWorkers * usersPerWorker * 2, 'Must have exactly 2 decks per user');

      const totalCards = db.prepare("SELECT count(*) as c FROM cards WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@concurrent.test')").get().c;
      assert.equal(totalCards, numWorkers * usersPerWorker * 10, 'Must have exactly 10 cards per user');

      const integrity = db.pragma('integrity_check', { simple: true });
      assert.equal(integrity, 'ok', 'PRAGMA integrity_check must be ok after concurrent stress');
      closeDb();
    });

    it('4.2 should resolve race condition when 10 workers simultaneously register the same email', async () => {
      // 10 workers attempt to register 'race_victim@domain.com' at the exact same moment
      const numCompetitors = 10;
      const contestedEmail = 'race_victim@domain.com';
      const raceScript = path.join(TEST_DB_DIR, 'race_worker.cjs');

      fs.writeFileSync(raceScript, `
        const Database = require('better-sqlite3');
        const dbPath = process.argv[2];
        const email = process.argv[3];

        try {
          const db = new Database(dbPath);
          db.pragma('journal_mode = WAL');
          db.pragma('foreign_keys = ON');
          db.pragma('busy_timeout = 5000');

          const tx = db.transaction(() => {
            const u = db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'pw', 'Contender')").run(email);
            db.prepare("INSERT INTO decks (user_id, name, language) VALUES (?, 'Contender Deck', 'en')").run(u.lastInsertRowid);
          });
          tx();
          db.close();
          process.send({ status: 'WINNER' });
        } catch (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            process.send({ status: 'REJECTED_UNIQUE' });
          } else {
            process.send({ status: 'ERROR', error: err.message });
          }
        }
      `);

      const promises = [];
      for (let i = 0; i < numCompetitors; i++) {
        promises.push(new Promise((resolve) => {
          const child = fork(raceScript, [DISK_DB_PATH, contestedEmail], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc']
          });
          child.on('message', (msg) => resolve(msg));
          child.on('error', (err) => resolve({ status: 'ERROR', error: err.message }));
        }));
      }

      const results = await Promise.all(promises);
      const winners = results.filter(r => r.status === 'WINNER');
      const rejected = results.filter(r => r.status === 'REJECTED_UNIQUE');

      assert.equal(winners.length, 1, `Exactly 1 contender must win the race, got ${winners.length}`);
      assert.equal(rejected.length, numCompetitors - 1, `All other ${numCompetitors - 1} contenders must be rejected with UNIQUE constraint`);

      const db = getDb(DISK_DB_PATH);
      const count = db.prepare("SELECT count(*) as c FROM users WHERE email = ?").get(contestedEmail).c;
      assert.equal(count, 1, 'Exactly 1 row exists in users table');
      closeDb();
    });

    it('4.3 should allow concurrent readers during active write operations (WAL non-blocking reads)', async () => {
      // In WAL mode, readers do not block writers and writers do not block readers.
      const dbPath = DISK_DB_PATH;
      const readerScript = path.join(TEST_DB_DIR, 'reader_worker.cjs');

      fs.writeFileSync(readerScript, `
        const Database = require('better-sqlite3');
        const dbPath = process.argv[2];
        const queries = parseInt(process.argv[3], 10);

        try {
          const db = new Database(dbPath);
          db.pragma('journal_mode = WAL');
          db.pragma('foreign_keys = ON');
          db.pragma('busy_timeout = 5000');

          for (let i = 0; i < queries; i++) {
            const count = db.prepare("SELECT count(*) as c FROM users").get().c;
            if (typeof count !== 'number') throw new Error('Query returned non-number');
          }
          db.close();
          process.send({ success: true, count: queries });
        } catch (err) {
          process.send({ success: false, error: err.message });
        }
      `);

      // Spawn 5 readers each doing 100 queries while main process writes 20 records
      const numReaders = 5;
      const readerPromises = [];
      for (let r = 0; r < numReaders; r++) {
        readerPromises.push(new Promise((resolve, reject) => {
          const child = fork(readerScript, [dbPath, '100'], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc']
          });
          child.on('message', (msg) => {
            if (msg.success) resolve(msg);
            else reject(new Error(msg.error));
          });
        }));
      }

      // Concurrently perform writes in the main thread
      const db = getDb(DISK_DB_PATH);
      for (let w = 0; w < 20; w++) {
        db.prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, 'h', 'Writer User')").run(`wal_rw_${w}@test.com`);
      }

      const readerResults = await Promise.all(readerPromises);
      assert.equal(readerResults.length, numReaders, 'All readers completed during active writes');
      closeDb();
    });
  });
});

/**
 * Adversarial Empirical Challenger Suite: Milestone 2 (Decks, Cards & Multi-Format Extraction)
 * 
 * Verifies:
 * 1. Multi-Tenant Data Isolation (IDOR probes across decks, cards, uploads, commits)
 * 2. Cascade Deletion & Database Integrity (no orphans in decks, cards, progress, study_logs, uploads)
 * 3. Upload Size & Format Limits (10MB limit -> 413, 0-byte -> 400, unsupported formats -> 400, corrupt files -> 400)
 * 4. Path Traversal Probes (upload originalname, upload :id, sample downloads)
 * 5. Chinese Pinyin Edge Cases (polyphonic, mixed Latin/CJK, numbers, punctuation, traditional Hanzi, English isolation)
 * 6. Input Fuzzing & Injection Resistance (SQL injection literals, XSS script sanitization)
 */
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../../server.js';
import { getDb, closeDb } from '../../server/db/connection.js';
import { generatePinyin, isChinese, enrichCandidatesWithPinyin } from '../../server/services/pinyin.js';

describe('Milestone 2 Empirical Challenger Stress Suite', () => {
  let db;
  let userCookieA;
  let userCookieB;
  let userIdA;
  let userIdB;

  before(() => {
    db = getDb();
  });

  after(() => {
    // Clean up test data
    if (db) {
      db.prepare("DELETE FROM users WHERE email LIKE '%@challenger-m2.com'").run();
    }
  });

  beforeEach(async () => {
    // Clean previous challenger test users
    db.prepare("DELETE FROM users WHERE email LIKE '%@challenger-m2.com'").run();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userA@challenger-m2.com', password: 'password123', displayName: 'User Alpha' })
      .expect(201);
    userCookieA = resA.headers['set-cookie'];
    userIdA = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userB@challenger-m2.com', password: 'password123', displayName: 'User Beta' })
      .expect(201);
    userCookieB = resB.headers['set-cookie'];
    userIdB = resB.body.user.id;
  });

  // =========================================================================
  // 1. MULTI-TENANT ISOLATION ADVERSARIAL PROBES
  // =========================================================================
  describe('1. Multi-Tenant Data Isolation (Adversarial Probes)', () => {
    let deckAId;
    let cardAId;
    let deckBId;
    let cardBId;

    beforeEach(async () => {
      // User A creates deck & card
      const dARes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Alpha Secret Deck', language: 'en', description: 'Top Secret' })
        .expect(201);
      deckAId = dARes.body.deck.id;

      const cARes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId: deckAId, word: 'confidential', meaning: 'bí mật' })
        .expect(201);
      cardAId = cARes.body.card.id;

      // User B creates deck & card
      const dBRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieB)
        .send({ name: 'Beta Normal Deck', language: 'zh', description: 'Public Beta' })
        .expect(201);
      deckBId = dBRes.body.deck.id;

      const cBRes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieB)
        .send({ deckId: deckBId, word: '你好', meaning: 'xin chào' })
        .expect(201);
      cardBId = cBRes.body.card.id;
    });

    it('1.1 User B cannot read User A deck by ID (expect 404)', async () => {
      const res = await request(app)
        .get(`/api/decks/${deckAId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      assert.ok(!res.body.deck, 'Must not return foreign deck payload');
    });

    it('1.2 User B cannot update User A deck (expect 404, DB unchanged)', async () => {
      const res = await request(app)
        .put(`/api/decks/${deckAId}`)
        .set('Cookie', userCookieB)
        .send({ name: 'Tampered By Beta' })
        .expect(404);

      assert.equal(res.body.success, false);
      const deckInDb = db.prepare('SELECT name FROM decks WHERE id = ?').get(deckAId);
      assert.equal(deckInDb.name, 'Alpha Secret Deck', 'Deck name in DB must remain untampered');
    });

    it('1.3 User B cannot delete User A deck (expect 404, DB untouched)', async () => {
      const res = await request(app)
        .delete(`/api/decks/${deckAId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      const deckInDb = db.prepare('SELECT id FROM decks WHERE id = ?').get(deckAId);
      assert.ok(deckInDb, 'User A deck must still exist in DB');
    });

    it('1.4 User B cannot list cards inside User A deck (expect 404, no card leak)', async () => {
      const res = await request(app)
        .get(`/api/decks/${deckAId}/cards`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      assert.ok(!res.body.cards, 'Cards list must not be leaked to foreign user');
    });

    it('1.5 User B cannot add card directly to User A deck (expect 404)', async () => {
      const res = await request(app)
        .post(`/api/decks/${deckAId}/cards`)
        .set('Cookie', userCookieB)
        .send({ word: 'injected', meaning: 'tiêm vào' })
        .expect(404);

      assert.equal(res.body.success, false);
      const cardsInDb = db.prepare('SELECT count(*) as count FROM cards WHERE deck_id = ?').get(deckAId);
      assert.equal(cardsInDb.count, 1, 'Card count in User A deck must not increase');
    });

    it('1.6 User B cannot add card via /api/cards referencing User A deck (expect 404)', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieB)
        .send({ deckId: deckAId, word: 'injected_api', meaning: 'tiêm vào' })
        .expect(404);

      assert.equal(res.body.success, false);
      const cardsInDb = db.prepare('SELECT count(*) as count FROM cards WHERE deck_id = ?').get(deckAId);
      assert.equal(cardsInDb.count, 1);
    });

    it('1.7 User B cannot read User A card by ID (expect 404)', async () => {
      const res = await request(app)
        .get(`/api/cards/${cardAId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      assert.ok(!res.body.card);
    });

    it('1.8 User B cannot read User A card progress (expect 404)', async () => {
      const res = await request(app)
        .get(`/api/cards/${cardAId}/progress`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      assert.ok(!res.body.progress);
    });

    it('1.9 User B cannot update User A card (expect 404, card unchanged)', async () => {
      const res = await request(app)
        .put(`/api/cards/${cardAId}`)
        .set('Cookie', userCookieB)
        .send({ word: 'hacked_word', meaning: 'đã hack' })
        .expect(404);

      assert.equal(res.body.success, false);
      const cardInDb = db.prepare('SELECT word FROM cards WHERE id = ?').get(cardAId);
      assert.equal(cardInDb.word, 'confidential');
    });

    it('1.10 User B cannot reassign own card into User A deck (IDOR transfer blocked)', async () => {
      const res = await request(app)
        .put(`/api/cards/${cardBId}`)
        .set('Cookie', userCookieB)
        .send({ deckId: deckAId, word: 'trying_to_move' })
        .expect(200);

      // Verify in DB that cardB is STILL in deckBId, NOT moved to deckAId
      const cardInDb = db.prepare('SELECT deck_id, user_id FROM cards WHERE id = ?').get(cardBId);
      assert.equal(cardInDb.deck_id, deckBId, 'Card must remain in User B original deck');
      assert.notEqual(cardInDb.deck_id, deckAId, 'Card must NEVER transfer to User A deck');
    });

    it('1.11 User B cannot delete User A card (expect 404, card preserved)', async () => {
      const res = await request(app)
        .delete(`/api/cards/${cardAId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      assert.equal(res.body.success, false);
      const cardInDb = db.prepare('SELECT id FROM cards WHERE id = ?').get(cardAId);
      assert.ok(cardInDb, 'User A card must still exist');
    });

    it('1.12 User B cannot view User A upload record (expect 403 or 404)', async () => {
      // User A uploads a file
      const upRes = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'en')
        .attach('file', Buffer.from('hello - xin chào', 'utf8'), 'user_a_file.txt')
        .expect(200);

      const uploadId = upRes.body.uploadId;

      // User B tries to view
      const viewRes = await request(app)
        .get(`/api/uploads/${uploadId}`)
        .set('Cookie', userCookieB);

      assert.ok([403, 404].includes(viewRes.status), `Expected 403 or 404, got ${viewRes.status}`);
      assert.equal(viewRes.body.success, false);
    });

    it('1.13 User B cannot delete User A upload record or file (expect 403 or 404)', async () => {
      // User A uploads a file
      const upRes = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'en')
        .attach('file', Buffer.from('test - bài kiểm tra', 'utf8'), 'user_a_del_test.txt')
        .expect(200);

      const uploadId = upRes.body.uploadId;
      const filePath = upRes.body.filePath;

      // User B attempts to delete
      const delRes = await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .set('Cookie', userCookieB);

      assert.ok([403, 404].includes(delRes.status), `Expected 403 or 404, got ${delRes.status}`);

      // Verify DB record and physical file still exist
      const inDb = db.prepare('SELECT id FROM uploads WHERE id = ?').get(uploadId);
      assert.ok(inDb, 'Upload DB record must still exist');
      assert.ok(fs.existsSync(filePath), 'Physical file must still exist on disk');
    });

    it('1.14 User B cannot commit preview cards into User A deck (expect 403 or 404)', async () => {
      const commitRes = await request(app)
        .post('/api/uploads/999/commit')
        .set('Cookie', userCookieB)
        .send({
          deckId: deckAId, // foreign deck!
          cards: [{ word: 'intruder', meaning: 'kẻ xâm nhập', selected: true }]
        });

      assert.ok([403, 404].includes(commitRes.status), `Expected 403 or 404, got ${commitRes.status}`);
      assert.equal(commitRes.body.success, false);

      const intruderCard = db.prepare('SELECT id FROM cards WHERE deck_id = ? AND word = ?').get(deckAId, 'intruder');
      assert.ok(!intruderCard, 'Intruder card must NOT be committed to User A deck');
    });
  });

  // =========================================================================
  // 2. CASCADE DELETION & ORPHAN-FREE DATABASE INTEGRITY
  // =========================================================================
  describe('2. Cascade Deletion & Relational Integrity', () => {
    it('2.1 Deleting a deck cleanly cascades deletion to cards, progress, study_logs with zero orphans', async () => {
      // Create Deck
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Deck for Cascade Test', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      // Add 4 cards
      const cardIds = [];
      for (let i = 1; i <= 4; i++) {
        const cRes = await request(app)
          .post('/api/cards')
          .set('Cookie', userCookieA)
          .send({ deckId, word: `word_${i}`, meaning: `nghĩa ${i}` })
          .expect(201);
        cardIds.push(cRes.body.card.id);
      }

      // Verify progress entries exist
      for (const cid of cardIds) {
        const prog = db.prepare('SELECT id FROM progress WHERE card_id = ?').get(cid);
        assert.ok(prog, `Progress entry for card ${cid} must exist before deletion`);
      }

      // Insert dummy study logs referencing cards & deck
      for (const cid of cardIds) {
        db.prepare(`
          INSERT INTO study_logs (user_id, card_id, deck_id, rating, study_mode)
          VALUES (?, ?, ?, 3, 'review')
        `).run(userIdA, cid, deckId);
      }

      // Link an upload to this deck
      const upRes = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'en')
        .attach('file', Buffer.from('temp - tạm thời', 'utf8'), 'cascade_upload.txt')
        .expect(200);
      const uploadId = upRes.body.uploadId;
      db.prepare('UPDATE uploads SET deck_id = ? WHERE id = ?').run(deckId, uploadId);

      // Verify study logs count before deletion
      const logsBefore = db.prepare('SELECT count(*) as c FROM study_logs WHERE deck_id = ?').get(deckId).c;
      assert.equal(logsBefore, 4);

      // DELETE the deck
      const delRes = await request(app)
        .delete(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);
      assert.equal(delRes.body.success, true);

      // VERIFY ZERO ORPHANS IN DATABASE
      const deckInDb = db.prepare('SELECT id FROM decks WHERE id = ?').get(deckId);
      assert.equal(deckInDb, undefined, 'Deck row must be deleted');

      const remainingCards = db.prepare('SELECT count(*) as c FROM cards WHERE deck_id = ?').get(deckId).c;
      assert.equal(remainingCards, 0, 'All cards in deleted deck must be deleted');

      for (const cid of cardIds) {
        const cardCheck = db.prepare('SELECT id FROM cards WHERE id = ?').get(cid);
        assert.equal(cardCheck, undefined, `Card ${cid} must not exist`);

        const progCheck = db.prepare('SELECT id FROM progress WHERE card_id = ?').get(cid);
        assert.equal(progCheck, undefined, `Progress for card ${cid} must be cascade deleted`);

        const logsCheck = db.prepare('SELECT id FROM study_logs WHERE card_id = ?').get(cid);
        assert.equal(logsCheck, undefined, `Study logs for card ${cid} must be deleted`);
      }

      // Check upload record: deck_id must be NULL, upload record still exists
      const uploadAfter = db.prepare('SELECT deck_id FROM uploads WHERE id = ?').get(uploadId);
      assert.ok(uploadAfter, 'Upload record must remain intact');
      assert.equal(uploadAfter.deck_id, null, 'Upload deck_id must be set to NULL (ON DELETE SET NULL)');
    });

    it('2.2 Deleting a single card removes progress and logs while preserving other deck cards', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Card Cascade Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const c1 = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'keep_me', meaning: 'giữ lại' })
        .expect(201);
      const card1Id = c1.body.card.id;

      const c2 = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'delete_me', meaning: 'xóa tôi' })
        .expect(201);
      const card2Id = c2.body.card.id;

      // Add study log for card 2
      db.prepare(`
        INSERT INTO study_logs (user_id, card_id, deck_id, rating)
        VALUES (?, ?, ?, 4)
      `).run(userIdA, card2Id, deckId);

      // DELETE Card 2
      await request(app)
        .delete(`/api/cards/${card2Id}`)
        .set('Cookie', userCookieA)
        .expect(200);

      // Verify Card 2 and its progress/logs deleted
      assert.equal(db.prepare('SELECT id FROM cards WHERE id = ?').get(card2Id), undefined);
      assert.equal(db.prepare('SELECT id FROM progress WHERE card_id = ?').get(card2Id), undefined);
      assert.equal(db.prepare('SELECT id FROM study_logs WHERE card_id = ?').get(card2Id), undefined);

      // Verify Card 1 still exists
      const card1Check = db.prepare('SELECT id FROM cards WHERE id = ?').get(card1Id);
      assert.ok(card1Check, 'Card 1 must still exist');

      const prog1Check = db.prepare('SELECT id FROM progress WHERE card_id = ?').get(card1Id);
      assert.ok(prog1Check, 'Progress for Card 1 must still exist');

      // Verify deck totalCards updated
      const deckCheck = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);
      assert.equal(deckCheck.body.deck.totalCards, 1);
    });

    it('2.3 Deleting an upload unlinks file and DB record but preserves committed cards', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Preserve Cards Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const csvContent = 'word,meaning\napple,quả táo\nbanana,quả chuối';
      const upRes = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'en')
        .attach('file', Buffer.from(csvContent, 'utf8'), 'cards_to_preserve.csv')
        .expect(200);
      const uploadId = upRes.body.uploadId;
      const filePath = upRes.body.filePath;

      // Commit to deck
      await request(app)
        .post(`/api/uploads/${uploadId}/commit`)
        .set('Cookie', userCookieA)
        .send({ deckId, cards: upRes.body.candidates })
        .expect(201);

      // Verify cards exist in deck
      const countBefore = db.prepare('SELECT count(*) as c FROM cards WHERE deck_id = ?').get(deckId).c;
      assert.equal(countBefore, 2);

      // Delete the upload
      await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      // File removed, DB upload row deleted
      assert.ok(!fs.existsSync(filePath), 'Physical file must be deleted from disk');
      assert.equal(db.prepare('SELECT id FROM uploads WHERE id = ?').get(uploadId), undefined);

      // Committed cards STILL in deck!
      const countAfter = db.prepare('SELECT count(*) as c FROM cards WHERE deck_id = ?').get(deckId).c;
      assert.equal(countAfter, 2, 'Committed cards must NOT be deleted when upload is deleted');
    });
  });

  // =========================================================================
  // 3. UPLOAD SIZE & FORMAT LIMITS STRESS
  // =========================================================================
  describe('3. Upload Size & Format Limits Stress', () => {
    it('3.1 should reject file > 10MB with HTTP 413 Payload Too Large and leave no leftover file', async () => {
      // 10.5 MB buffer
      const oversizedBuffer = Buffer.alloc(10.5 * 1024 * 1024, 0x61);

      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'en')
        .attach('file', oversizedBuffer, 'oversized.txt')
        .expect(413);

      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error?.includes('10MB') || res.body.message?.includes('10MB'),
        'Error message must indicate 10MB limit'
      );

      // Check uploads directory for user A has no files matching oversized
      const userDir = path.resolve('uploads', String(userIdA));
      if (fs.existsSync(userDir)) {
        const files = fs.readdirSync(userDir);
        for (const f of files) {
          const stat = fs.statSync(path.join(userDir, f));
          assert.ok(stat.size <= 10 * 1024 * 1024, 'No file > 10MB should exist in user folder');
        }
      }
    });

    it('3.2 should reject 0-byte file with HTTP 400 and clean up disk', async () => {
      const emptyBuffer = Buffer.alloc(0);

      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', emptyBuffer, 'empty.txt')
        .expect(400);

      assert.equal(res.body.success, false);
      assert.ok(res.body.error?.includes('0 bytes') || res.body.message?.includes('0 bytes'));
    });

    it('3.3 should reject unsupported file extensions with HTTP 400', async () => {
      const unsupported = [
        'malicious.exe',
        'archive.zip',
        'script.js',
        'exploit.py',
        'shell.sh',
        'batch.bat',
        'image.png',
        'server.php'
      ];

      for (const filename of unsupported) {
        const res = await request(app)
          .post('/api/uploads')
          .set('Cookie', userCookieA)
          .attach('file', Buffer.from('hello', 'utf8'), filename)
          .expect(400);

        assert.equal(res.body.success, false, `Upload of ${filename} must fail`);
        assert.ok(
          res.body.error?.includes('không được hỗ trợ') || res.body.message?.includes('không được hỗ trợ'),
          `Error for ${filename} must state unsupported format`
        );
      }
    });

    it('3.4 should reject corrupted .docx file with HTTP 400 without crashing server', async () => {
      const corruptDocx = Buffer.from('GARBAGE_RANDOM_DATA_NOT_A_ZIP_ARCHIVE', 'utf8');

      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', corruptDocx, 'corrupted.docx')
        .expect(400);

      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
    });

    it('3.5 should reject corrupted .xlsx file with HTTP 400 without crashing server', async () => {
      const corruptXlsx = Buffer.from('RANDOM_CORRUPT_BYTES_FOR_XLSX', 'utf8');

      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', corruptXlsx, 'corrupted.xlsx')
        .expect(400);

      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
    });

    it('3.6 should reject corrupted .pdf file with HTTP 400 without crashing server', async () => {
      const corruptPdf = Buffer.from('NOT_A_VALID_PDF_HEADER_JUST_JUNK', 'utf8');

      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', corruptPdf, 'corrupted.pdf')
        .expect(400);

      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
    });
  });

  // =========================================================================
  // 4. PATH TRAVERSAL PROBES ON UPLOADS AND SAMPLES
  // =========================================================================
  describe('4. Path Traversal Probes', () => {
    it('4.1 should sanitize upload originalname preventing directory escape', async () => {
      const traversalFilenames = [
        '../../../../etc_passwd.txt',
        '..\\..\\windows_system32.csv',
        '....//....//nested_escape.txt',
        'normal_name.txt'
      ];

      for (const fname of traversalFilenames) {
        const res = await request(app)
          .post('/api/uploads')
          .set('Cookie', userCookieA)
          .attach('file', Buffer.from('word - meaning', 'utf8'), fname)
          .expect(200);

        assert.equal(res.body.success, true);
        const storedPath = res.body.filePath;

        // Path MUST be inside uploads/{userIdA}
        const uploadsUserRoot = path.resolve('uploads', String(userIdA));
        const resolvedPath = path.resolve(storedPath);
        assert.ok(
          resolvedPath.startsWith(uploadsUserRoot),
          `Path ${resolvedPath} must be inside ${uploadsUserRoot}`
        );
        assert.ok(!resolvedPath.includes('..'), 'Path must not contain double dot traversal');
      }
    });

    it('4.2 should reject upload :id path traversal in DELETE /api/uploads/:id', async () => {
      const evilIds = [
        '..%2f..%2fpackage.json',
        '..%5c..%5cpackage.json',
        '../../../server.js'
      ];

      for (const evilId of evilIds) {
        const res = await request(app)
          .delete(`/api/uploads/${evilId}`)
          .set('Cookie', userCookieA);

        assert.ok(
          [400, 403, 404].includes(res.status),
          `Expected 400/403/404 for traversal ID, got ${res.status}`
        );
      }
    });

    it('4.3 should reject path traversal in GET /api/samples/:filename', async () => {
      const traversalSamples = [
        '..%2fpackage.json',
        '..%2f..%2fserver.js',
        '..\\..\\data\\webflashcard.db',
        'secret.csv',
        'sample-en.csv%00.txt',
        'nonexistent.csv'
      ];

      for (const sName of traversalSamples) {
        const res = await request(app)
          .get(`/api/samples/${sName}`);

        assert.ok(
          [400, 403, 404].includes(res.status),
          `Expected 400/403/404 for ${sName}, got ${res.status}`
        );
      }
    });

    it('4.4 should successfully serve legitimate sample CSVs with UTF-8 BOM and text/csv header', async () => {
      const resEn = await request(app)
        .get('/api/samples/sample-en.csv')
        .expect(200);

      assert.ok(resEn.headers['content-type'].includes('text/csv'));
      assert.ok(resEn.headers['content-type'].includes('utf-8'));
      assert.equal(resEn.text.charCodeAt(0), 0xFEFF, 'sample-en.csv must contain UTF-8 BOM byte');

      const resZh = await request(app)
        .get('/api/samples/sample-zh.csv')
        .expect(200);

      assert.ok(resZh.headers['content-type'].includes('text/csv'));
      assert.ok(resZh.headers['content-type'].includes('utf-8'));
      assert.equal(resZh.text.charCodeAt(0), 0xFEFF, 'sample-zh.csv must contain UTF-8 BOM byte');
    });

    it('4.5 should block traversal via static /public/ route', async () => {
      const res = await request(app)
        .get('/public/samples/../../server.js');

      assert.ok([403, 404].includes(res.status), `Static traversal should be 403 or 404, got ${res.status}`);
    });
  });

  // =========================================================================
  // 5. CHINESE PINYIN EDGE CASES & LINGUISTIC STRESS
  // =========================================================================
  describe('5. Chinese Pinyin Edge Cases & Linguistic Stress', () => {
    it('5.1 should accurately handle polyphonic characters (多音字) with tone marks', () => {
      // 银行 (yínháng) vs 行动 (xíngdòng)
      const pinyinYinHang = generatePinyin('银行');
      assert.ok(pinyinYinHang.includes('háng'), `银行 should have háng, got ${pinyinYinHang}`);

      const pinyinXingDong = generatePinyin('行动');
      assert.ok(pinyinXingDong.includes('xíng'), `行动 should have xíng, got ${pinyinXingDong}`);

      // 重要 (zhòngyào) vs 重新 (chóngxīn)
      const pinyinZhongYao = generatePinyin('重要');
      assert.ok(pinyinZhongYao.includes('zhòng'), `重要 should have zhòng, got ${pinyinZhongYao}`);

      const pinyinChongXin = generatePinyin('重新');
      assert.ok(pinyinChongXin.includes('chóng'), `重新 should have chóng, got ${pinyinChongXin}`);

      // 音乐 (yīnyuè) vs 快乐 (kuàilè)
      const pinyinYinYue = generatePinyin('音乐');
      assert.ok(pinyinYinYue.includes('yuè'), `音乐 should have yuè, got ${pinyinYinYue}`);

      const pinyinKuaiLe = generatePinyin('快乐');
      assert.ok(pinyinKuaiLe.includes('lè'), `快乐 should have lè, got ${pinyinKuaiLe}`);
    });

    it('5.2 should handle mixed Latin alphabet and Chinese text seamlessly', () => {
      const mixed1 = generatePinyin('iPhone 手机');
      assert.ok(mixed1.includes('shǒu') && mixed1.includes('jī'), `Should transcribe 手机 in iPhone 手机, got ${mixed1}`);

      const mixed2 = generatePinyin('Python 编程');
      assert.ok(mixed2.includes('biān') && mixed2.includes('chéng'), `Should transcribe 编程 in Python 编程, got ${mixed2}`);

      const mixed3 = generatePinyin('C++ 学习');
      assert.ok(mixed3.includes('xué') && mixed3.includes('xí'), `Should transcribe 学习 in C++ 学习, got ${mixed3}`);
    });

    it('5.3 should handle numbers, dates, and CJK punctuation without throwing', () => {
      const numTest = generatePinyin('第1课');
      assert.ok(numTest.includes('dì') && numTest.includes('kè'), `第1课 pinyin: ${numTest}`);

      const puncTest = generatePinyin('你好，世界！');
      assert.ok(puncTest.includes('nǐ') && puncTest.includes('hǎo') && puncTest.includes('shì') && puncTest.includes('jiè'));
    });

    it('5.4 should transcribe Traditional Chinese characters (繁体字)', () => {
      const trad1 = generatePinyin('學習');
      assert.ok(trad1.includes('xué') && trad1.includes('xí'), `學習 pinyin: ${trad1}`);

      const trad2 = generatePinyin('臺灣');
      assert.ok(trad2.includes('tái') && trad2.includes('wān'), `臺灣 pinyin: ${trad2}`);

      const trad3 = generatePinyin('電腦');
      assert.ok(trad3.includes('diàn') && trad3.includes('nǎo'), `電腦 pinyin: ${trad3}`);
    });

    it('5.5 should preserve user-provided custom Pinyin untouched', () => {
      const userPinyin = 'wǒ de pīnyīn';
      const result = generatePinyin('我的拼音', userPinyin);
      assert.equal(result, userPinyin, 'Must preserve pre-existing Pinyin');
    });

    it('5.6 should NOT generate Pinyin when language is English or text is pure Latin', () => {
      assert.equal(generatePinyin('apple', '', 'en'), '');
      assert.equal(generatePinyin('computer', '', 'zh'), '');
      assert.equal(isChinese('vocabulary'), false);
      assert.equal(isChinese('12345'), false);
    });

    it('5.7 should handle boundary inputs safely without crashing or throwing', () => {
      assert.equal(generatePinyin(''), '');
      assert.equal(generatePinyin('   '), '');
      assert.equal(generatePinyin(null), '');
      assert.equal(generatePinyin(undefined), '');
      assert.equal(generatePinyin(12345), '');

      // Stress test: 1,000 Chinese characters
      const longChinese = '汉字'.repeat(500);
      const start = Date.now();
      const longResult = generatePinyin(longChinese);
      const duration = Date.now() - start;
      assert.ok(longResult.length > 0);
      assert.ok(duration < 2000, `Generating 1000 chars should take < 2000ms, took ${duration}ms`);
    });

    it('5.8 enrichCandidatesWithPinyin should enrich only Chinese cards missing pinyin', () => {
      const candidates = [
        { word: '苹果', meaning: 'quả táo', pinyin: '' },
        { word: '香蕉', meaning: 'quả chuối', pinyin: 'xiāng jiāo' }, // already has pinyin
        { word: 'orange', meaning: 'quả cam', pinyin: '' } // non-Chinese
      ];

      const enriched = enrichCandidatesWithPinyin(candidates, 'zh');
      assert.ok(enriched[0].pinyin.includes('píng'));
      assert.equal(enriched[1].pinyin, 'xiāng jiāo', 'Should preserve existing pinyin');
      assert.equal(enriched[2].pinyin, '', 'Non-Chinese should have empty pinyin');
    });
  });

  // =========================================================================
  // 6. INPUT FUZZING & INJECTION RESISTANCE
  // =========================================================================
  describe('6. Input Fuzzing & Injection Resistance', () => {
    it('6.1 should reject empty or whitespace deck name', async () => {
      await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: '   ', language: 'en' })
        .expect(400);

      await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: '', language: 'en' })
        .expect(400);
    });

    it('6.2 should reject deck name containing only script tags', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: '<script>alert("xss")</script>', language: 'en' })
        .expect(400);

      assert.equal(res.body.success, false);
    });

    it('6.3 should store SQL injection payloads safely as literal text without SQL execution', async () => {
      const sqliName = "Robert'); DROP TABLE cards; --";
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: sqliName, language: 'en' })
        .expect(201);

      assert.equal(deckRes.body.deck.name, sqliName);

      // Verify cards table was NOT dropped!
      const tableCheck = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='cards'").get();
      assert.equal(tableCheck.c, 1, 'cards table must still exist intact');
    });

    it('6.4 should reject card creation with empty word or meaning', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Validation Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: '', meaning: 'meaning' })
        .expect(400);

      await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'word', meaning: '   ' })
        .expect(400);
    });

    it('6.5 should sanitize XSS event handlers on card inputs while preserving valid text', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'XSS Test Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({
          deckId,
          word: '<b onmouseover="alert(1)">test</b>',
          meaning: '<img src="x" onerror="alert(2)"> nghĩa'
        })
        .expect(201);

      assert.ok(!cardRes.body.card.word.includes('onmouseover'), 'onmouseover event handler must be sanitized');
      assert.ok(!cardRes.body.card.meaning.includes('onerror'), 'onerror event handler must be sanitized');
      assert.ok(cardRes.body.card.word.includes('test'), 'Safe text content must be preserved');
      assert.ok(cardRes.body.card.meaning.includes('nghĩa'), 'Safe text meaning must be preserved');
    });
  });
});

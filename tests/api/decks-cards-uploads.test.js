import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import fs from 'node:fs';
import { app } from '../../server.js';
import { getDb } from '../../server/db/connection.js';

describe('Decks, Cards & Uploads API Integration Tests (Supertest)', () => {
  let userCookieA;
  let userCookieB;
  let userIdA;
  let userIdB;

  beforeEach(async () => {
    const db = getDb();
    db.prepare("DELETE FROM users WHERE email LIKE '%@m2test.com'").run();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userA@m2test.com', password: 'password123', displayName: 'User Alpha' })
      .expect(201);
    userCookieA = resA.headers['set-cookie'];
    userIdA = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userB@m2test.com', password: 'password123', displayName: 'User Beta' })
      .expect(201);
    userCookieB = resB.headers['set-cookie'];
    userIdB = resB.body.user.id;
  });

  // --------------------------------------------------------------------------
  // 1. Decks API
  // --------------------------------------------------------------------------
  describe('Decks CRUD (/api/decks)', () => {
    it('1.1 should create English deck with initial totalCards 0', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Oxford 3000', language: 'en', description: 'Core vocabulary' })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.ok(res.body.deck.id);
      assert.equal(res.body.deck.name, 'Oxford 3000');
      assert.equal(res.body.deck.language, 'en');
      assert.equal(res.body.deck.totalCards, 0);
      assert.equal(res.body.deck.dueCards, 0);
    });

    it('1.2 should create Chinese deck', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'HSK 1', language: 'zh', description: 'Beginner Chinese' })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.deck.language, 'zh');
    });

    it('1.3 should reject deck without name (400)', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ language: 'en' })
        .expect(400);

      assert.equal(res.body.success, false);
    });

    it('1.4 should reject deck with invalid language (400)', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'French 1', language: 'fr' })
        .expect(400);

      assert.equal(res.body.success, false);
    });

    it('1.5 should list user decks with cardCount and dueCount', async () => {
      await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Deck 1', language: 'en' })
        .expect(201);

      const res = await request(app)
        .get('/api/decks')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.decks));
      assert.ok(res.body.decks.length >= 1);
      const deck = res.body.decks.find(d => d.name === 'Deck 1');
      assert.ok(deck);
      assert.equal(typeof deck.totalCards, 'number');
      assert.equal(typeof deck.dueCards, 'number');
    });

    it('1.6 should filter decks by language query param', async () => {
      await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Deck ZH', language: 'zh' })
        .expect(201);

      const res = await request(app)
        .get('/api/decks?language=zh')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.ok(res.body.decks.every(d => d.language === 'zh'));
    });

    it('1.7 should get deck detail with cards array', async () => {
      const create = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Detail Deck', language: 'en' })
        .expect(201);

      const deckId = create.body.deck.id;
      const res = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.deck.id, deckId);
      assert.ok(Array.isArray(res.body.deck.cards));
    });

    it('1.8 should update deck name and description', async () => {
      const create = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Old Name', language: 'en' })
        .expect(201);

      const deckId = create.body.deck.id;
      const res = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .send({ name: 'New Name', description: 'Updated desc' })
        .expect(200);

      assert.equal(res.body.deck.name, 'New Name');
      assert.equal(res.body.deck.description, 'Updated desc');
    });

    it('1.9 should reject empty deck name on update (400)', async () => {
      const create = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Valid Name', language: 'en' })
        .expect(201);

      const deckId = create.body.deck.id;
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .send({ name: '   ' })
        .expect(400);
    });

    it('1.10 should cascade delete deck and related cards', async () => {
      const create = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'To Cascade', language: 'en' })
        .expect(201);

      const deckId = create.body.deck.id;
      const cardRes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'dog', meaning: 'con chó' })
        .expect(201);
      const cardId = cardRes.body.card.id;

      await request(app)
        .delete(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      // Card should be gone
      await request(app)
        .get(`/api/cards/${cardId}`)
        .set('Cookie', userCookieA)
        .expect(404);

      // Double delete returns 404
      await request(app)
        .delete(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(404);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Cards API
  // --------------------------------------------------------------------------
  describe('Cards CRUD (/api/cards)', () => {
    let deckId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Card Test Deck', language: 'en' });
      deckId = res.body.deck.id;
    });

    it('2.1 should create card and auto-initialize progress record with status new', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({
          deckId,
          word: 'apple',
          meaning: 'quả táo',
          ipa: '/ˈæp.əl/',
          pos: 'noun',
          example: 'I eat an apple.',
          exampleTrans: 'Tôi ăn một quả táo.'
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.card.word, 'apple');
      assert.equal(res.body.card.meaning, 'quả táo');
      assert.equal(res.body.card.deckId, deckId);

      // Verify progress created in database
      const cardId = res.body.card.id;
      const progRes = await request(app)
        .get(`/api/cards/${cardId}/progress`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(progRes.body.progress.status, 'new');
      assert.equal(progRes.body.progress.ease_factor, 2.5);
      assert.equal(progRes.body.progress.interval, 0);
    });

    it('2.2 should reject card missing word or meaning (400)', async () => {
      await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'only' })
        .expect(400);

      await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, meaning: 'only meaning' })
        .expect(400);
    });

    it('2.3 should update card and preserve created_at timestamp', async () => {
      const card = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'initial', meaning: 'ban đầu' })
        .expect(201);

      const cardId = card.body.card.id;
      const origCreatedAt = card.body.card.created_at;

      const updateRes = await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Cookie', userCookieA)
        .send({ word: 'modified', meaning: 'đã sửa' })
        .expect(200);

      assert.equal(updateRes.body.card.word, 'modified');
      assert.equal(updateRes.body.card.meaning, 'đã sửa');
      assert.equal(updateRes.body.card.created_at, origCreatedAt);
    });

    it('2.4 should delete card and decrement deck totalCards', async () => {
      const card = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'temp', meaning: 'tạm' })
        .expect(201);

      const cardId = card.body.card.id;

      await request(app)
        .delete(`/api/cards/${cardId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      const deck = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(deck.body.deck.totalCards, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Uploads & Multi-Format Extraction
  // --------------------------------------------------------------------------
  describe('Uploads & Parsers (/api/uploads)', () => {
    it('3.1 should upload CSV and extract candidate cards with pinyin auto-generation', async () => {
      const csvContent = 'word,meaning\n你好,xin chào\n苹果,quả táo';
      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .field('language', 'zh')
        .attach('file', Buffer.from(csvContent, 'utf8'), 'test-zh.csv')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.uploadId);
      assert.equal(res.body.count, 2);
      assert.ok(Array.isArray(res.body.candidates));
      assert.equal(res.body.candidates[0].word, '你好');
      assert.ok(res.body.candidates[0].pinyin.includes('nǐ'));
    });

    it('3.2 should upload TXT file with word - meaning pattern', async () => {
      const txtContent = 'sun - mặt trời\nmoon - mặt trăng';
      const res = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', Buffer.from(txtContent, 'utf8'), 'vocab.txt')
        .expect(200);

      assert.equal(res.body.count, 2);
      assert.equal(res.body.candidates[0].word, 'sun');
      assert.equal(res.body.candidates[0].meaning, 'mặt trời');
    });

    it('3.3 should reject 0-byte file (400)', async () => {
      await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', Buffer.alloc(0), 'empty.txt')
        .expect(400);
    });

    it('3.4 should reject missing file (400)', async () => {
      await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .expect(400);
    });

    it('3.5 should commit selected candidates to deck atomically', async () => {
      const deck = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Commit Target', language: 'en' });
      const deckId = deck.body.deck.id;

      const commitRes = await request(app)
        .post('/api/uploads/1/commit')
        .set('Cookie', userCookieA)
        .send({
          deckId,
          cards: [
            { word: 'c1', meaning: 'm1', selected: true },
            { word: 'c2', meaning: 'm2', selected: false },
            { word: 'c3', meaning: 'm3', selected: true }
          ]
        })
        .expect(201);

      assert.equal(commitRes.body.success, true);
      assert.equal(commitRes.body.addedCount, 2);

      const deckDetail = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(deckDetail.body.deck.totalCards, 2);
    });

    it('3.6 should delete upload and remove physical file from disk while preserving cards', async () => {
      const deck = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Preserve Deck', language: 'en' });
      const deckId = deck.body.deck.id;

      const upload = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', Buffer.from('keep - giữ', 'utf8'), 'keep.txt')
        .expect(200);

      const uploadId = upload.body.uploadId;
      const filePath = upload.body.filePath;

      await request(app)
        .post(`/api/uploads/${uploadId}/commit`)
        .set('Cookie', userCookieA)
        .send({
          deckId,
          cards: [{ word: 'keep', meaning: 'giữ' }]
        })
        .expect(201);

      // Delete upload
      await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      // Physical file removed
      assert.equal(fs.existsSync(filePath), false);

      // Card in deck remains intact
      const deckDetail = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.equal(deckDetail.body.deck.totalCards, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Sample CSVs
  // --------------------------------------------------------------------------
  describe('Sample CSVs (/public/samples and /api/samples)', () => {
    it('4.1 should return sample-en.csv with text/csv header via /public/samples', async () => {
      const res = await request(app)
        .get('/public/samples/sample-en.csv')
        .expect(200);

      assert.match(res.headers['content-type'], /text\/csv/);
      assert.match(res.text, /word|vocabulary|meaning|nghĩa/i);
    });

    it('4.2 should return sample-zh.csv with text/csv header via /public/samples', async () => {
      const res = await request(app)
        .get('/public/samples/sample-zh.csv')
        .expect(200);

      assert.match(res.headers['content-type'], /text\/csv/);
      assert.match(res.text, /pinyin|chữ hán|hanzi/i);
    });

    it('4.3 should return sample-en.csv via API route /api/samples/:filename', async () => {
      const res = await request(app)
        .get('/api/samples/sample-en.csv')
        .expect(200);

      assert.match(res.headers['content-type'], /text\/csv/);
    });

    it('4.4 should return 404 for unknown sample filename', async () => {
      await request(app)
        .get('/api/samples/sample-unknown.csv')
        .expect(404);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Multi-Tenant Data Isolation
  // --------------------------------------------------------------------------
  describe('Multi-Tenant Data Isolation', () => {
    it('5.1 User B cannot view or modify User A decks', async () => {
      const create = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Secret A Deck', language: 'en' })
        .expect(201);

      const deckId = create.body.deck.id;

      // User B cannot read
      await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      // User B cannot update
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', userCookieB)
        .send({ name: 'Hacked' })
        .expect(404);

      // User B cannot delete
      await request(app)
        .delete(`/api/decks/${deckId}`)
        .set('Cookie', userCookieB)
        .expect(404);
    });

    it('5.2 User B cannot view or delete User A cards', async () => {
      const deck = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Deck A', language: 'en' });
      const deckId = deck.body.deck.id;

      const card = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId, word: 'secret', meaning: 'bí mật' })
        .expect(201);
      const cardId = card.body.card.id;

      // User B cannot read card
      await request(app)
        .get(`/api/cards/${cardId}`)
        .set('Cookie', userCookieB)
        .expect(404);

      // User B cannot delete card
      await request(app)
        .delete(`/api/cards/${cardId}`)
        .set('Cookie', userCookieB)
        .expect(404);
    });

    it('5.3 User B cannot delete User A upload', async () => {
      const upload = await request(app)
        .post('/api/uploads')
        .set('Cookie', userCookieA)
        .attach('file', Buffer.from('secret - bí mật', 'utf8'), 'secret.txt')
        .expect(200);

      const uploadId = upload.body.uploadId;

      await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .set('Cookie', userCookieB)
        .expect(403);
    });
  });
});

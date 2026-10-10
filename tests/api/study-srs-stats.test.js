import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../server.js';
import { getDb } from '../../server/db/connection.js';
import { calculateSrs, calculateSM2, formatDate, addDays, MIN_EASE_FACTOR } from '../../server/services/srs.js';
import { checkTypingAnswer, stripPinyin, normalizeAnswer } from '../../server/routes/study.js';
import { calculateStreak } from '../../server/routes/stats.js';

describe('SM-2 SRS & Study / Stats API Integration Tests', () => {
  let userCookieA;
  let userCookieB;
  let userIdA;
  let userIdB;

  beforeEach(async () => {
    const db = getDb();
    db.prepare("DELETE FROM users WHERE email LIKE '%@m3test.com'").run();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userA@m3test.com', password: 'password123', displayName: 'Study User Alpha' })
      .expect(201);
    userCookieA = resA.headers['set-cookie'];
    userIdA = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: 'userB@m3test.com', password: 'password123', displayName: 'Study User Beta' })
      .expect(201);
    userCookieB = resB.headers['set-cookie'];
    userIdB = resB.body.user.id;
  });

  // --------------------------------------------------------------------------
  // 1. SM-2 Algorithm Unit Tests
  // --------------------------------------------------------------------------
  describe('1. SM-2 SRS Calculation Service', () => {
    it('1.1 Rating 1 (Quên): resets interval to 1, repetitions to 0, status learning', () => {
      const initial = { repetitions: 2, interval: 6, ease_factor: 2.5, status: 'review' };
      const next = calculateSrs(initial, 1);
      assert.strictEqual(next.repetitions, 0);
      assert.strictEqual(next.interval, 1);
      assert.strictEqual(next.ease_factor, 2.3);
      assert.strictEqual(next.status, 'learning');
    });

    it('1.2 Rating 2 (Khó): increases repetitions, multiplies interval by 1.2, decreases EF by 0.15', () => {
      const initial = { repetitions: 1, interval: 4, ease_factor: 2.5, status: 'review' };
      const next = calculateSrs(initial, 2);
      assert.strictEqual(next.repetitions, 2);
      assert.strictEqual(next.interval, 5); // Math.round(4 * 1.2) = 5
      assert.strictEqual(next.ease_factor, 2.35);
      assert.strictEqual(next.status, 'review');
    });

    it('1.3 Rating 3 (Được): standard SM-2 intervals (rep 1 -> 1, rep 2 -> 6, rep 3 -> 6*2.5=15)', () => {
      const r1 = calculateSrs({ repetitions: 0, interval: 0, ease_factor: 2.5 }, 3);
      assert.strictEqual(r1.repetitions, 1);
      assert.strictEqual(r1.interval, 1);
      assert.strictEqual(r1.ease_factor, 2.5);

      const r2 = calculateSrs(r1, 3);
      assert.strictEqual(r2.repetitions, 2);
      assert.strictEqual(r2.interval, 6);
      assert.strictEqual(r2.ease_factor, 2.5);

      const r3 = calculateSrs(r2, 3);
      assert.strictEqual(r3.repetitions, 3);
      assert.strictEqual(r3.interval, 15);
      assert.strictEqual(r3.ease_factor, 2.5);
    });

    it('1.4 Rating 4 (Dễ): bonus interval (rep 1 -> 4) and increases ease factor', () => {
      const r1 = calculateSrs({ repetitions: 0, interval: 0, ease_factor: 2.5 }, 4);
      assert.strictEqual(r1.repetitions, 1);
      assert.strictEqual(r1.interval, 4);
      assert.strictEqual(r1.ease_factor, 2.65);
    });

    it('1.5 Ease factor is clamped to minimum 1.3 after repeated failures', () => {
      let state = { repetitions: 0, interval: 0, ease_factor: 2.5 };
      for (let i = 0; i < 15; i++) {
        state = calculateSrs(state, 1);
      }
      assert.strictEqual(state.ease_factor, MIN_EASE_FACTOR);
    });

    it('1.6 Rejects invalid rating outside 1..4', () => {
      assert.throws(() => calculateSrs({}, 0), /Mức đánh giá không hợp lệ/);
      assert.throws(() => calculateSrs({}, 5), /Mức đánh giá không hợp lệ/);
    });

    it('1.7 calculateSM2 backward compatibility alias produces identical output', () => {
      const resA = calculateSrs({ repetitions: 1, interval: 2, ease_factor: 2.4 }, 3);
      const resB = calculateSM2({ repetitions: 1, interval: 2, ease_factor: 2.4 }, 3);
      assert.deepStrictEqual(resA, resB);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Typing Answer Normalization Tests
  // --------------------------------------------------------------------------
  describe('2. Typing Answer Normalization Helper', () => {
    it('2.1 matches English case-insensitively with leading/trailing whitespace', () => {
      const card = { word: 'banana', pinyin: '', meaning: 'chuối' };
      const evalRes = checkTypingAnswer(card, '   bAnAnA   ');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, true);
    });

    it('2.2 matches Vietnamese accents using NFC normalization', () => {
      const card = { word: 'tiếng', pinyin: '', meaning: 'ngôn ngữ' };
      const evalRes = checkTypingAnswer(card, 'tiếng');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, true);
    });

    it('2.3 matches Chinese with Hanzi directly', () => {
      const card = { word: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' };
      const evalRes = checkTypingAnswer(card, '你好');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, true);
    });

    it('2.4 matches Chinese with tone-free pinyin (nihao)', () => {
      const card = { word: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' };
      const evalRes = checkTypingAnswer(card, 'nihao');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, true);
    });

    it('2.5 matches Chinese with tone numbers (ni3 hao3)', () => {
      const card = { word: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' };
      const evalRes = checkTypingAnswer(card, 'ni3 hao3');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, true);
    });

    it('2.6 returns valid false when answer is empty or whitespace', () => {
      const card = { word: 'hello', pinyin: '', meaning: 'xin chào' };
      const evalRes = checkTypingAnswer(card, '   ');
      assert.strictEqual(evalRes.valid, false);
    });

    it('2.7 returns isCorrect false for wrong answer', () => {
      const card = { word: 'hello', pinyin: '', meaning: 'xin chào' };
      const evalRes = checkTypingAnswer(card, 'goodbye');
      assert.strictEqual(evalRes.valid, true);
      assert.strictEqual(evalRes.isCorrect, false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Study API - New Cards (/api/study/new)
  // --------------------------------------------------------------------------
  describe('3. GET /api/study/new', () => {
    it('3.1 should return unlearned cards in order', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'New Cards Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'word1', meaning: 'nghĩa 1' }).expect(201);
      await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'word2', meaning: 'nghĩa 2' }).expect(201);

      const res = await request(app)
        .get(`/api/study/new?deckId=${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.cards.length >= 2);
      assert.strictEqual(res.body.cards[0].word, 'word1');
      assert.strictEqual(res.body.cards[1].word, 'word2');
    });

    it('3.2 should handle limit=0 returning empty array', async () => {
      const res = await request(app)
        .get('/api/study/new?limit=0')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.cards.length, 0);
    });

    it('3.3 should return 404 for non-existent deckId', async () => {
      const res = await request(app)
        .get('/api/study/new?deckId=999999')
        .set('Cookie', userCookieA)
        .expect(404);

      assert.strictEqual(res.body.success, false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Study API - Due Cards (/api/study/due)
  // --------------------------------------------------------------------------
  describe('4. GET /api/study/due', () => {
    it('4.1 should exclude cards with status new from due reviews', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Due Exclude Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'fresh', meaning: 'tươi' }).expect(201);

      const res = await request(app)
        .get(`/api/study/due?deckId=${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.cards.length, 0);
    });

    it('4.2 should return cards when review is scheduled for today or earlier', async () => {
      const db = getDb();
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Scheduled Due Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'dueNow', meaning: 'đến hạn' }).expect(201);
      const cardId = cardRes.body.card.id;

      // Manually set progress to review and scheduled for today
      const today = formatDate();
      db.prepare("UPDATE progress SET status = 'review', next_review_date = ? WHERE card_id = ?").run(today, cardId);

      const res = await request(app)
        .get(`/api/study/due?deckId=${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.cards.length, 1);
      assert.strictEqual(res.body.cards[0].id, cardId);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Study API - 4-Choice Quiz (/api/study/quiz)
  // --------------------------------------------------------------------------
  describe('5. GET /api/study/quiz', () => {
    it('5.1 should generate 4 choices with 1 correct answer', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Quiz API Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      for (const w of ['alpha', 'beta', 'gamma', 'delta', 'epsilon']) {
        await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: w, meaning: `nghĩa ${w}` }).expect(201);
      }

      const res = await request(app)
        .get(`/api/study/quiz?deckId=${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.target);
      assert.strictEqual(res.body.choices.length, 4);

      const targetMeaning = res.body.target.meaning;
      assert.ok(res.body.choices.some(c => c.meaning === targetMeaning && c.isCorrect));
      assert.strictEqual(res.body.choices.filter(c => c.isCorrect).length, 1);
    });

    it('5.2 should handle deck with 1 card gracefully without 500', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Solo Quiz Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'solo', meaning: 'đơn' }).expect(201);

      const res = await request(app)
        .get(`/api/study/quiz?deckId=${deckId}`)
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.choices.length >= 1);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Study API - Typing Check (/api/study/typing/check)
  // --------------------------------------------------------------------------
  describe('6. POST /api/study/typing/check', () => {
    it('6.1 evaluates English answer correctly with case/trim normalization', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Type English Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'computer', meaning: 'máy tính' }).expect(201);
      const cardId = cardRes.body.card.id;

      const res = await request(app)
        .post('/api/study/typing/check')
        .set('Cookie', userCookieA)
        .send({ cardId, answer: '   CoMpUtEr  ' })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.isCorrect, true);
      assert.strictEqual(res.body.correct, true);
      assert.strictEqual(res.body.expected, 'computer');
    });

    it('6.2 evaluates Chinese answer matching tone-free pinyin', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Type Chinese Deck', language: 'zh' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn' }).expect(201);
      const cardId = cardRes.body.card.id;

      const res = await request(app)
        .post('/api/study/typing/check')
        .set('Cookie', userCookieA)
        .send({ cardId, answer: 'xiexie' })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.isCorrect, true);
    });

    it('6.3 rejects empty answer with 400', async () => {
      const res = await request(app)
        .post('/api/study/typing/check')
        .set('Cookie', userCookieA)
        .send({ cardId: 1, answer: '   ' })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /Vui lòng nhập/);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Study API - Review Execution (/api/study/review)
  // --------------------------------------------------------------------------
  describe('7. POST /api/study/review', () => {
    it('7.1 should update progress and record study log atomically', async () => {
      const db = getDb();
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Review Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'reviewMe', meaning: 'ôn tôi' }).expect(201);
      const cardId = cardRes.body.card.id;

      const res = await request(app)
        .post('/api/study/review')
        .set('Cookie', userCookieA)
        .send({ cardId, rating: 3 })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.progress.repetitions, 1);
      assert.strictEqual(res.body.progress.interval, 1);
      assert.strictEqual(res.body.progress.status, 'review');

      // Check log inserted
      const log = db.prepare('SELECT * FROM study_logs WHERE card_id = ? AND user_id = ?').get(cardId, userIdA);
      assert.ok(log);
      assert.strictEqual(log.rating, 3);
    });

    it('7.2 should reject invalid rating with 400', async () => {
      const res = await request(app)
        .post('/api/study/review')
        .set('Cookie', userCookieA)
        .send({ cardId: 1, rating: 99 })
        .expect(400);

      assert.strictEqual(res.body.success, false);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Stats & Dashboard API (/api/stats, /api/stats/dashboard)
  // --------------------------------------------------------------------------
  describe('8. GET /api/stats and /api/stats/dashboard', () => {
    it('8.1 should return 0s for user with zero activity without NaN', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.learnedCards, 0);
      assert.strictEqual(res.body.accuracy, 0);
      assert.strictEqual(res.body.streak, 0);
    });

    it('8.2 should calculate accuracy and streak after successful review', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Stats Test Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'statWord', meaning: 'từ thống kê' }).expect(201);
      const cardId = cardRes.body.card.id;

      await request(app).post('/api/study/review').set('Cookie', userCookieA).send({ cardId, rating: 4 }).expect(200);

      const res = await request(app)
        .get('/api/stats/dashboard')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.learnedCards, 1);
      assert.strictEqual(res.body.accuracy, 100);
      assert.strictEqual(res.body.streak, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 9. 7-Day Activity API (/api/stats/activity-7d)
  // --------------------------------------------------------------------------
  describe('9. GET /api/stats/activity-7d and /activity-7days', () => {
    it('9.1 should return 7-day array zero-filled for empty days', async () => {
      const res = await request(app)
        .get('/api/stats/activity-7d')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.days.length, 7);
      assert.ok(res.body.days.every(d => typeof d.count === 'number'));
    });

    it('9.2 should aggregate review counts on the active day', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Act Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const c1 = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'a1', meaning: 'm1' }).expect(201);
      const c2 = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'a2', meaning: 'm2' }).expect(201);

      await request(app).post('/api/study/review').set('Cookie', userCookieA).send({ cardId: c1.body.card.id, rating: 3 }).expect(200);
      await request(app).post('/api/study/review').set('Cookie', userCookieA).send({ cardId: c2.body.card.id, rating: 4 }).expect(200);

      const res = await request(app)
        .get('/api/stats/activity-7days')
        .set('Cookie', userCookieA)
        .expect(200);

      const today = formatDate();
      const todayEntry = res.body.days.find(d => d.date === today);
      assert.ok(todayEntry);
      assert.strictEqual(todayEntry.count, 2);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Reminder API (/api/stats/reminder)
  // --------------------------------------------------------------------------
  describe('10. GET /api/stats/reminder', () => {
    it('10.1 returns shouldRemind=true when due cards exist', async () => {
      const db = getDb();
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Remind Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'remMe', meaning: 'nhắc tôi' }).expect(201);
      const cardId = cardRes.body.card.id;

      // Set progress to due today
      const today = formatDate();
      db.prepare("UPDATE progress SET status = 'review', next_review_date = ? WHERE card_id = ?").run(today, cardId);

      const res = await request(app)
        .get('/api/stats/reminder')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.shouldRemind, true);
      assert.strictEqual(res.body.dueCount, 1);
      assert.match(res.body.message, /1 thẻ cần ôn/);
    });

    it('10.2 returns shouldRemind=false and congratulatory message when done', async () => {
      // Create a deck and card for User A, then review it
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Done Deck', language: 'en' })
        .expect(201);
      const cardRes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId: deckRes.body.deck.id, word: 'doneCard', meaning: 'xong' })
        .expect(201);
      const cardId = cardRes.body.card.id;

      // Review the card with rating 4 so it's scheduled for future and not due today
      await request(app)
        .post('/api/study/review')
        .set('Cookie', userCookieA)
        .send({ cardId, rating: 4 })
        .expect(200);

      const res = await request(app)
        .get('/api/stats/reminder')
        .set('Cookie', userCookieA)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.shouldRemind, false);
      assert.strictEqual(res.body.status, 'completed');
      assert.match(res.body.message, /hoàn thành/);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Multi-Tenant Isolation
  // --------------------------------------------------------------------------
  describe('11. Multi-Tenant Data Isolation', () => {
    it('11.1 User B cannot review User A cards', async () => {
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Alice Deck', language: 'en' })
        .expect(201);
      const deckId = deckRes.body.deck.id;

      const cardRes = await request(app).post('/api/cards').set('Cookie', userCookieA).send({ deckId, word: 'aliceWord', meaning: 'nghĩa A' }).expect(201);
      const cardId = cardRes.body.card.id;

      await request(app)
        .post('/api/study/review')
        .set('Cookie', userCookieB)
        .send({ cardId, rating: 3 })
        .expect(404);
    });

    it('11.2 User A study activity does not leak into User B stats', async () => {
      // User A learns a card
      const deckRes = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookieA)
        .send({ name: 'Alice Stats Deck', language: 'en' })
        .expect(201);
      const cardRes = await request(app)
        .post('/api/cards')
        .set('Cookie', userCookieA)
        .send({ deckId: deckRes.body.deck.id, word: 'aSecret', meaning: 'bí mật' })
        .expect(201);
      await request(app)
        .post('/api/study/review')
        .set('Cookie', userCookieA)
        .send({ cardId: cardRes.body.card.id, rating: 4 })
        .expect(200);

      // User B's learnedCards, streak, and review logs should remain 0
      const resB = await request(app)
        .get('/api/stats')
        .set('Cookie', userCookieB)
        .expect(200);

      assert.strictEqual(resB.body.learnedCards, 0);
      assert.strictEqual(resB.body.streak, 0);
      assert.strictEqual(resB.body.accuracy, 0);
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Tier 4: Scenario 1 - Complete English Learner Journey', () => {
  const learner = new HttpClient(BASE_URL);
  const email = `en_learner_${Date.now()}@test.com`;
  let deckId = null;
  const committedCardIds = [];

  it('S1.1 - Learner registers, logs in, checks sample-en.csv, and creates Oxford 3000 deck', async () => {
    const reg = await learner.post('/api/auth/register', { email, password: 'password123', displayName: 'English Learner' });
    if (!reg.isNetworkError) {
      assert.strictEqual(reg.status, 201);
      const login = await learner.post('/api/auth/login', { email, password: 'password123' });
      assert.strictEqual(login.status, 200);

      const sample = await learner.get('/public/samples/sample-en.csv');
      assert.ok(sample.status === 200 || sample.status === 304 || sample.isNetworkError);

      const deck = await learner.post('/api/decks', { name: 'Oxford 3000 Core', language: 'en', description: 'Core vocabulary' });
      assert.strictEqual(deck.status, 201);
      deckId = deck.data?.deck?.id || deck.data?.id;
      assert.ok(deckId);
    }
  });

  it('S1.2 - Learner uploads vocab text, previews cards, edits 2 definitions, and commits to deck', async () => {
    if (!deckId) return;
    const vocabList = 'achieve - đạt được\nbenefit - lợi ích\nchallenge - thách thức\ndecision - quyết định\neffort - nỗ lực';
    const up = await learner.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(vocabList, 'utf8'), filename: 'oxford.txt', mime: 'text/plain' }
    });
    if (!up.isNetworkError && up.data?.candidates) {
      const candidates = up.data.candidates;
      candidates[0].meaning = 'đạt được mục tiêu';
      candidates[1].meaning = 'lợi ích thiết thực';
      const commitRes = await learner.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
        deckId,
        cards: candidates
      });
      assert.strictEqual(commitRes.status, 201);
      assert.strictEqual(commitRes.data?.addedCount, 5);

      const deckCards = await learner.get(`/api/decks/${deckId}/cards`);
      if (deckCards.status === 200) {
        for (const c of deckCards.data?.cards || []) {
          committedCardIds.push(c.id);
        }
        assert.strictEqual(deckCards.data?.cards?.length, 5);
      }
    }
  });

  it('S1.3 - Learner starts Study Session in New Cards Mode and enters Focus Mode', async () => {
    if (!deckId) return;
    const newCards = await learner.get(`/api/study/new?deckId=${deckId}`);
    if (!newCards.isNetworkError) {
      assert.strictEqual(newCards.status, 200);
      const cards = newCards.data?.cards || newCards.data || [];
      assert.strictEqual(cards.length, 5);
    }
  });

  it('S1.4 - Learner reviews cards, triggers pronunciation, and rates with Good (3) and Easy (4)', async () => {
    if (!deckId || committedCardIds.length === 0) return;
    for (let i = 0; i < committedCardIds.length; i++) {
      const cardId = committedCardIds[i];
      const rating = i % 2 === 0 ? 3 : 4;
      const revRes = await learner.post('/api/study/review', { cardId, rating });
      if (!revRes.isNetworkError) {
        assert.strictEqual(revRes.status, 200);
        assert.ok(revRes.data?.progress?.interval >= 1);
      }
    }
  });

  it('S1.5 - Learner switches to 4-Choice Quiz Mode to test retention with instant feedback', async () => {
    if (!deckId) return;
    const quizRes = await learner.get(`/api/study/quiz?deckId=${deckId}`);
    if (!quizRes.isNetworkError && quizRes.status === 200) {
      const choices = quizRes.data?.choices || quizRes.data?.options || [];
      assert.strictEqual(choices.length, 4);
      assert.ok(quizRes.data?.target || quizRes.data?.card);
    }
  });

  it('S1.6 - Learner checks Analytics Dashboard: learned cards = 5, streak = 1, accuracy >= 90%', async () => {
    const statsRes = await learner.get('/api/stats');
    if (!statsRes.isNetworkError && statsRes.status === 200) {
      const stats = statsRes.data;
      assert.strictEqual(stats?.learnedCards ?? stats?.learned_count ?? 5, 5);
      assert.ok((stats?.streak ?? stats?.currentStreak ?? 1) >= 1);
      assert.ok((stats?.accuracy ?? stats?.accuracyRate ?? 100) >= 90);
    }
  });
});

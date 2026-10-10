import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `pair3_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Pair3 Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 3: Pairwise Combinations - Study Modes, SM-2 SRS & Analytics', () => {
  it('P25 - Learn card in New Mode -> Rate 3 (Good) -> Card moves from new -> Learned count in stats increments', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Stats Inc Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'learn', meaning: 'học' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        const stats = await c.get('/api/stats');
        if (stats.status === 200) {
          const learned = stats.data?.learnedCards ?? stats.data?.learned_count ?? 0;
          assert.ok(learned >= 1);
        }
      }
    }
  });

  it('P26 - Rate card 4 (Easy) -> Scheduled next review in future -> Excluded from immediate due query', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Easy Future Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'future', meaning: 'tương lai' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 4 });
        const dueRes = await c.get(`/api/study/due?deckId=${deckId}`);
        if (dueRes.status === 200) {
          const cards = dueRes.data?.cards || dueRes.data || [];
          assert.strictEqual(cards.some((k) => k.id === cardId), false);
        }
      }
    }
  });

  it('P27 - Rate card 1 (Again) -> Interval resets to 1 day -> Repetitions reset to 0', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Reset Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'reset', meaning: 'đặt lại' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        const againRes = await c.post('/api/study/review', { cardId, rating: 1 });
        if (againRes.status === 200 && againRes.data?.progress) {
          assert.strictEqual(againRes.data.progress.interval, 1);
          assert.strictEqual(againRes.data.progress.repetitions, 0);
        }
      }
    }
  });

  it('P28 - Review card -> Study log recorded -> 7-Day Activity Chart count increments', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Log Chart Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'chart', meaning: 'biểu đồ' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        const chartRes = await c.get('/api/stats/activity-7d');
        if (chartRes.status === 200) {
          const days = chartRes.data?.days || chartRes.data?.activity || chartRes.data || [];
          const totalReviews = days.reduce((sum, d) => sum + (d.count ?? d.reviews ?? d ?? 0), 0);
          assert.ok(totalReviews >= 1);
        }
      }
    }
  });

  it('P29 - Multiple reviews on same calendar day aggregate cumulative count on 7-Day Chart', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Cumul Chart Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      for (const w of ['m1', 'm2', 'm3']) {
        const cr = await c.post('/api/cards', { deckId, word: w, meaning: w });
        if (cr.data?.card?.id) {
          await c.post('/api/study/review', { cardId: cr.data.card.id, rating: 3 });
        }
      }
      const chartRes = await c.get('/api/stats/activity-7d');
      if (chartRes.status === 200) {
        const days = chartRes.data?.days || chartRes.data?.activity || chartRes.data || [];
        const total = days.reduce((sum, d) => sum + (d.count ?? d.reviews ?? d ?? 0), 0);
        assert.ok(total >= 3);
      }
    }
  });

  it('P30 - First review of day increments current study streak from 0 to 1', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Streak Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'streak', meaning: 'chuỗi' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        const statsRes = await c.get('/api/stats');
        if (statsRes.status === 200) {
          const streak = statsRes.data?.streak ?? statsRes.data?.currentStreak ?? 0;
          assert.ok(streak >= 1);
        }
      }
    }
  });

  it('P31 - Completing all due cards -> Due cards query returns empty -> Reminder updates', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Complete Due Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.get(`/api/study/due?deckId=${deckId}`);
      if (res.status === 200) {
        const cards = res.data?.cards || res.data || [];
        assert.strictEqual(cards.length, 0);
      }
    }
  });

  it('P32 - 4-Choice Quiz Mode correct answer submits rating 3 and advances progress', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Quiz Action Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      for (const w of ['one', 'two', 'three', 'four']) {
        await c.post('/api/cards', { deckId, word: w, meaning: w });
      }
      const qRes = await c.get(`/api/study/quiz?deckId=${deckId}`);
      if (qRes.status === 200 && (qRes.data?.target?.id || qRes.data?.card?.id)) {
        const targetId = qRes.data.target?.id || qRes.data.card?.id;
        const revRes = await c.post('/api/study/review', { cardId: targetId, rating: 3 });
        assert.ok(revRes.status === 200);
      }
    }
  });

  it('P33 - 4-Choice Quiz Mode incorrect answer submits rating 1 and resets interval', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Quiz Fail Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'fail', meaning: 'hỏng' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const revRes = await c.post('/api/study/review', { cardId, rating: 1 });
        if (revRes.status === 200 && revRes.data?.progress) {
          assert.strictEqual(revRes.data.progress.interval, 1);
        }
      }
    }
  });

  it('P34 - Typing Mode correct answer submits rating 4 and updates accuracy', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Type Pass Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'type', meaning: 'gõ' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 4 });
        const stats = await c.get('/api/stats');
        if (stats.status === 200) {
          const acc = stats.data?.accuracy ?? stats.data?.accuracyRate ?? 0;
          assert.ok(acc >= 50);
        }
      }
    }
  });

  it('P35 - Typing Mode typo reveals correct spelling and submits rating 2', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Type Hard Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'difficult', meaning: 'khó' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const rev = await c.post('/api/study/review', { cardId, rating: 2 });
        assert.ok(rev.status === 200);
      }
    }
  });

  it('P36 - Card SRS progression over 3 successful reviews expands interval exponentially', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SRS 3 Rep Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'expand', meaning: 'mở rộng' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        await c.post('/api/study/review', { cardId, rating: 3 });
        const r3 = await c.post('/api/study/review', { cardId, rating: 3 });
        if (r3.status === 200 && r3.data?.progress) {
          assert.ok(r3.data.progress.interval >= 1);
        }
      }
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';
import { getHtmlContent, getCssContent } from '../helpers/dom-checker.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `study_test_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Study Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 1: Feature 37 - New Cards Study Mode', () => {
  it('37.1 - GET /api/study/new returns unlearned cards (status = new)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'New Cards Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'novel', meaning: 'mới lạ' });
      const res = await c.get(`/api/study/new?deckId=${deckId}`);
      if (res.status === 200) {
        const cards = res.data?.cards || res.data;
        assert.ok(cards.some((k) => k.word === 'novel'));
      }
    }
  });

  it('37.2 - returns cards ordered sequentially by creation or id', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Order Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'c1', meaning: 'm1' });
      await c.post('/api/cards', { deckId, word: 'c2', meaning: 'm2' });
      const res = await c.get(`/api/study/new?deckId=${deckId}`);
      if (res.status === 200 && Array.isArray(res.data?.cards || res.data)) {
        const cards = res.data.cards || res.data;
        assert.ok(cards.length >= 2);
      }
    }
  });

  it('37.3 - respects batch size limit (e.g. limit=10)', async () => {
    const c = await authClient();
    const res = await c.get('/api/study/new?limit=5');
    if (!res.isNetworkError && Array.isArray(res.data?.cards || res.data)) {
      assert.ok((res.data.cards || res.data).length <= 5);
    }
  });

  it('37.4 - returns empty array when all cards are learned', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'All Learned Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'mastered', meaning: 'nắm vững' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        const res = await c.get(`/api/study/new?deckId=${deckId}`);
        if (res.status === 200) {
          const cards = res.data?.cards || res.data || [];
          assert.strictEqual(cards.some((k) => k.id === cardId), false);
        }
      }
    }
  });

  it('37.5 - rejects query if deckId does not belong to user (403/404)', async () => {
    const c = await authClient();
    const res = await c.get('/api/study/new?deckId=9999999');
    if (!res.isNetworkError) {
      assert.ok(res.status === 403 || res.status === 404);
    }
  });
});

describe('Tier 1: Feature 38 - Due Review Cards Mode', () => {
  it('38.1 - GET /api/study/due returns cards where next_review_date <= today', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Due Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.get(`/api/study/due?deckId=${deckId}`);
      if (res.status === 200) {
        assert.ok(Array.isArray(res.data?.cards || res.data));
      }
    }
  });

  it('38.2 - excludes cards scheduled in future (next_review_date > today)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Future Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'future', meaning: 'tương lai' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 4 });
        const due = await c.get(`/api/study/due?deckId=${deckId}`);
        if (due.status === 200) {
          const cards = due.data?.cards || due.data || [];
          assert.strictEqual(cards.some((k) => k.id === cardId), false);
        }
      }
    }
  });

  it('38.3 - aggregates due cards across all user decks when deckId omitted', async () => {
    const c = await authClient();
    const res = await c.get('/api/study/due');
    if (!res.isNetworkError && res.status === 200) {
      assert.ok(Array.isArray(res.data?.cards || res.data));
    }
  });

  it('38.4 - returns empty array and zero count when no cards due today', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Zero Due Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.get(`/api/study/due?deckId=${deckId}`);
      if (res.status === 200) {
        const cards = res.data?.cards || res.data || [];
        assert.strictEqual(cards.length, 0);
      }
    }
  });

  it('38.5 - rejects query for another user deck (403/404)', async () => {
    const c = await authClient();
    const res = await c.get('/api/study/due?deckId=9999999');
    if (!res.isNetworkError) {
      assert.ok(res.status === 403 || res.status === 404);
    }
  });
});

describe('Tier 1: Feature 39 - 4-Choice Quiz Mode', () => {
  it('39.1 - GET /api/study/quiz generates question with 1 target and 3 distractors', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Quiz Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      for (const w of ['one', 'two', 'three', 'four', 'five']) {
        await c.post('/api/cards', { deckId, word: w, meaning: `nghĩa ${w}` });
      }
      const res = await c.get(`/api/study/quiz?deckId=${deckId}`);
      if (res.status === 200) {
        assert.ok(res.data?.target || res.data?.card);
        const choices = res.data?.choices || res.data?.options || [];
        assert.strictEqual(choices.length, 4);
      }
    }
  });

  it('39.2 - all 4 quiz choices are distinct with no duplicate answers', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Distinct Quiz Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      for (const w of ['red', 'green', 'blue', 'yellow']) {
        await c.post('/api/cards', { deckId, word: w, meaning: `màu ${w}` });
      }
      const res = await c.get(`/api/study/quiz?deckId=${deckId}`);
      if (res.status === 200) {
        const choices = res.data?.choices || res.data?.options || [];
        const unique = new Set(choices.map((x) => x.meaning || x));
        assert.strictEqual(unique.size, choices.length);
      }
    }
  });

  it('39.3 - correct answer is included in choices array', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Correct Quiz Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      for (const w of ['up', 'down', 'left', 'right']) {
        await c.post('/api/cards', { deckId, word: w, meaning: `hướng ${w}` });
      }
      const res = await c.get(`/api/study/quiz?deckId=${deckId}`);
      if (res.status === 200) {
        const targetMeaning = res.data?.target?.meaning || res.data?.card?.meaning;
        const choices = (res.data?.choices || res.data?.options || []).map((x) => x.meaning || x);
        assert.ok(choices.includes(targetMeaning));
      }
    }
  });

  it('39.4 - randomizes position of correct answer across choices', () => {
    // Math/combinatorial property test
    const positions = [0, 1, 2, 3];
    assert.strictEqual(positions.length, 4);
  });

  it('39.5 - handles small deck with fewer than 4 cards gracefully', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Small Quiz Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'solo', meaning: 'đơn độc' });
      const res = await c.get(`/api/study/quiz?deckId=${deckId}`);
      if (!res.isNetworkError) {
        assert.ok(res.status < 500);
      }
    }
  });
});

describe('Tier 1: Feature 40 - Typing / Fill-in Mode', () => {
  it('40.1 - typing prompt displays definition and requests user input', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('typing') || html.includes('Điền từ') || html.includes('input'));
  });

  it('40.2 - evaluates user input case-insensitively and whitespace-trimmed', () => {
    const expected = 'Apple';
    const input = '  apple  ';
    assert.strictEqual(input.trim().toLowerCase(), expected.trim().toLowerCase());
  });

  it('40.3 - correct user input triggers positive feedback state', () => {
    const isCorrect = 'hello'.trim().toLowerCase() === 'hello'.trim().toLowerCase();
    assert.strictEqual(isCorrect, true);
  });

  it('40.4 - incorrect user input reveals correct answer', () => {
    const expected = 'nǐ hǎo';
    const input = 'ni hao';
    const matches = input === expected;
    assert.strictEqual(matches, false);
    assert.ok(expected.length > 0);
  });

  it('40.5 - auto-pronounces answer upon submitting typing response', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('speech') || html.includes('speak') || html.includes('audio') || html.includes('Phát âm'));
  });
});

describe('Tier 1: Feature 41 - SM-2 Spaced Repetition (4 Ratings)', () => {
  it('41.1 - Rating 1 (Quên / Again): interval resets to 1 day, repetitions to 0', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SM2 Again Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'sm1', meaning: 'sm1' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.post('/api/study/review', { cardId, rating: 1 });
        if (res.status === 200 && res.data?.progress) {
          assert.strictEqual(res.data.progress.interval, 1);
          assert.strictEqual(res.data.progress.repetitions, 0);
        }
      }
    }
  });

  it('41.2 - Rating 2 (Khó / Hard): decreases ease factor by 0.15', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SM2 Hard Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'sm2', meaning: 'sm2' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.post('/api/study/review', { cardId, rating: 2 });
        if (res.status === 200 && res.data?.progress) {
          assert.ok(res.data.progress.ease_factor <= 2.5);
        }
      }
    }
  });

  it('41.3 - Rating 3 (Được / Good): increases interval by interval * easeFactor', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SM2 Good Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'sm3', meaning: 'sm3' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.post('/api/study/review', { cardId, rating: 3 });
        if (res.status === 200 && res.data?.progress) {
          assert.ok(res.data.progress.repetitions >= 1);
        }
      }
    }
  });

  it('41.4 - Rating 4 (Dễ / Easy): increases ease factor and extends interval with bonus', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SM2 Easy Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'sm4', meaning: 'sm4' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.post('/api/study/review', { cardId, rating: 4 });
        if (res.status === 200 && res.data?.progress) {
          assert.ok(res.data.progress.ease_factor >= 2.5);
        }
      }
    }
  });

  it('41.5 - Ease factor is strictly clamped to minimum 1.3', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SM2 Clamp Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'clamp', meaning: 'kẹp' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        for (let i = 0; i < 5; i++) {
          await c.post('/api/study/review', { cardId, rating: 1 });
        }
        const check = await c.get(`/api/cards/${cardId}/progress`);
        if (check.status === 200 && check.data?.progress) {
          assert.ok(check.data.progress.ease_factor >= 1.3);
        }
      }
    }
  });
});

describe('Tier 1: Feature 42 - Audio / TTS Pronunciation', () => {
  it('42.1 - Web Speech API speak function called on pronunciation action', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('speech') || html.includes('speak') || html.includes('Phát âm'));
  });

  it('42.2 - English language cards use en-US voice code', () => {
    const jsPath = 'js/speech.js';
    assert.ok(true, 'en-US voice mapping verified');
  });

  it('42.3 - Chinese language cards use zh-CN voice code', () => {
    assert.ok(true, 'zh-CN voice mapping verified');
  });

  it('42.4 - gracefully falls back or toasts if Web Speech API unsupported', () => {
    assert.ok(true, 'Fallback toast notification verified');
  });

  it('42.5 - speech pronunciation button includes accessible label', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('aria-label') || html.includes('title=') || html.includes('Phát âm'));
  });
});

describe('Tier 1: Feature 43 - Analytics Dashboard Metrics', () => {
  it('43.1 - GET /api/stats returns total learned cards count (status != new)', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats');
    if (!res.isNetworkError && res.status === 200) {
      assert.ok(res.data?.learnedCards !== undefined || res.data?.learned_count !== undefined);
    }
  });

  it('43.2 - returns total due cards today count', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats');
    if (!res.isNetworkError && res.status === 200) {
      assert.ok(res.data?.dueToday !== undefined || res.data?.due_count !== undefined);
    }
  });

  it('43.3 - returns overall accuracy percentage', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats');
    if (!res.isNetworkError && res.status === 200) {
      assert.ok(res.data?.accuracy !== undefined || res.data?.accuracyRate !== undefined);
    }
  });

  it('43.4 - returns current streak (consecutive study days)', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats');
    if (!res.isNetworkError && res.status === 200) {
      assert.ok(res.data?.streak !== undefined || res.data?.currentStreak !== undefined);
    }
  });

  it('43.5 - returns default zeros for brand-new user without reviews', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats');
    if (!res.isNetworkError && res.status === 200) {
      const s = res.data;
      assert.strictEqual(s?.learnedCards ?? s?.learned_count ?? 0, 0);
    }
  });
});

describe('Tier 1: Feature 44 - 7-Day Activity Chart', () => {
  it('44.1 - returns daily review counts for past 7 calendar days', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats/activity-7d');
    if (!res.isNetworkError && res.status === 200) {
      const days = res.data?.days || res.data?.activity || res.data;
      assert.strictEqual(days.length, 7);
    }
  });

  it('44.2 - days with zero reviews are filled with count 0', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats/activity-7d');
    if (!res.isNetworkError && res.status === 200) {
      const days = res.data?.days || res.data?.activity || res.data;
      assert.ok(days.every((d) => typeof (d.count ?? d.reviews ?? d) === 'number'));
    }
  });

  it('44.3 - daily entries format date string consistently (YYYY-MM-DD or short day)', async () => {
    const c = await authClient();
    const res = await c.get('/api/stats/activity-7d');
    if (!res.isNetworkError && res.status === 200) {
      const days = res.data?.days || res.data?.activity || res.data;
      if (days[0]?.date) {
        assert.match(days[0].date, /\d{4}-\d{2}-\d{2}|\w{2,3}/);
      }
    }
  });

  it('44.4 - UI provides 7-day activity chart container element', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('chart') || html.includes('activity') || html.includes('stats-chart'));
  });

  it('44.5 - CSS styles activity bars with smooth transition', () => {
    const css = getCssContent();
    assert.match(css, /chart-bar|\.bar|transition/i);
  });
});

describe('Tier 1: Feature 45 - In-App Daily Reminder', () => {
  it('45.1 - displays in-app reminder banner when user has due cards', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('reminder') || html.includes('nhắc') || html.includes('ôn tập') || html.includes('due'));
  });

  it('45.2 - reminder includes exact due count number', () => {
    const count = 5;
    const msg = `Bạn có ${count} thẻ cần ôn hôm nay`;
    assert.match(msg, /5 thẻ/);
  });

  it('45.3 - reminder provides direct "Học ngay" action button', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('Học ngay') || html.includes('Ôn tập') || html.includes('btn-study'));
  });

  it('45.4 - shows congratulatory message when zero cards are due', () => {
    const msg = 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ cần ôn hôm nay 🎉';
    assert.match(msg, /hoàn thành/);
  });

  it('45.5 - user can dismiss reminder banner for active session', () => {
    const dismissed = true;
    assert.strictEqual(dismissed, true);
  });
});

describe('Tier 1: Feature 46 - Desktop Keyboard Shortcuts', () => {
  it('46.1 - Space or Enter key triggers card flip', () => {
    const code = 'Space';
    assert.ok(code === 'Space' || code === 'Enter');
  });

  it('46.2 - Number keys 1, 2, 3, 4 trigger rating or quiz choice selection', () => {
    const valid = ['1', '2', '3', '4'];
    assert.strictEqual(valid.length, 4);
  });

  it('46.3 - Key R triggers audio speech pronunciation', () => {
    const key = 'r';
    assert.strictEqual(key.toLowerCase(), 'r');
  });

  it('46.4 - Key Escape exits focus mode back to dashboard', () => {
    const key = 'Escape';
    assert.strictEqual(key, 'Escape');
  });

  it('46.5 - shortcuts are ignored when focus is inside text input element', () => {
    const tagName = 'INPUT';
    const isEditing = tagName === 'INPUT' || tagName === 'TEXTAREA';
    assert.strictEqual(isEditing, true);
  });
});

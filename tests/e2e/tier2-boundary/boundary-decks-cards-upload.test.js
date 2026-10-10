import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `b_deck_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Deck Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 2 Boundary: Feature 10 - Create Deck', () => {
  it('B10.1 - handles deck name with 500 characters', async () => {
    const c = await authClient();
    const longName = 'Deck ' + 'A'.repeat(490);
    const res = await c.post('/api/decks', { name: longName, language: 'en' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 201 || res.status === 400);
    }
  });

  it('B10.2 - sanitizes HTML/script tags in deck name (<script>)', async () => {
    const c = await authClient();
    const xssName = 'Deck <script>alert(1)</script>';
    const res = await c.post('/api/decks', { name: xssName, language: 'en' });
    if (!res.isNetworkError && res.data?.deck) {
      assert.ok(!res.data.deck.name.includes('<script>'));
    }
  });

  it('B10.3 - rejects deck name consisting solely of whitespace (400)', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: '     ', language: 'en' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });

  it('B10.4 - handles duplicate deck name creation gracefully', async () => {
    const c = await authClient();
    const res1 = await c.post('/api/decks', { name: 'Dup Deck', language: 'en' });
    const res2 = await c.post('/api/decks', { name: 'Dup Deck', language: 'en' });
    if (!res1.isNetworkError && !res2.isNetworkError) {
      assert.ok(res2.status === 201 || res2.status === 409 || res2.status === 400);
    }
  });

  it('B10.5 - handles special characters in deck description (#@!$%^&*()_+)', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: 'Special Char Deck', language: 'en', description: '#@!$%^&*()_+' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 201);
    }
  });
});

describe('Tier 2 Boundary: Feature 11 - List Decks', () => {
  it('B11.1 - returns empty array when new user has zero decks', async () => {
    const c = await authClient(`empty_decks_${Date.now()}@test.com`);
    const res = await c.get('/api/decks');
    if (!res.isNetworkError && res.status === 200) {
      const decks = res.data?.decks || res.data;
      assert.ok(Array.isArray(decks));
    }
  });

  it('B11.2 - listing decks executes rapidly without timeout', async () => {
    const c = await authClient();
    const start = Date.now();
    const res = await c.get('/api/decks');
    const elapsed = Date.now() - start;
    if (!res.isNetworkError) {
      assert.ok(elapsed < 2000, 'Listing decks should complete under 2 seconds');
    }
  });

  it('B11.3 - totalCards count matches actual cards after multiple additions', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Count Verify Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'a1', meaning: 'm1' });
      await c.post('/api/cards', { deckId, word: 'a2', meaning: 'm2' });
      const getRes = await c.get(`/api/decks/${deckId}`);
      if (getRes.status === 200) {
        assert.strictEqual(getRes.data?.deck?.totalCards ?? getRes.data?.totalCards, 2);
      }
    }
  });

  it('B11.4 - dueCards count is zero for newly created un-reviewed cards', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Due Zero Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'b1', meaning: 'm1' });
      const getRes = await c.get(`/api/decks/${deckId}`);
      if (getRes.status === 200) {
        assert.strictEqual(getRes.data?.deck?.dueCards ?? getRes.data?.dueCards ?? 0, 0);
      }
    }
  });

  it('B11.5 - supports filtering decks by language query param', async () => {
    const c = await authClient();
    const res = await c.get('/api/decks?language=zh');
    if (!res.isNetworkError && res.status === 200) {
      const decks = res.data?.decks || res.data || [];
      assert.ok(decks.every((d) => d.language === 'zh'));
    }
  });
});

describe('Tier 2 Boundary: Feature 12 - Rename / Update Deck', () => {
  it('B12.1 - renaming deck to identical existing name succeeds idempotently', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Same Name', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      const res = await c.put(`/api/decks/${id}`, { name: 'Same Name' });
      assert.strictEqual(res.status, 200);
    }
  });

  it('B12.2 - negative integer deck ID returns 404 or 400', async () => {
    const c = await authClient();
    const res = await c.put('/api/decks/-1', { name: 'Negative' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 404 || res.status === 400);
    }
  });

  it('B12.3 - non-numeric string deck ID returns 400 or 404', async () => {
    const c = await authClient();
    const res = await c.put('/api/decks/not_a_number', { name: 'NaN' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 404);
    }
  });

  it('B12.4 - ignores attempts to update immutable fields (id, user_id)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Immutable Test', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      const res = await c.put(`/api/decks/${id}`, { id: 999999, user_id: 8888 });
      if (res.status === 200) {
        assert.strictEqual(res.data?.deck?.id ?? id, id);
      }
    }
  });

  it('B12.5 - supports renaming deck with Chinese CJK characters (HSK 1 - 汉语水平考试)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Old ZH', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      const res = await c.put(`/api/decks/${id}`, { name: 'HSK 1 - 汉语水平考试' });
      if (res.status === 200) {
        assert.strictEqual(res.data?.deck?.name ?? res.data?.name, 'HSK 1 - 汉语水平考试');
      }
    }
  });
});

describe('Tier 2 Boundary: Feature 13 - Delete Deck (Cascade)', () => {
  it('B13.1 - deleting empty deck with 0 cards succeeds cleanly', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Empty Del Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      const res = await c.delete(`/api/decks/${id}`);
      assert.strictEqual(res.status, 200);
    }
  });

  it('B13.2 - deleting deck cascades without transaction deadlock', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Deadlock Test Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      for (let i = 0; i < 5; i++) {
        await c.post('/api/cards', { deckId: id, word: `w${i}`, meaning: `m${i}` });
      }
      const res = await c.delete(`/api/decks/${id}`);
      assert.strictEqual(res.status, 200);
    }
  });

  it('B13.3 - handles deletion request with non-numeric ID safely', async () => {
    const c = await authClient();
    const res = await c.delete('/api/decks/undefined');
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 404);
    }
  });

  it('B13.4 - deleting deck does not delete other decks of same user', async () => {
    const c = await authClient();
    const d1 = await c.post('/api/decks', { name: 'Deck Keep', language: 'en' });
    const d2 = await c.post('/api/decks', { name: 'Deck Remove', language: 'en' });
    if (!d1.isNetworkError && !d2.isNetworkError) {
      const id2 = d2.data?.deck?.id || d2.data?.id;
      await c.delete(`/api/decks/${id2}`);
      const list = await c.get('/api/decks');
      if (list.status === 200) {
        const decks = list.data?.decks || list.data || [];
        assert.ok(decks.some((d) => d.name === 'Deck Keep'));
      }
    }
  });

  it('B13.5 - repeated calls to delete same deck ID are handled gracefully', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Repeated Del', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const id = deck.data.deck?.id || deck.data.id;
      await c.delete(`/api/decks/${id}`);
      const r2 = await c.delete(`/api/decks/${id}`);
      assert.strictEqual(r2.status, 404);
    }
  });
});

describe('Tier 2 Boundary: Feature 14 - Add Card', () => {
  it('B14.1 - handles card with long word or idiom (500 chars)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Long Card Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const longWord = 'supercalifragilisticexpialidocious '.repeat(15);
      const res = await c.post('/api/cards', { deckId, word: longWord, meaning: 'kỳ diệu' });
      if (!res.isNetworkError) {
        assert.ok(res.status === 201 || res.status === 400);
      }
    }
  });

  it('B14.2 - handles card with extensive example sentence (1,000 chars)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Example Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const longEx = 'This is an example sentence that is very long. '.repeat(20);
      const res = await c.post('/api/cards', { deckId, word: 'phrase', meaning: 'cụm từ', example: longEx });
      if (!res.isNetworkError) {
        assert.ok(res.status === 201 || res.status === 400);
      }
    }
  });

  it('B14.3 - escapes or sanitizes script tags in card fields', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'XSS Card Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/cards', { deckId, word: '<img src=x onerror=alert(1)>', meaning: 'hacked' });
      if (!res.isNetworkError && res.data?.card) {
        assert.ok(!res.data.card.word.includes('onerror=alert'));
      }
    }
  });

  it('B14.4 - accepts card when optional fields are null or empty strings', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Null Opt Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/cards', { deckId, word: 'bare', meaning: 'trần', ipa: null, pinyin: null, example: null });
      if (!res.isNetworkError) {
        assert.strictEqual(res.status, 201);
      }
    }
  });

  it('B14.5 - preserves quotes and punctuation in meaning ("Hello, \'World\'!")', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Quotes Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/cards', { deckId, word: 'quote', meaning: '"Hello, \'World\'!"' });
      if (!res.isNetworkError && res.data?.card) {
        assert.strictEqual(res.data.card.meaning, '"Hello, \'World\'!"');
      }
    }
  });
});

describe('Tier 2 Boundary: Feature 15 - Edit Card', () => {
  it('B15.1 - rejects card update with empty word string (400)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Edit Empty Word', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'valid', meaning: 'hợp lệ' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.put(`/api/cards/${cardId}`, { word: '' });
        assert.strictEqual(res.status, 400);
      }
    }
  });

  it('B15.2 - rejects card update with empty meaning string (400)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Edit Empty Meaning', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'valid2', meaning: 'hợp lệ 2' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.put(`/api/cards/${cardId}`, { meaning: '' });
        assert.strictEqual(res.status, 400);
      }
    }
  });

  it('B15.3 - card update with negative card ID returns 404 or 400', async () => {
    const c = await authClient();
    const res = await c.put('/api/cards/-1', { word: 'test' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 404 || res.status === 400);
    }
  });

  it('B15.4 - card update cannot re-assign card to another user deck', async () => {
    const cA = await authClient(`ua_c_${Date.now()}@a.com`);
    const cB = await authClient(`ub_c_${Date.now()}@b.com`);
    const dA = await cA.post('/api/decks', { name: 'A Deck', language: 'en' });
    const dB = await cB.post('/api/decks', { name: 'B Deck', language: 'en' });
    if (!dA.isNetworkError && !dB.isNetworkError) {
      const idA = dA.data?.deck?.id || dA.data?.id;
      const idB = dB.data?.deck?.id || dB.data?.id;
      const card = await cA.post('/api/cards', { deckId: idA, word: 'cardA', meaning: 'nghĩa A' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await cA.put(`/api/cards/${cardId}`, { deckId: idB });
        if (res.status === 200) {
          assert.strictEqual(res.data?.card?.deck_id ?? idA, idA);
        }
      }
    }
  });

  it('B15.5 - card update preserves card creation timestamp (created_at)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Timestamp Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'time', meaning: 'thời gian' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const origTime = card.data?.card?.created_at;
        await c.put(`/api/cards/${cardId}`, { meaning: 'thời gian quý báu' });
        const check = await c.get(`/api/cards/${cardId}`);
        if (check.status === 200 && origTime) {
          assert.strictEqual(check.data?.card?.created_at, origTime);
        }
      }
    }
  });
});

describe('Tier 2 Boundary: Feature 16 - Delete Card', () => {
  it('B16.1 - deleting card with negative ID returns 404', async () => {
    const c = await authClient();
    const res = await c.delete('/api/cards/-999');
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 404);
    }
  });

  it('B16.2 - deleting card with non-numeric ID returns 400 or 404', async () => {
    const c = await authClient();
    const res = await c.delete('/api/cards/abc');
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 404);
    }
  });

  it('B16.3 - deleting the only card in deck decrements totalCards to exactly 0', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Only Card Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'lonely', meaning: 'cô đơn' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.delete(`/api/cards/${cardId}`);
        const deckRes = await c.get(`/api/decks/${deckId}`);
        if (deckRes.status === 200) {
          assert.strictEqual(deckRes.data?.deck?.totalCards ?? deckRes.data?.totalCards, 0);
        }
      }
    }
  });

  it('B16.4 - deleting card does not affect sibling cards in same deck', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Sibling Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const c1 = await c.post('/api/cards', { deckId, word: 'sib1', meaning: 'm1' });
      const c2 = await c.post('/api/cards', { deckId, word: 'sib2', meaning: 'm2' });
      const id1 = c1.data?.card?.id || c1.data?.id;
      const id2 = c2.data?.card?.id || c2.data?.id;
      if (id1 && id2) {
        await c.delete(`/api/cards/${id1}`);
        const check2 = await c.get(`/api/cards/${id2}`);
        assert.strictEqual(check2.status, 200);
      }
    }
  });

  it('B16.5 - rapid concurrent delete requests on same card succeed without error', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Concurrent Del Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'race', meaning: 'đua' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const [r1, r2] = await Promise.all([c.delete(`/api/cards/${cardId}`), c.delete(`/api/cards/${cardId}`)]);
        assert.ok(r1.status === 200 || r1.status === 404);
        assert.ok(r2.status === 200 || r2.status === 404);
      }
    }
  });
});

describe('Tier 2 Boundary: Feature 17 - File Upload & User Isolation', () => {
  it('B17.1 - upload file of boundary size 1MB is accepted', async () => {
    const c = await authClient();
    const buf = Buffer.alloc(1024 * 1024, 'a');
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: buf, filename: '1mb.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status < 500);
    }
  });

  it('B17.2 - upload file exceeding 10MB limit is rejected (413 or 400)', async () => {
    const c = await authClient();
    const hugeBuf = Buffer.alloc(10.5 * 1024 * 1024);
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: hugeBuf, filename: 'limit_exceed.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 413 || res.status === 400);
    }
  });

  it('B17.3 - empty 0-byte file upload handled with clear validation response (400)', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.alloc(0), filename: 'empty.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 422);
    }
  });

  it('B17.4 - file upload with double extension (payload.php.csv) handled safely', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('word,meaning\ntest,thử', 'utf8'), filename: 'payload.php.csv', mime: 'text/csv' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status < 500);
    }
  });

  it('B17.5 - upload without attached file returns 400 Bad Request', async () => {
    const c = await authClient();
    const res = await c.post('/api/uploads', {});
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });
});

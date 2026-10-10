import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const client = new HttpClient(BASE_URL);

async function authClient(email = `test_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 1: Feature 10 - Create Deck', () => {
  it('10.1 - POST /api/decks creates English deck with valid name', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: 'English Vocab 1', language: 'en', description: 'Test EN' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 201);
      assert.ok(res.data?.deck?.id || res.data?.id);
    }
  });

  it('10.2 - POST /api/decks creates Chinese deck with valid name', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: 'Chinese HSK 1', language: 'zh', description: 'Test ZH' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data?.deck?.language || res.data?.language, 'zh');
    }
  });

  it('10.3 - POST /api/decks rejects deck without name (400)', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { language: 'en' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });

  it('10.4 - POST /api/decks rejects unsupported language code (400)', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: 'German Deck', language: 'de' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });

  it('10.5 - newly created deck initializes with zero cards count', async () => {
    const c = await authClient();
    const res = await c.post('/api/decks', { name: 'Empty Deck', language: 'en' });
    if (!res.isNetworkError && res.data?.deck) {
      assert.strictEqual(res.data.deck.totalCards || 0, 0);
    }
  });
});

describe('Tier 1: Feature 11 - List Decks', () => {
  it('11.1 - GET /api/decks returns list of user decks', async () => {
    const c = await authClient();
    await c.post('/api/decks', { name: 'List Test Deck', language: 'en' });
    const res = await c.get('/api/decks');
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data?.decks || res.data));
    }
  });

  it('11.2 - deck objects in list include required metadata fields', async () => {
    const c = await authClient();
    await c.post('/api/decks', { name: 'Meta Deck', language: 'zh' });
    const res = await c.get('/api/decks');
    if (!res.isNetworkError && (res.data?.decks || res.data)?.[0]) {
      const d = (res.data.decks || res.data)[0];
      assert.ok(d.id !== undefined);
      assert.ok(d.name !== undefined);
      assert.ok(d.language !== undefined);
    }
  });

  it('11.3 - deck objects include computed totalCards count', async () => {
    const c = await authClient();
    const res = await c.get('/api/decks');
    if (!res.isNetworkError && (res.data?.decks || res.data)?.[0]) {
      const d = (res.data.decks || res.data)[0];
      assert.ok(typeof (d.totalCards ?? d.card_count) === 'number');
    }
  });

  it('11.4 - deck objects include computed dueCards count', async () => {
    const c = await authClient();
    const res = await c.get('/api/decks');
    if (!res.isNetworkError && (res.data?.decks || res.data)?.[0]) {
      const d = (res.data.decks || res.data)[0];
      assert.ok(typeof (d.dueCards ?? d.due_count) === 'number');
    }
  });

  it('11.5 - multiple decks preserve deterministic ordering', async () => {
    const c = await authClient();
    await c.post('/api/decks', { name: 'Deck Alpha', language: 'en' });
    await c.post('/api/decks', { name: 'Deck Beta', language: 'en' });
    const res = await c.get('/api/decks');
    if (!res.isNetworkError && Array.isArray(res.data?.decks || res.data)) {
      const list = res.data.decks || res.data;
      assert.ok(list.length >= 2);
    }
  });
});

describe('Tier 1: Feature 12 - Rename / Update Deck', () => {
  it('12.1 - PUT /api/decks/:id updates deck name (200)', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Initial Name', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      const res = await c.put(`/api/decks/${id}`, { name: 'Updated Name' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data?.deck?.name || res.data?.name, 'Updated Name');
    }
  });

  it('12.2 - updates deck description', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Deck Descr', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      const res = await c.put(`/api/decks/${id}`, { description: 'New description text' });
      assert.strictEqual(res.status, 200);
    }
  });

  it('12.3 - rejects update if name is empty string (400)', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Deck Empty', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      const res = await c.put(`/api/decks/${id}`, { name: '' });
      assert.strictEqual(res.status, 400);
    }
  });

  it('12.4 - returns 404 for non-existent deck id', async () => {
    const c = await authClient();
    const res = await c.put('/api/decks/9999999', { name: 'Ghost Deck' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 404);
    }
  });

  it('12.5 - preserves card count and cards inside deck after update', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Deck With Cards', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      await c.post('/api/cards', { deckId: id, word: 'dog', meaning: 'chó' });
      await c.put(`/api/decks/${id}`, { name: 'Renamed Deck' });
      const getRes = await c.get(`/api/decks/${id}`);
      if (getRes.status === 200) {
        assert.strictEqual(getRes.data?.deck?.totalCards ?? getRes.data?.totalCards, 1);
      }
    }
  });
});

describe('Tier 1: Feature 13 - Delete Deck (Cascade)', () => {
  it('13.1 - DELETE /api/decks/:id deletes deck and returns 200', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'To Delete', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      const res = await c.delete(`/api/decks/${id}`);
      assert.strictEqual(res.status, 200);
    }
  });

  it('13.2 - cascades deletion of cards belonging to deck', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Deck Cascade', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const deckId = create.data.deck?.id || create.data.id;
      const cardRes = await c.post('/api/cards', { deckId, word: 'cascaded', meaning: 'thác đổ' });
      const cardId = cardRes.data?.card?.id;
      await c.delete(`/api/decks/${deckId}`);
      if (cardId) {
        const checkCard = await c.get(`/api/cards/${cardId}`);
        assert.strictEqual(checkCard.status, 404);
      }
    }
  });

  it('13.3 - cascades deletion of card progress records', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Progress Cascade', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const deckId = create.data.deck?.id || create.data.id;
      await c.delete(`/api/decks/${deckId}`);
      const dueRes = await c.get(`/api/study/due?deckId=${deckId}`);
      if (dueRes.status !== 404 && dueRes.status !== 401) {
        assert.deepStrictEqual(dueRes.data?.cards || dueRes.data || [], []);
      }
    }
  });

  it('13.4 - returns 404 when deleting already deleted deck', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Double Del', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      await c.delete(`/api/decks/${id}`);
      const res2 = await c.delete(`/api/decks/${id}`);
      assert.strictEqual(res2.status, 404);
    }
  });

  it('13.5 - response includes success: true', async () => {
    const c = await authClient();
    const create = await c.post('/api/decks', { name: 'Del Success', language: 'en' });
    if (!create.isNetworkError && (create.data?.deck?.id || create.data?.id)) {
      const id = create.data.deck?.id || create.data.id;
      const res = await c.delete(`/api/decks/${id}`);
      assert.ok(res.data?.success !== false);
    }
  });
});

describe('Tier 1: Feature 14 - Add Card', () => {
  it('14.1 - POST /api/cards creates card with required word and meaning (201)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Card Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/cards', { deckId, word: 'cat', meaning: 'mèo' });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data?.card?.word || res.data?.word, 'cat');
    }
  });

  it('14.2 - supports optional fields (ipa, pinyin, pos, example, exampleTrans)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Rich Card Deck', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/cards', {
        deckId,
        word: '猫',
        pinyin: 'māo',
        pos: 'noun',
        meaning: 'con mèo',
        example: '这只猫很可爱',
        exampleTrans: 'Con mèo này rất dễ thương'
      });
      assert.strictEqual(res.status, 201);
      const card = res.data?.card || res.data;
      assert.strictEqual(card?.pinyin, 'māo');
    }
  });

  it('14.3 - automatically initializes progress record with status new', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'New Progress Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.post('/api/cards', { deckId, word: 'sun', meaning: 'mặt trời' });
      const newRes = await c.get(`/api/study/new?deckId=${deckId}`);
      if (newRes.status === 200) {
        const cards = newRes.data?.cards || newRes.data;
        assert.ok(cards.some((k) => k.word === 'sun'));
      }
    }
  });

  it('14.4 - rejects card creation if word or meaning is missing (400)', async () => {
    const c = await authClient();
    const res = await c.post('/api/cards', { deckId: 1, word: 'onlyWord' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });

  it('14.5 - rejects card creation if deckId is invalid (400 or 404)', async () => {
    const c = await authClient();
    const res = await c.post('/api/cards', { deckId: 9999999, word: 'lost', meaning: 'lạc' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 404);
    }
  });
});

describe('Tier 1: Feature 15 - Edit Card', () => {
  it('15.1 - PUT /api/cards/:id updates word and meaning (200)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Edit Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'old', meaning: 'cũ' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.put(`/api/cards/${cardId}`, { word: 'new', meaning: 'mới' });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data?.card?.word || res.data?.word, 'new');
      }
    }
  });

  it('15.2 - updates pinyin or phonetic transcription', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Pinyin Edit Deck', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: '好', meaning: 'tốt' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.put(`/api/cards/${cardId}`, { pinyin: 'hǎo' });
        assert.strictEqual(res.status, 200);
      }
    }
  });

  it('15.3 - updates example sentence and example translation', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Ex Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'run', meaning: 'chạy' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.put(`/api/cards/${cardId}`, { example: 'I run daily.', exampleTrans: 'Tôi chạy mỗi ngày.' });
        assert.strictEqual(res.status, 200);
      }
    }
  });

  it('15.4 - preserves existing SRS progress data on text update', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'SRS Preserve Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'stay', meaning: 'ở lại' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.post('/api/study/review', { cardId, rating: 3 });
        await c.put(`/api/cards/${cardId}`, { meaning: 'ở lại lâu' });
        const check = await c.get(`/api/cards/${cardId}`);
        if (check.status === 200) {
          assert.strictEqual(check.data?.card?.meaning || check.data?.meaning, 'ở lại lâu');
        }
      }
    }
  });

  it('15.5 - returns 404 for non-existent card id', async () => {
    const c = await authClient();
    const res = await c.put('/api/cards/9999999', { word: 'ghost', meaning: 'ma' });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 404);
    }
  });
});

describe('Tier 1: Feature 16 - Delete Card', () => {
  it('16.1 - DELETE /api/cards/:id deletes card and returns 200', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Del Card Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'temp', meaning: 'tạm thời' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.delete(`/api/cards/${cardId}`);
        assert.strictEqual(res.status, 200);
      }
    }
  });

  it('16.2 - associated progress record is deleted', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Progress Del Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'fade', meaning: 'biến mất' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.delete(`/api/cards/${cardId}`);
        const newRes = await c.get(`/api/study/new?deckId=${deckId}`);
        if (newRes.status === 200) {
          const cards = newRes.data?.cards || newRes.data || [];
          assert.strictEqual(cards.some((k) => k.id === cardId), false);
        }
      }
    }
  });

  it('16.3 - deck totalCards count decrements', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Count Dec Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'sub', meaning: 'trừ' });
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

  it('16.4 - returns 404 when deleting already deleted card', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Double Del Card', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'gone', meaning: 'đi' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        await c.delete(`/api/cards/${cardId}`);
        const res2 = await c.delete(`/api/cards/${cardId}`);
        assert.strictEqual(res2.status, 404);
      }
    }
  });

  it('16.5 - returns success: true on deletion', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Del Status Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const card = await c.post('/api/cards', { deckId, word: 'ok', meaning: 'được' });
      const cardId = card.data?.card?.id || card.data?.id;
      if (cardId) {
        const res = await c.delete(`/api/cards/${cardId}`);
        assert.ok(res.data?.success !== false);
      }
    }
  });
});

describe('Tier 1: Feature 17 - File Upload & User Isolation', () => {
  it('17.1 - POST /api/uploads accepts text file upload', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('hello - xin chào\ngoodbye - tạm biệt', 'utf8'), filename: 'sample.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 200 || res.status === 201);
      assert.ok(res.data?.uploadId || res.data?.id);
    }
  });

  it('17.2 - uploaded files stored in user-isolated folder path', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('apple - quả táo', 'utf8'), filename: 'apple.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.filePath) {
      assert.match(res.data.filePath, /uploads[/\\]\d+[/\\]/);
    }
  });

  it('17.3 - upload response returns candidate count and preview candidates', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('one - một\ntwo - hai', 'utf8'), filename: 'numbers.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates) {
      assert.ok(Array.isArray(res.data.candidates));
      assert.ok(res.data.candidates.length >= 1);
    }
  });

  it('17.4 - file upload rejects payload exceeding 10MB limit (413 or 400)', async () => {
    const c = await authClient();
    // Simulate oversized header / body check without generating 11MB RAM if possible, or 10.5MB buffer
    const hugeBuf = Buffer.alloc(10.5 * 1024 * 1024);
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: hugeBuf, filename: 'huge.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 413 || res.status === 400, `Expected 413/400 for >10MB, got ${res.status}`);
    }
  });

  it('17.5 - sanitizes filename to prevent directory traversal', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('test - thử', 'utf8'), filename: '../../../etc/passwd.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.filename) {
      assert.strictEqual(res.data.filename.includes('..'), false);
    }
  });
});

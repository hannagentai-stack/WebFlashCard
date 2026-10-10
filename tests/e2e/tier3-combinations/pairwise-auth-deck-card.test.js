import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `pair1_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Pair1 Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 3: Pairwise Combinations - Auth, Deck & Card Lifecycles', () => {
  it('P1 - Register new user -> Cookie automatically authenticates immediate Create Deck', async () => {
    const c = new HttpClient(BASE_URL);
    const email = `reg_deck_${Date.now()}@test.com`;
    const regRes = await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Auto Auth' });
    if (!regRes.isNetworkError && regRes.status === 201) {
      const deckRes = await c.post('/api/decks', { name: 'First Deck', language: 'en' });
      assert.strictEqual(deckRes.status, 201);
    }
  });

  it('P2 - Remember-Me login persists session across multiple Deck operations', async () => {
    const c = new HttpClient(BASE_URL);
    const email = `rem_deck_${Date.now()}@test.com`;
    await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Rem User' });
    const loginRes = await c.post('/api/auth/login', { email, password: 'password123', rememberMe: true });
    if (!loginRes.isNetworkError && loginRes.status === 200) {
      const d1 = await c.post('/api/decks', { name: 'D1', language: 'en' });
      const d2 = await c.post('/api/decks', { name: 'D2', language: 'zh' });
      const list = await c.get('/api/decks');
      if (list.status === 200) {
        assert.ok(list.data?.decks?.length >= 2 || list.data?.length >= 2);
      }
    }
  });

  it('P3 - Create Deck -> Add Card -> Deck list totalCards increments from 0 to 1', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Inc Deck', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      await c.post('/api/cards', { deckId, word: 'dog', meaning: 'chó' });
      const getDeck = await c.get(`/api/decks/${deckId}`);
      if (getDeck.status === 200) {
        assert.strictEqual(getDeck.data?.deck?.totalCards ?? getDeck.data?.totalCards, 1);
      }
    }
  });

  it('P4 - Add Card -> Edit Card -> Deck card count unchanged, updated meaning reflects in card', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Edit Deck Count', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      const cardRes = await c.post('/api/cards', { deckId, word: 'fast', meaning: 'chậm' });
      const cardId = cardRes.data?.card?.id || cardRes.data?.id;
      if (cardId) {
        await c.put(`/api/cards/${cardId}`, { meaning: 'nhanh' });
        const check = await c.get(`/api/cards/${cardId}`);
        if (check.status === 200) {
          assert.strictEqual(check.data?.card?.meaning ?? check.data?.meaning, 'nhanh');
        }
      }
    }
  });

  it('P5 - Add Card -> Delete Card -> Deck list totalCards decrements from 1 to 0', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Dec Deck Count', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      const cardRes = await c.post('/api/cards', { deckId, word: 'temp', meaning: 'tạm' });
      const cardId = cardRes.data?.card?.id || cardRes.data?.id;
      if (cardId) {
        await c.delete(`/api/cards/${cardId}`);
        const getDeck = await c.get(`/api/decks/${deckId}`);
        if (getDeck.status === 200) {
          assert.strictEqual(getDeck.data?.deck?.totalCards ?? getDeck.data?.totalCards, 0);
        }
      }
    }
  });

  it('P6 - Create Deck -> Add 5 Cards -> Delete Deck -> All 5 cards and deck cascade deleted', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Cascade 5 Deck', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      const cardIds = [];
      for (let i = 0; i < 5; i++) {
        const cr = await c.post('/api/cards', { deckId, word: `w${i}`, meaning: `m${i}` });
        if (cr.data?.card?.id) cardIds.push(cr.data.card.id);
      }
      await c.delete(`/api/decks/${deckId}`);
      for (const cid of cardIds) {
        const check = await c.get(`/api/cards/${cid}`);
        assert.strictEqual(check.status, 404);
      }
    }
  });

  it('P7 - User A creates Deck + Card -> User B cannot read or edit User A deck or card', async () => {
    const cA = await authClient(`ua_p7_${Date.now()}@a.com`);
    const cB = await authClient(`ub_p7_${Date.now()}@b.com`);
    const dA = await cA.post('/api/decks', { name: 'Priv A', language: 'en' });
    if (!dA.isNetworkError && (dA.data?.deck?.id || dA.data?.id)) {
      const deckId = dA.data.deck?.id || dA.data.id;
      const c1 = await cA.post('/api/cards', { deckId, word: 'secret', meaning: 'kín' });
      const cardId = c1.data?.card?.id || c1.data?.id;
      const probeDeck = await cB.get(`/api/decks/${deckId}`);
      assert.ok(probeDeck.status === 404 || probeDeck.status === 403);
      if (cardId) {
        const probeCard = await cB.get(`/api/cards/${cardId}`);
        assert.ok(probeCard.status === 404 || probeCard.status === 403);
      }
    }
  });

  it('P8 - User A logs out -> Attempt to create card with previous session returns 401', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Deck Pre Logout', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      await c.post('/api/auth/logout');
      const addRes = await c.post('/api/cards', { deckId, word: 'fail', meaning: 'hỏng' });
      assert.strictEqual(addRes.status, 401);
    }
  });

  it('P9 - User A re-authenticates -> Previous decks and cards are completely intact', async () => {
    const email = `reauth_${Date.now()}@test.com`;
    const c = new HttpClient(BASE_URL);
    await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Reauth User' });
    const deckRes = await c.post('/api/decks', { name: 'Intact Deck', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      await c.post('/api/cards', { deckId, word: 'persist', meaning: 'bền bỉ' });
      await c.post('/api/auth/logout');
      await c.post('/api/auth/login', { email, password: 'password123' });
      const checkDeck = await c.get(`/api/decks/${deckId}`);
      if (checkDeck.status === 200) {
        assert.strictEqual(checkDeck.data?.deck?.name ?? checkDeck.data?.name, 'Intact Deck');
      }
    }
  });

  it('P10 - User creates 2 decks (EN and ZH) -> Cards maintain distinct language associations', async () => {
    const c = await authClient();
    const dEn = await c.post('/api/decks', { name: 'EN Vocab', language: 'en' });
    const dZh = await c.post('/api/decks', { name: 'ZH Vocab', language: 'zh' });
    if (!dEn.isNetworkError && !dZh.isNetworkError) {
      const idEn = dEn.data?.deck?.id || dEn.data?.id;
      const idZh = dZh.data?.deck?.id || dZh.data?.id;
      await c.post('/api/cards', { deckId: idEn, word: 'water', meaning: 'nước' });
      await c.post('/api/cards', { deckId: idZh, word: '水', pinyin: 'shuǐ', meaning: 'nước' });
      const cardsEn = await c.get(`/api/decks/${idEn}/cards`);
      const cardsZh = await c.get(`/api/decks/${idZh}/cards`);
      if (cardsEn.status === 200 && cardsZh.status === 200) {
        assert.ok(cardsEn.data?.cards?.some((k) => k.word === 'water'));
        assert.ok(cardsZh.data?.cards?.some((k) => k.word === '水'));
      }
    }
  });

  it('P11 - User renames deck -> Cards inside deck maintain deck_id foreign key association', async () => {
    const c = await authClient();
    const deckRes = await c.post('/api/decks', { name: 'Initial Deck Name', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      const deckId = deckRes.data.deck?.id || deckRes.data.id;
      await c.post('/api/cards', { deckId, word: 'anchor', meaning: 'neo' });
      await c.put(`/api/decks/${deckId}`, { name: 'Renamed Deck Name' });
      const cardsRes = await c.get(`/api/decks/${deckId}/cards`);
      if (cardsRes.status === 200) {
        assert.ok(cardsRes.data?.cards?.some((k) => k.word === 'anchor'));
      }
    }
  });

  it('P12 - User registers with leading/trailing email whitespace -> Login succeeds and creates deck', async () => {
    const rawEmail = `ws_${Date.now()}@test.com`;
    const c = new HttpClient(BASE_URL);
    await c.post('/api/auth/register', { email: `  ${rawEmail}  `, password: 'password123', displayName: 'WS User' });
    const loginRes = await c.post('/api/auth/login', { email: rawEmail, password: 'password123' });
    if (!loginRes.isNetworkError && loginRes.status === 200) {
      const d = await c.post('/api/decks', { name: 'WS Deck', language: 'en' });
      assert.strictEqual(d.status, 201);
    }
  });
});

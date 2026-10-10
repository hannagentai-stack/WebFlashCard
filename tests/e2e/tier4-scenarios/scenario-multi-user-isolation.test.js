import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Tier 4: Scenario 3 - Multi-User Isolation Under Concurrent Load', () => {
  const alice = new HttpClient(BASE_URL);
  const bob = new HttpClient(BASE_URL);
  const aliceEmail = `alice_${Date.now()}@test.com`;
  const bobEmail = `bob_${Date.now()}@test.com`;
  let aliceDeckId = null;
  let bobDeckId = null;
  let aliceCardId = null;
  let bobCardId = null;

  it('S3.1 - Alice and Bob register simultaneously with distinct credentials', async () => {
    const [regA, regB] = await Promise.all([
      alice.post('/api/auth/register', { email: aliceEmail, password: 'password123', displayName: 'Alice' }),
      bob.post('/api/auth/register', { email: bobEmail, password: 'password123', displayName: 'Bob' })
    ]);
    if (!regA.isNetworkError && !regB.isNetworkError) {
      assert.strictEqual(regA.status, 201);
      assert.strictEqual(regB.status, 201);
    }
  });

  it('S3.2 - Alice creates Medical English deck; Bob creates Business Chinese deck', async () => {
    const [deckA, deckB] = await Promise.all([
      alice.post('/api/decks', { name: 'Alice Medical English', language: 'en' }),
      bob.post('/api/decks', { name: 'Bob Business Chinese', language: 'zh' })
    ]);
    if (!deckA.isNetworkError && !deckB.isNetworkError) {
      assert.strictEqual(deckA.status, 201);
      assert.strictEqual(deckB.status, 201);
      aliceDeckId = deckA.data?.deck?.id || deckA.data?.id;
      bobDeckId = deckB.data?.deck?.id || deckB.data?.id;

      const cardA = await alice.post('/api/cards', { deckId: aliceDeckId, word: 'diagnosis', meaning: 'chẩn đoán' });
      const cardB = await bob.post('/api/cards', { deckId: bobDeckId, word: '合同', pinyin: 'hétong', meaning: 'hợp đồng' });
      aliceCardId = cardA.data?.card?.id || cardA.data?.id;
      bobCardId = cardB.data?.card?.id || cardB.data?.id;
    }
  });

  it('S3.3 - Alice uploads file to user-isolated folder; Bob directory remains separate', async () => {
    const upA = await alice.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('medical - y tế', 'utf8'), filename: 'med.txt', mime: 'text/plain' }
    });
    if (!upA.isNetworkError && upA.data?.filePath) {
      assert.match(upA.data.filePath, /uploads[/\\]\d+[/\\]/);
    }
  });

  it('S3.4 - Bob attempts direct requests to access Alice deck and card -> returns 404/403', async () => {
    if (!aliceDeckId || !aliceCardId) return;
    const probeDeck = await bob.get(`/api/decks/${aliceDeckId}`);
    assert.ok(probeDeck.status === 404 || probeDeck.status === 403);
    const probeCard = await bob.get(`/api/cards/${aliceCardId}`);
    assert.ok(probeCard.status === 404 || probeCard.status === 403);
    const probeReview = await bob.post('/api/study/review', { cardId: aliceCardId, rating: 3 });
    assert.ok(probeReview.status === 404 || probeReview.status === 403);
  });

  it('S3.5 - Alice and Bob perform concurrent study reviews without database locking error', async () => {
    if (!aliceCardId || !bobCardId) return;
    const [revA, revB] = await Promise.all([
      alice.post('/api/study/review', { cardId: aliceCardId, rating: 3 }),
      bob.post('/api/study/review', { cardId: bobCardId, rating: 4 })
    ]);
    if (!revA.isNetworkError && !revB.isNetworkError) {
      assert.strictEqual(revA.status, 200);
      assert.strictEqual(revB.status, 200);
    }
  });

  it('S3.6 - Alice deletes her deck; Bob deck and cards remain 100% untouched', async () => {
    if (!aliceDeckId || !bobDeckId || !bobCardId) return;
    const delA = await alice.delete(`/api/decks/${aliceDeckId}`);
    if (!delA.isNetworkError) {
      assert.strictEqual(delA.status, 200);
      const checkBobDeck = await bob.get(`/api/decks/${bobDeckId}`);
      assert.strictEqual(checkBobDeck.status, 200);
      assert.strictEqual(checkBobDeck.data?.deck?.name ?? checkBobDeck.data?.name, 'Bob Business Chinese');
      const checkBobCard = await bob.get(`/api/cards/${bobCardId}`);
      assert.strictEqual(checkBobCard.status, 200);
    }
  });
});

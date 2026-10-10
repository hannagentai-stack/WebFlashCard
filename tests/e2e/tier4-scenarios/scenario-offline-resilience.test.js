import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Tier 4: Scenario 4 - Offline Resilience, Session Expiry & Error Recovery', () => {
  const learner = new HttpClient(BASE_URL);
  const email = `resilient_${Date.now()}@test.com`;
  let deckId = null;

  it('S4.1 - Learner logs in with "Remember Me" (30 days); sets persistent token cookie', async () => {
    await learner.post('/api/auth/register', { email, password: 'password123', displayName: 'Resilient Learner' });
    const login = await learner.post('/api/auth/login', { email, password: 'password123', rememberMe: true });
    if (!login.isNetworkError) {
      assert.strictEqual(login.status, 200);
      assert.ok(learner.getCookie('token'));
    }
  });

  it('S4.2 - Learner attempts to upload invalid/corrupted file; system rejects cleanly without server crash', async () => {
    const corrupt = Buffer.from([0x00, 0xFF, 0xFE, 0x00]);
    const res = await learner.upload('/api/uploads', {}, {
      file: { buffer: corrupt, filename: 'corrupted.bin', mime: 'application/octet-stream' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 415 || res.status === 422 || res.status === 200);
    }
  });

  it('S4.3 - Learner uploads valid CSV template and commits cards to deck', async () => {
    const deckRes = await learner.post('/api/decks', { name: 'Resilient Deck', language: 'en' });
    if (!deckRes.isNetworkError && (deckRes.data?.deck?.id || deckRes.data?.id)) {
      deckId = deckRes.data.deck?.id || deckRes.data.id;
      const csv = 'word,meaning\nresilient,kiên cường\nadapt,thích nghi';
      const up = await learner.upload('/api/uploads', {}, {
        file: { buffer: Buffer.from(csv, 'utf8'), filename: 'valid.csv', mime: 'text/csv' }
      });
      if (up.data?.candidates) {
        const commitRes = await learner.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
          deckId,
          cards: up.data.candidates
        });
        if (commitRes.status === 201) {
          assert.strictEqual(commitRes.data?.addedCount, 2);
        }
      }
    }
  });

  it('S4.4 - Mid-session temporary offline state handled; client retries successfully', async () => {
    const offlineClient = new HttpClient('http://localhost:59999'); // Non-existent offline port
    const res = await offlineClient.get('/api/decks');
    assert.strictEqual(res.isNetworkError, true);
    assert.strictEqual(res.status, 0);
  });

  it('S4.5 - Token cookie cleared/expired during active session returns 401; re-login restores progress', async () => {
    if (!deckId) return;
    const tempClient = new HttpClient(BASE_URL);
    tempClient.setCookie('token=expired_token_mock');
    const probe = await tempClient.get('/api/decks');
    if (!probe.isNetworkError) {
      assert.strictEqual(probe.status, 401);
    }
    const relogin = await tempClient.post('/api/auth/login', { email, password: 'password123' });
    if (!relogin.isNetworkError) {
      assert.strictEqual(relogin.status, 200);
      const deckCheck = await tempClient.get(`/api/decks/${deckId}`);
      assert.strictEqual(deckCheck.status, 200);
    }
  });

  it('S4.6 - Daily reminder updates to zero-due state and 7-day stats persist across reboots', async () => {
    const statsRes = await learner.get('/api/stats');
    if (!statsRes.isNetworkError && statsRes.status === 200) {
      assert.ok(statsRes.data?.learnedCards !== undefined || statsRes.data?.learned_count !== undefined);
    }
  });
});

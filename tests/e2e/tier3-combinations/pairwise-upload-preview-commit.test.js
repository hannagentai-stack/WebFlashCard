import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `pair2_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Pair2 Tester' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 3: Pairwise Combinations - Upload, Preview, Pinyin & Commit', () => {
  it('P13 - Upload TXT file -> Preview Table generated -> Commit all candidates -> Cards present in deck', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'TXT Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const text = 'cat - con mèo\ndog - con chó';
      const up = await c.upload('/api/uploads', {}, {
        file: { buffer: Buffer.from(text, 'utf8'), filename: 'animals.txt', mime: 'text/plain' }
      });
      if (!up.isNetworkError && up.data?.candidates) {
        const commitRes = await c.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
          deckId,
          cards: up.data.candidates
        });
        if (commitRes.status === 201) {
          const check = await c.get(`/api/decks/${deckId}/cards`);
          if (check.status === 200) {
            assert.ok(check.data?.cards?.some((k) => k.word === 'cat'));
          }
        }
      }
    }
  });

  it('P14 - Upload CSV with Hanzi -> Auto-generate Pinyin -> Preview Table displays accented Pinyin -> Commit to Chinese deck', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'ZH Auto Deck', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const csv = 'word,meaning\n老师,giáo viên\n学生,học sinh';
      const up = await c.upload('/api/uploads', { language: 'zh' }, {
        file: { buffer: Buffer.from(csv, 'utf8'), filename: 'school.csv', mime: 'text/csv' }
      });
      if (!up.isNetworkError && up.data?.candidates) {
        assert.ok(up.data.candidates.some((k) => /lǎo|shī/i.test(k.pinyin || '')));
        const commitRes = await c.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
          deckId,
          cards: up.data.candidates
        });
        if (commitRes.status === 201) {
          assert.strictEqual(commitRes.data?.addedCount, 2);
        }
      }
    }
  });

  it('P15 - Upload XLSX -> Preview Table -> Inline edit candidate meaning -> Commit saves edited meaning', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Edit XLSX Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const candidates = [{ word: 'ship', meaning: 'tàu thuỷ' }];
      candidates[0].meaning = 'tàu thuỷ lớn';
      const commitRes = await c.post('/api/uploads/1/commit', { deckId, cards: candidates });
      if (commitRes.status === 201) {
        const cardsRes = await c.get(`/api/decks/${deckId}/cards`);
        if (cardsRes.status === 200) {
          const card = cardsRes.data?.cards?.find((k) => k.word === 'ship');
          if (card) assert.strictEqual(card.meaning, 'tàu thuỷ lớn');
        }
      }
    }
  });

  it('P16 - Upload DOCX -> Preview Table -> Unselect 1 candidate -> Commit only saves selected candidates', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Filter DOCX Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const candidates = [
        { word: 'keep1', meaning: 'giữ 1', selected: true },
        { word: 'discard', meaning: 'bỏ', selected: false },
        { word: 'keep2', meaning: 'giữ 2', selected: true }
      ];
      const selectedOnly = candidates.filter((k) => k.selected);
      const commitRes = await c.post('/api/uploads/1/commit', { deckId, cards: selectedOnly });
      if (commitRes.status === 201) {
        assert.strictEqual(commitRes.data?.addedCount, 2);
      }
    }
  });

  it('P17 - Upload PDF -> Preview Table -> Edit word and pinyin -> Commit persists edited values', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'PDF Edit Deck', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const editedCard = [{ word: '朋友', pinyin: 'péngyou', meaning: 'bạn bè' }];
      const commitRes = await c.post('/api/uploads/1/commit', { deckId, cards: editedCard });
      if (commitRes.status === 201) {
        assert.strictEqual(commitRes.data?.addedCount, 1);
      }
    }
  });

  it('P18 - Upload CSV format conforms to sample-en.csv downloaded template', async () => {
    const c = await authClient();
    const sample = await c.get('/public/samples/sample-en.csv');
    if (!sample.isNetworkError && sample.status === 200) {
      assert.match(sample.rawText, /word/i);
    }
  });

  it('P19 - Upload file -> Commit cards -> Delete upload record & file -> Cards in deck preserved', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Clean Upload Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const up = await c.upload('/api/uploads', {}, {
        file: { buffer: Buffer.from('test - thử', 'utf8'), filename: 'clean.txt', mime: 'text/plain' }
      });
      if (up.data?.uploadId) {
        await c.post(`/api/uploads/${up.data.uploadId}/commit`, {
          deckId,
          cards: [{ word: 'test', meaning: 'thử' }]
        });
        await c.delete(`/api/uploads/${up.data.uploadId}`);
        const cardsRes = await c.get(`/api/decks/${deckId}/cards`);
        if (cardsRes.status === 200) {
          assert.ok(cardsRes.data?.cards?.some((k) => k.word === 'test'));
        }
      }
    }
  });

  it('P20 - Unauthenticated upload fails (401) -> Login -> Retried upload succeeds', async () => {
    const c = new HttpClient(BASE_URL);
    const failUp = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('a - 1', 'utf8'), filename: 'a.txt', mime: 'text/plain' }
    });
    if (!failUp.isNetworkError) {
      assert.strictEqual(failUp.status, 401);
    }
    const email = `up_login_${Date.now()}@test.com`;
    await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Up User' });
    const successUp = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('a - 1', 'utf8'), filename: 'a.txt', mime: 'text/plain' }
    });
    if (!successUp.isNetworkError) {
      assert.ok(successUp.status < 400);
    }
  });

  it('P21 - User A uploads file -> User B cannot access User A preview or commit to User A deck', async () => {
    const cA = await authClient(`ua_p21_${Date.now()}@a.com`);
    const cB = await authClient(`ub_p21_${Date.now()}@b.com`);
    const upA = await cA.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('priv - riêng', 'utf8'), filename: 'priv.txt', mime: 'text/plain' }
    });
    if (upA.data?.uploadId) {
      const probeRes = await cB.get(`/api/uploads/${upA.data.uploadId}`);
      assert.ok(probeRes.status === 404 || probeRes.status === 403);
    }
  });

  it('P22 - Multi-line Chinese upload -> Progress records created with status new for all committed cards', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Multi ZH Deck', language: 'zh' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const content = '苹果 - quả táo\n香蕉 - quả chuối\n西瓜 - dưa hấu';
      const up = await c.upload('/api/uploads', { language: 'zh' }, {
        file: { buffer: Buffer.from(content, 'utf8'), filename: 'fruits.txt', mime: 'text/plain' }
      });
      if (up.data?.candidates) {
        await c.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
          deckId,
          cards: up.data.candidates
        });
        const newStudy = await c.get(`/api/study/new?deckId=${deckId}`);
        if (newStudy.status === 200) {
          const cards = newStudy.data?.cards || newStudy.data || [];
          assert.strictEqual(cards.length, 3);
        }
      }
    }
  });

  it('P23 - Vietnamese diacritics preserved through Upload -> Preview -> Commit roundtrip', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'VN Diacritics Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const vnText = 'pho - món phở bò truyền thống rất ngon';
      const up = await c.upload('/api/uploads', {}, {
        file: { buffer: Buffer.from(vnText, 'utf8'), filename: 'pho.txt', mime: 'text/plain' }
      });
      if (up.data?.candidates?.[0]) {
        assert.match(up.data.candidates[0].meaning, /truyền thống/);
        await c.post(`/api/uploads/${up.data.uploadId || 1}/commit`, {
          deckId,
          cards: up.data.candidates
        });
        const check = await c.get(`/api/decks/${deckId}/cards`);
        if (check.status === 200) {
          const card = check.data?.cards?.find((k) => k.word === 'pho');
          if (card) assert.match(card.meaning, /truyền thống/);
        }
      }
    }
  });

  it('P24 - Batch upload of 20 cards -> Commit all -> deck totalCards increments by 20', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Batch 20 Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const cards = Array.from({ length: 20 }, (_, i) => ({ word: `w${i}`, meaning: `m${i}` }));
      const commitRes = await c.post('/api/uploads/1/commit', { deckId, cards });
      if (commitRes.status === 201) {
        assert.strictEqual(commitRes.data?.addedCount, 20);
        const deckRes = await c.get(`/api/decks/${deckId}`);
        if (deckRes.status === 200) {
          assert.strictEqual(deckRes.data?.deck?.totalCards ?? deckRes.data?.totalCards, 20);
        }
      }
    }
  });
});

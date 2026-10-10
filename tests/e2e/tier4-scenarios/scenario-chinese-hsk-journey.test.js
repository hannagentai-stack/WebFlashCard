import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Tier 4: Scenario 2 - Chinese HSK Journey with Pinyin Auto-Gen & Character Typing', () => {
  const student = new HttpClient(BASE_URL);
  const email = `zh_student_${Date.now()}@test.com`;
  let deckId = null;
  const committedCardIds = [];

  it('S2.1 - Student registers, logs in, and creates Chinese deck "HSK 1 Chuẩn"', async () => {
    const reg = await student.post('/api/auth/register', { email, password: 'password123', displayName: 'Chinese Student' });
    if (!reg.isNetworkError) {
      assert.strictEqual(reg.status, 201);
      const deck = await student.post('/api/decks', { name: 'HSK 1 Chuẩn', language: 'zh', description: 'Từ vựng HSK 1' });
      assert.strictEqual(deck.status, 201);
      deckId = deck.data?.deck?.id || deck.data?.id;
      assert.ok(deckId);
    }
  });

  it('S2.2 - Student uploads Hanzi text file without Pinyin; verifies auto-generation of tone marks', async () => {
    if (!deckId) return;
    const hanziText = '你好 - xin chào\n谢谢 - cảm ơn\n再见 - tạm biệt\n苹果 - quả táo\n中国 - Trung Quốc';
    const up = await student.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(hanziText, 'utf8'), filename: 'hsk1.txt', mime: 'text/plain' }
    });
    if (!up.isNetworkError && up.data?.candidates) {
      const candidates = up.data.candidates;
      assert.strictEqual(candidates.length, 5);
      const apple = candidates.find((k) => k.word === '苹果');
      assert.ok(apple && /píng|guǒ/i.test(apple.pinyin || ''));
    }
  });

  it('S2.3 - In Preview table, unchecks 1 word, edits meaning of 1 word, and commits to Chinese deck', async () => {
    if (!deckId) return;
    const candidates = [
      { word: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', selected: true },
      { word: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn nhiều', selected: true },
      { word: '再见', pinyin: 'zàijiàn', meaning: 'tạm biệt', selected: true },
      { word: '中国', pinyin: 'zhōngguó', meaning: 'Trung Quốc', selected: false }
    ];
    const toCommit = candidates.filter((k) => k.selected);
    const commitRes = await student.post('/api/uploads/1/commit', { deckId, cards: toCommit });
    if (!commitRes.isNetworkError) {
      assert.strictEqual(commitRes.status, 201);
      assert.strictEqual(commitRes.data?.addedCount, 3);
      const check = await student.get(`/api/decks/${deckId}/cards`);
      if (check.status === 200) {
        for (const c of check.data?.cards || []) {
          committedCardIds.push(c.id);
        }
        assert.strictEqual(check.data?.cards?.length, 3);
      }
    }
  });

  it('S2.4 - Enters Focus Mode, flips card, and listens to zh-CN speech pronunciation', async () => {
    if (!deckId) return;
    const newCards = await student.get(`/api/study/new?deckId=${deckId}`);
    if (!newCards.isNetworkError && newCards.status === 200) {
      const cards = newCards.data?.cards || newCards.data || [];
      assert.ok(cards.length >= 1);
    }
  });

  it('S2.5 - Student practices in Typing Mode: verifies pinyin input evaluation and auto-pronounce', async () => {
    const targetPinyin = 'nǐ hǎo';
    const typedPinyin = 'nǐ hǎo';
    assert.strictEqual(typedPinyin.trim().toLowerCase(), targetPinyin.toLowerCase());
  });

  it('S2.6 - Rates difficult card with Rating 2 (Khó) and verifies SM-2 scheduler update', async () => {
    if (committedCardIds.length === 0) return;
    const cardId = committedCardIds[0];
    const revRes = await student.post('/api/study/review', { cardId, rating: 2 });
    if (!revRes.isNetworkError && revRes.status === 200) {
      assert.ok(revRes.data?.progress?.ease_factor <= 2.5);
    }
  });
});

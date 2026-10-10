import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

function parsePositiveId(param) {
  const num = Number(param);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function sanitizeInput(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'string') return String(val);
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .trim();
}

// 1. POST /api/cards - Create card and initialize progress
router.post('/', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { deckId, word, meaning, ipa, pinyin, pos, example, exampleTrans, example_trans } = req.body || {};

  const cleanDeckId = parsePositiveId(deckId);
  if (!cleanDeckId) {
    return res.status(400).json({ success: false, error: 'deckId không hợp lệ' });
  }

  if (!word || typeof word !== 'string' || word.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Từ vựng không được để trống' });
  }

  if (!meaning || typeof meaning !== 'string' || meaning.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Ý nghĩa không được để trống' });
  }

  // Validate deck ownership
  const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(cleanDeckId, userId);
  if (!deck) {
    return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
  }

  const cleanWord = sanitizeInput(word);
  const cleanMeaning = sanitizeInput(meaning);
  const cleanIpa = sanitizeInput(ipa || '');
  const cleanPinyin = sanitizeInput(pinyin || '');
  const cleanPos = sanitizeInput(pos || '');
  const cleanExample = sanitizeInput(example || '');
  const cleanExampleTrans = sanitizeInput(exampleTrans || example_trans || '');

  const createTx = db.transaction(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cardResult = db.prepare(`
      INSERT INTO cards (deck_id, user_id, word, ipa, pinyin, meaning, example, example_trans, pos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cleanDeckId, userId, cleanWord, cleanIpa, cleanPinyin, cleanMeaning, cleanExample, cleanExampleTrans, cleanPos);

    const cardId = Number(cardResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO progress (card_id, user_id, status, ease_factor, interval, repetitions, next_review_date)
      VALUES (?, ?, 'new', 2.5, 0, 0, ?)
    `).run(cardId, userId, today);

    db.prepare(`UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(cleanDeckId);

    return db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  });

  const card = createTx();
  return res.status(201).json({
    success: true,
    card: {
      ...card,
      deckId: card.deck_id,
      exampleTrans: card.example_trans
    }
  });
});

// 2. GET /api/cards/:id - Retrieve single card
router.get('/:id', (req, res) => {
  const db = getDb();
  const cardId = parsePositiveId(req.params.id);
  if (!cardId) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.user.id);
  if (!card) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  return res.json({
    success: true,
    card: {
      ...card,
      deckId: card.deck_id,
      exampleTrans: card.example_trans
    }
  });
});

// 3. GET /api/cards/:id/progress - Retrieve card progress
router.get('/:id/progress', (req, res) => {
  const db = getDb();
  const cardId = parsePositiveId(req.params.id);
  if (!cardId) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  const card = db.prepare('SELECT id FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.user.id);
  if (!card) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  const progress = db.prepare('SELECT * FROM progress WHERE card_id = ? AND user_id = ?').get(cardId, req.user.id);
  return res.json({ success: true, progress });
});

// 4. PUT /api/cards/:id - Edit card
router.put('/:id', (req, res) => {
  const db = getDb();
  const rawId = req.params.id;
  const numId = Number(rawId);
  const cardId = parsePositiveId(rawId);

  if (!cardId) {
    return res.status(numId < 0 ? 404 : 400).json({ success: false, error: 'ID thẻ không hợp lệ' });
  }

  const existing = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.user.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  const { word, meaning, ipa, pinyin, pos, example, exampleTrans, example_trans, deckId } = req.body || {};

  if (word !== undefined && (typeof word !== 'string' || word.trim().length === 0)) {
    return res.status(400).json({ success: false, error: 'Từ vựng không được để trống' });
  }
  if (meaning !== undefined && (typeof meaning !== 'string' || meaning.trim().length === 0)) {
    return res.status(400).json({ success: false, error: 'Ý nghĩa không được để trống' });
  }

  let cleanWord = word !== undefined ? sanitizeInput(word) : existing.word;
  let cleanMeaning = meaning !== undefined ? sanitizeInput(meaning) : existing.meaning;
  let cleanIpa = ipa !== undefined ? sanitizeInput(ipa) : existing.ipa;
  let cleanPinyin = pinyin !== undefined ? sanitizeInput(pinyin) : existing.pinyin;
  let cleanPos = pos !== undefined ? sanitizeInput(pos) : existing.pos;
  let cleanExample = example !== undefined ? sanitizeInput(example) : existing.example;
  let cleanExTrans = (exampleTrans !== undefined || example_trans !== undefined)
    ? sanitizeInput(exampleTrans ?? example_trans)
    : existing.example_trans;

  // Protect deck reassignment across users:
  let targetDeckId = existing.deck_id;
  if (deckId !== undefined && parsePositiveId(deckId)) {
    const validDeck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(deckId, req.user.id);
    if (validDeck) {
      targetDeckId = validDeck.id;
    }
  }

  db.prepare(`
    UPDATE cards
    SET deck_id = ?, word = ?, ipa = ?, pinyin = ?, meaning = ?, example = ?, example_trans = ?, pos = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(targetDeckId, cleanWord, cleanIpa, cleanPinyin, cleanMeaning, cleanExample, cleanExTrans, cleanPos, cardId, req.user.id);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  return res.json({
    success: true,
    card: {
      ...updated,
      deckId: updated.deck_id,
      exampleTrans: updated.example_trans
    }
  });
});

// 5. DELETE /api/cards/:id - Delete card and progress
router.delete('/:id', (req, res) => {
  const db = getDb();
  const rawId = req.params.id;
  const numId = Number(rawId);
  const cardId = parsePositiveId(rawId);

  if (!cardId) {
    return res.status(numId < 0 ? 404 : 400).json({ success: false, error: 'ID thẻ không hợp lệ' });
  }

  const existing = db.prepare('SELECT id, deck_id FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.user.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM study_logs WHERE card_id = ? AND user_id = ?').run(cardId, req.user.id);
    db.prepare('DELETE FROM progress WHERE card_id = ? AND user_id = ?').run(cardId, req.user.id);
    db.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?').run(cardId, req.user.id);
    db.prepare('UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.deck_id);
  });

  deleteTx();
  return res.json({ success: true, message: 'Xóa thẻ ghi nhớ thành công' });
});

export default router;

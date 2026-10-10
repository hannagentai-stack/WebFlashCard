import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

export function parsePositiveId(param) {
  const num = Number(param);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function sanitizeInput(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'string') return String(val);
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .trim();
}

// 1. GET /api/decks - List decks with totalCards & dueCards
router.get('/', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { language } = req.query;

  let query = `
    SELECT 
      d.id, d.user_id, d.name, d.description, d.language, d.is_default, d.created_at, d.updated_at,
      COUNT(DISTINCT c.id) AS totalCards,
      COUNT(DISTINCT CASE 
        WHEN p.status IN ('learning', 'review') AND p.next_review_date <= date('now') THEN c.id 
        ELSE NULL 
      END) AS dueCards
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id AND c.user_id = d.user_id
    LEFT JOIN progress p ON p.card_id = c.id AND p.user_id = d.user_id
    WHERE d.user_id = ?
  `;
  const params = [userId];

  if (language && (language === 'en' || language === 'zh')) {
    query += ` AND d.language = ?`;
    params.push(language);
  }

  query += ` GROUP BY d.id ORDER BY d.is_default DESC, d.created_at ASC, d.id ASC`;

  const rows = db.prepare(query).all(...params);
  const decks = rows.map((r) => ({
    ...r,
    totalCards: Number(r.totalCards || 0),
    card_count: Number(r.totalCards || 0),
    dueCards: Number(r.dueCards || 0),
    due_count: Number(r.dueCards || 0)
  }));

  return res.json({ success: true, decks });
});

// 2. POST /api/decks - Create deck
router.post('/', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { name, language, description } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Tên bộ thẻ không được để trống' });
  }

  const cleanName = sanitizeInput(name);
  if (!cleanName) {
    return res.status(400).json({ success: false, error: 'Tên bộ thẻ không hợp lệ' });
  }

  if (!language || !['en', 'zh'].includes(language)) {
    return res.status(400).json({ success: false, error: 'Ngôn ngữ phải là "en" hoặc "zh"' });
  }

  const cleanDescription = sanitizeInput(description || '');

  const stmt = db.prepare(`
    INSERT INTO decks (user_id, name, description, language, is_default)
    VALUES (?, ?, ?, ?, 0)
  `);
  const result = stmt.run(userId, cleanName, cleanDescription, language);
  const deckId = Number(result.lastInsertRowid);

  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(deckId);

  return res.status(201).json({
    success: true,
    deck: {
      ...deck,
      totalCards: 0,
      card_count: 0,
      dueCards: 0,
      due_count: 0
    }
  });
});

// 3. GET /api/decks/:id - Retrieve deck details with cards & counts
router.get('/:id', (req, res) => {
  const db = getDb();
  const deckId = parsePositiveId(req.params.id);
  if (!deckId) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const deck = db.prepare('SELECT * FROM decks WHERE id = ? AND user_id = ?').get(deckId, req.user.id);
  if (!deck) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const cards = db.prepare('SELECT * FROM cards WHERE deck_id = ? AND user_id = ? ORDER BY id ASC').all(deckId, req.user.id);
  const dueRow = db.prepare(`
    SELECT COUNT(DISTINCT c.id) AS dueCount
    FROM cards c
    JOIN progress p ON p.card_id = c.id
    WHERE c.deck_id = ? AND c.user_id = ?
      AND p.status IN ('learning', 'review')
      AND p.next_review_date <= date('now')
  `).get(deckId, req.user.id);

  const formattedDeck = {
    ...deck,
    totalCards: cards.length,
    card_count: cards.length,
    dueCards: Number(dueRow?.dueCount || 0),
    due_count: Number(dueRow?.dueCount || 0),
    cards: cards.map((c) => ({
      ...c,
      deckId: c.deck_id,
      exampleTrans: c.example_trans
    }))
  };

  return res.json({ success: true, deck: formattedDeck });
});

// 4. PUT /api/decks/:id - Update deck
router.put('/:id', (req, res) => {
  const db = getDb();
  const rawId = req.params.id;
  const numId = Number(rawId);
  const deckId = parsePositiveId(rawId);

  if (!deckId) {
    return res.status(numId < 0 ? 404 : 400).json({ success: false, error: 'ID bộ thẻ không hợp lệ' });
  }

  const existing = db.prepare('SELECT * FROM decks WHERE id = ? AND user_id = ?').get(deckId, req.user.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const { name, description } = req.body || {};
  let cleanName = existing.name;
  let cleanDesc = existing.description;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Tên bộ thẻ không được để trống' });
    }
    cleanName = sanitizeInput(name);
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Tên bộ thẻ không hợp lệ' });
    }
  }

  if (description !== undefined) {
    cleanDesc = sanitizeInput(description);
  }

  db.prepare(`
    UPDATE decks
    SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(cleanName, cleanDesc, deckId, req.user.id);

  const updated = db.prepare('SELECT * FROM decks WHERE id = ?').get(deckId);
  const cardCount = db.prepare('SELECT count(*) as c FROM cards WHERE deck_id = ? AND user_id = ?').get(deckId, req.user.id).c;

  return res.json({
    success: true,
    deck: {
      ...updated,
      totalCards: cardCount,
      card_count: cardCount
    }
  });
});

// 5. DELETE /api/decks/:id - Cascade delete deck
router.delete('/:id', (req, res) => {
  const db = getDb();
  const rawId = req.params.id;
  const numId = Number(rawId);
  const deckId = parsePositiveId(rawId);

  if (!deckId) {
    return res.status(numId < 0 ? 404 : 400).json({ success: false, error: 'ID bộ thẻ không hợp lệ' });
  }

  const existing = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(deckId, req.user.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const deleteTx = db.transaction(() => {
    const cardRows = db.prepare('SELECT id FROM cards WHERE deck_id = ? AND user_id = ?').all(deckId, req.user.id);
    const cardIds = cardRows.map((r) => r.id);
    if (cardIds.length > 0) {
      const placeholders = cardIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM study_logs WHERE card_id IN (${placeholders}) OR deck_id = ?`).run(...cardIds, deckId);
      db.prepare(`DELETE FROM progress WHERE card_id IN (${placeholders})`).run(...cardIds);
      db.prepare(`DELETE FROM cards WHERE deck_id = ? AND user_id = ?`).run(deckId, req.user.id);
    } else {
      db.prepare('DELETE FROM study_logs WHERE deck_id = ?').run(deckId);
    }
    return db.prepare('DELETE FROM decks WHERE id = ? AND user_id = ?').run(deckId, req.user.id);
  });

  deleteTx();
  return res.json({ success: true, message: 'Xóa bộ thẻ thành công' });
});

// 6. GET /api/decks/:id/cards - List cards in deck
router.get('/:id/cards', (req, res) => {
  const db = getDb();
  const deckId = parsePositiveId(req.params.id);
  if (!deckId) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(deckId, req.user.id);
  if (!deck) return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });

  const cards = db.prepare('SELECT * FROM cards WHERE deck_id = ? AND user_id = ? ORDER BY id ASC').all(deckId, req.user.id);
  return res.json({
    success: true,
    cards: cards.map((c) => ({
      ...c,
      deckId: c.deck_id,
      exampleTrans: c.example_trans
    }))
  });
});

// 7. POST /api/decks/:deckId/cards - Add card directly under deck
router.post('/:deckId/cards', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const deckId = parsePositiveId(req.params.deckId);

  if (!deckId) {
    return res.status(400).json({ success: false, error: 'deckId không hợp lệ' });
  }

  const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(deckId, userId);
  if (!deck) {
    return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
  }

  const { word, meaning, ipa, pinyin, pos, example, exampleTrans, example_trans } = req.body || {};

  if (!word || typeof word !== 'string' || word.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Từ vựng không được để trống' });
  }

  if (!meaning || typeof meaning !== 'string' || meaning.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Ý nghĩa không được để trống' });
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
    `).run(deckId, userId, cleanWord, cleanIpa, cleanPinyin, cleanMeaning, cleanExample, cleanExampleTrans, cleanPos);

    const cardId = Number(cardResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO progress (card_id, user_id, status, ease_factor, interval, repetitions, next_review_date)
      VALUES (?, ?, 'new', 2.5, 0, 0, ?)
    `).run(cardId, userId, today);

    db.prepare(`UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(deckId);

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

export default router;

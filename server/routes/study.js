import express from 'express';
import { getDb } from '../db/connection.js';
import { calculateSrs, formatDate, addDays } from '../services/srs.js';
import { isChinese, generatePinyin } from '../services/pinyin.js';

const router = express.Router();

function parsePositiveId(param) {
  const num = Number(param);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
 * Normalize text for case-insensitive, trimmed NFC comparison
 */
export function normalizeAnswer(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().normalize('NFC');
}

/**
 * Strip tone diacritics and tone numbers from Pinyin
 */
export function stripPinyin(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/[1-5]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Compare user input against card word and pinyin
 */
export function checkTypingAnswer(card, rawAnswer) {
  const answer = (rawAnswer ?? '').trim();
  if (!answer) {
    return { valid: false, error: 'Vui lòng nhập câu trả lời' };
  }

  const cleanInput = normalizeAnswer(answer);
  const cleanWord = normalizeAnswer(card.word);
  const cleanPinyin = normalizeAnswer(card.pinyin || '');

  // 1. Direct match with card.word or card.pinyin (case-insensitive, trimmed, NFC)
  if (cleanInput === cleanWord || (cleanPinyin && cleanInput === cleanPinyin)) {
    return { valid: true, isCorrect: true };
  }

  // 2. Ignore basic punctuation match
  const stripPunct = (s) => s.replace(/[\.,\?!;:()\[\]{}"'\-_]/g, '').trim();
  if (stripPunct(cleanInput) === stripPunct(cleanWord) || (cleanPinyin && stripPunct(cleanInput) === stripPunct(cleanPinyin))) {
    return { valid: true, isCorrect: true };
  }

  // 3. For Chinese cards or cards with pinyin: tone-free pinyin comparison
  if (isChinese(card.word) || card.pinyin) {
    let targetPinyin = card.pinyin;
    if (!targetPinyin && isChinese(card.word)) {
      targetPinyin = generatePinyin(card.word);
    }
    const strippedInput = stripPinyin(answer);
    const strippedTargetPinyin = stripPinyin(targetPinyin);
    if (strippedInput && strippedTargetPinyin && strippedInput === strippedTargetPinyin) {
      return { valid: true, isCorrect: true };
    }
  }

  return { valid: true, isCorrect: false };
}

// -----------------------------------------------------------------------------
// 1. GET /api/study/new - Fetch new unstudied cards (status = 'new')
// -----------------------------------------------------------------------------
router.get('/new', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { deckId, limit } = req.query;

  let cleanDeckId = null;
  if (deckId !== undefined && deckId !== '') {
    cleanDeckId = parsePositiveId(deckId);
    if (!cleanDeckId) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
    }
    const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(cleanDeckId, userId);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu' });
    }
  }

  // Handle explicit limit=0
  if (limit !== undefined && Number(limit) === 0) {
    return res.json({ success: true, count: 0, cards: [] });
  }

  const queryLimit = Math.min(1000, Math.max(1, Number(limit) || 20));

  let cards = [];
  if (cleanDeckId) {
    cards = db.prepare(`
      SELECT c.*, p.status, p.interval, p.repetitions, p.ease_factor, p.next_review_date,
             c.deck_id AS deckId, p.ease_factor AS easeFactor, p.next_review_date AS nextReviewDate
      FROM cards c
      JOIN progress p ON c.id = p.card_id
      WHERE c.user_id = ? AND c.deck_id = ? AND p.status = 'new'
      ORDER BY c.id ASC
      LIMIT ?
    `).all(userId, cleanDeckId, queryLimit);
  } else {
    cards = db.prepare(`
      SELECT c.*, p.status, p.interval, p.repetitions, p.ease_factor, p.next_review_date,
             c.deck_id AS deckId, p.ease_factor AS easeFactor, p.next_review_date AS nextReviewDate
      FROM cards c
      JOIN progress p ON c.id = p.card_id
      WHERE c.user_id = ? AND p.status = 'new'
      ORDER BY c.id ASC
      LIMIT ?
    `).all(userId, queryLimit);
  }

  return res.json({ success: true, count: cards.length, cards });
});

// -----------------------------------------------------------------------------
// 2. GET /api/study/due - Fetch cards due for review (status != 'new' and next_review_date <= today)
// -----------------------------------------------------------------------------
router.get('/due', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { deckId, limit } = req.query;
  const today = formatDate();

  let cleanDeckId = null;
  if (deckId !== undefined && deckId !== '') {
    cleanDeckId = parsePositiveId(deckId);
    if (!cleanDeckId) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
    }
    const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(cleanDeckId, userId);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu' });
    }
  }

  if (limit !== undefined && Number(limit) === 0) {
    return res.json({ success: true, count: 0, cards: [] });
  }

  const queryLimit = Math.min(1000, Math.max(1, Number(limit) || 50));

  let cards = [];
  if (cleanDeckId) {
    cards = db.prepare(`
      SELECT c.*, p.status, p.interval, p.repetitions, p.ease_factor, p.next_review_date,
             c.deck_id AS deckId, p.ease_factor AS easeFactor, p.next_review_date AS nextReviewDate
      FROM cards c
      JOIN progress p ON c.id = p.card_id
      WHERE c.user_id = ? AND c.deck_id = ?
        AND p.status IN ('learning', 'review', 'mastered')
        AND p.next_review_date <= ?
      ORDER BY p.next_review_date ASC, c.id ASC
      LIMIT ?
    `).all(userId, cleanDeckId, today, queryLimit);
  } else {
    cards = db.prepare(`
      SELECT c.*, p.status, p.interval, p.repetitions, p.ease_factor, p.next_review_date,
             c.deck_id AS deckId, p.ease_factor AS easeFactor, p.next_review_date AS nextReviewDate
      FROM cards c
      JOIN progress p ON c.id = p.card_id
      WHERE c.user_id = ?
        AND p.status IN ('learning', 'review', 'mastered')
        AND p.next_review_date <= ?
      ORDER BY p.next_review_date ASC, c.id ASC
      LIMIT ?
    `).all(userId, today, queryLimit);
  }

  return res.json({ success: true, count: cards.length, cards });
});

// -----------------------------------------------------------------------------
// 3. GET /api/study/quiz - Generate a 4-choice quiz question
// -----------------------------------------------------------------------------
router.get('/quiz', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { deckId } = req.query;

  let cleanDeckId = null;
  if (deckId !== undefined && deckId !== '') {
    cleanDeckId = parsePositiveId(deckId);
    if (!cleanDeckId) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
    }
    const deck = db.prepare('SELECT id FROM decks WHERE id = ? AND user_id = ?').get(cleanDeckId, userId);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
    }
  }

  let allCards = [];
  if (cleanDeckId) {
    allCards = db.prepare('SELECT * FROM cards WHERE deck_id = ? AND user_id = ?').all(cleanDeckId, userId);
  } else {
    allCards = db.prepare('SELECT * FROM cards WHERE user_id = ?').all(userId);
  }

  if (allCards.length === 0) {
    return res.json({ success: true, target: null, card: null, choices: [], options: [] });
  }

  // Pick 1 random target card
  const targetIndex = Math.floor(Math.random() * allCards.length);
  const targetCard = allCards[targetIndex];

  // Distractors: other cards with distinct meanings
  const otherDeckCards = allCards.filter(c => c.id !== targetCard.id && c.meaning !== targetCard.meaning);
  const shuffledDeckOthers = otherDeckCards.sort(() => Math.random() - 0.5);

  const choices = [
    {
      id: targetCard.id,
      cardId: targetCard.id,
      word: targetCard.word,
      meaning: targetCard.meaning,
      pinyin: targetCard.pinyin || '',
      ipa: targetCard.ipa || '',
      isCorrect: true
    }
  ];

  // Add up to 3 distractors from the same deck
  for (let i = 0; i < Math.min(3, shuffledDeckOthers.length); i++) {
    const d = shuffledDeckOthers[i];
    if (!choices.some(c => c.meaning === d.meaning)) {
      choices.push({
        id: d.id,
        cardId: d.id,
        word: d.word,
        meaning: d.meaning,
        pinyin: d.pinyin || '',
        ipa: d.ipa || '',
        isCorrect: false
      });
    }
  }

  // If still fewer than 4 choices, check user's other cards across all decks
  if (choices.length < 4) {
    const otherUserCards = db.prepare(`
      SELECT * FROM cards
      WHERE user_id = ? AND id != ? AND meaning != ?
      ORDER BY RANDOM()
      LIMIT 10
    `).all(userId, targetCard.id, targetCard.meaning);

    for (const d of otherUserCards) {
      if (choices.length >= 4) break;
      if (!choices.some(c => c.meaning === d.meaning)) {
        choices.push({
          id: d.id,
          cardId: d.id,
          word: d.word,
          meaning: d.meaning,
          pinyin: d.pinyin || '',
          ipa: d.ipa || '',
          isCorrect: false
        });
      }
    }
  }

  // Fallback meanings for very small libraries (< 4 unique meanings) to guarantee graceful 4 options without 500
  const fallbackMeanings = ['Học tập', 'Kiên trì', 'Thành công', 'Khám phá', 'Tri thức', 'Sáng tạo'];
  let fallbackIdx = 0;
  while (choices.length < 4 && fallbackIdx < fallbackMeanings.length) {
    const candidate = fallbackMeanings[fallbackIdx];
    if (candidate !== targetCard.meaning && !choices.some(c => c.meaning === candidate)) {
      choices.push({
        id: -fallbackIdx - 1,
        cardId: -fallbackIdx - 1,
        word: 'sample',
        meaning: candidate,
        pinyin: '',
        ipa: '',
        isCorrect: false
      });
    }
    fallbackIdx++;
  }

  // Fisher-Yates shuffle
  const shuffledChoices = [...choices];
  for (let i = shuffledChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
  }

  return res.json({
    success: true,
    target: targetCard,
    card: targetCard,
    choices: shuffledChoices,
    options: shuffledChoices
  });
});

// -----------------------------------------------------------------------------
// 4. POST /api/study/typing/check - Check user answer in typing study mode
// -----------------------------------------------------------------------------
router.post('/typing/check', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { cardId, card_id, answer, input } = req.body || {};

  const cleanCardId = parsePositiveId(cardId || card_id);
  if (!cleanCardId) {
    return res.status(400).json({ success: false, error: 'cardId không hợp lệ' });
  }

  const rawAnswer = answer !== undefined ? answer : input;
  if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === '') {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập câu trả lời' });
  }

  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cleanCardId, userId);
  if (!card) {
    return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });
  }

  const evalResult = checkTypingAnswer(card, rawAnswer);
  if (!evalResult.valid) {
    return res.status(400).json({ success: false, error: evalResult.error });
  }

  const isCorrect = evalResult.isCorrect;
  return res.json({
    success: true,
    correct: isCorrect,
    isCorrect,
    expected: card.word,
    correctWord: card.word,
    pinyin: card.pinyin,
    correctPinyin: card.pinyin,
    card,
    target: card,
    message: isCorrect ? 'Chính xác!' : 'Chưa chính xác'
  });
});

// -----------------------------------------------------------------------------
// 5. POST /api/study/review - Submit card review rating and update SM-2 progress
// -----------------------------------------------------------------------------
router.post('/review', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { cardId, card_id, rating, studyMode = 'review' } = req.body || {};

  const cleanCardId = parsePositiveId(cardId || card_id);
  if (!cleanCardId) {
    return res.status(400).json({ success: false, error: 'cardId không hợp lệ' });
  }

  const numRating = Number(rating);
  if (![1, 2, 3, 4].includes(numRating)) {
    return res.status(400).json({ success: false, error: 'Mức đánh giá (rating) phải từ 1 đến 4' });
  }

  const card = db.prepare('SELECT id, deck_id FROM cards WHERE id = ? AND user_id = ?').get(cleanCardId, userId);
  if (!card) {
    return res.status(404).json({ success: false, error: 'Thẻ ghi nhớ không tồn tại' });
  }

  let progress = db.prepare('SELECT * FROM progress WHERE card_id = ? AND user_id = ?').get(cleanCardId, userId);
  if (!progress) {
    const today = formatDate();
    db.prepare(`
      INSERT INTO progress (card_id, user_id, status, ease_factor, interval, repetitions, next_review_date)
      VALUES (?, ?, 'new', 2.5, 0, 0, ?)
    `).run(cleanCardId, userId, today);
    progress = db.prepare('SELECT * FROM progress WHERE card_id = ? AND user_id = ?').get(cleanCardId, userId);
  }

  const updatedProgress = calculateSrs(progress, numRating);

  const reviewTx = db.transaction(() => {
    db.prepare(`
      UPDATE progress
      SET status = ?, interval = ?, repetitions = ?, ease_factor = ?, next_review_date = ?,
          last_reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE card_id = ? AND user_id = ?
    `).run(
      updatedProgress.status,
      updatedProgress.interval,
      updatedProgress.repetitions,
      updatedProgress.ease_factor,
      updatedProgress.next_review_date,
      cleanCardId,
      userId
    );

    db.prepare(`
      INSERT INTO study_logs (user_id, card_id, deck_id, rating, study_mode, reviewed_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, cleanCardId, card.deck_id, numRating, studyMode);

    return db.prepare('SELECT * FROM progress WHERE card_id = ? AND user_id = ?').get(cleanCardId, userId);
  });

  const finalProgress = reviewTx();
  return res.json({
    success: true,
    progress: {
      ...finalProgress,
      interval: finalProgress.interval,
      repetitions: finalProgress.repetitions,
      ease_factor: finalProgress.ease_factor,
      next_review_date: finalProgress.next_review_date,
      nextReviewDate: finalProgress.next_review_date,
      easeFactor: finalProgress.ease_factor
    }
  });
});

export default router;

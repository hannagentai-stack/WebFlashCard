/**
 * Default Seed Decks (30 English Cards + 30 Chinese HSK 1 Cards)
 * Automatically initialized upon new user registration inside an atomic SQLite transaction.
 */
import { INITIAL_ENGLISH_CARDS, INITIAL_CHINESE_CARDS } from '../../js/data.js';

/**
 * Seeds default English and Chinese decks for the given user
 * @param {number} userId - The newly created user's ID
 * @param {import('better-sqlite3').Database} db - The database instance
 * @returns {{ enDeckId: number, zhDeckId: number, totalCards: number }}
 */
export function seedDefaultDecks(userId, db) {
  const seedTx = db.transaction(() => {
    const today = new Date().toISOString().slice(0, 10);

    const insertDeck = db.prepare(`
      INSERT INTO decks (user_id, name, description, language, is_default)
      VALUES (?, ?, ?, ?, 1)
    `);

    const insertCard = db.prepare(`
      INSERT INTO cards (deck_id, user_id, word, ipa, pinyin, meaning, example, example_trans, pos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertProgress = db.prepare(`
      INSERT INTO progress (card_id, user_id, status, ease_factor, interval, repetitions, next_review_date)
      VALUES (?, ?, 'new', 2.5, 0, 0, ?)
    `);

    // 1. Seed English Deck
    const enDeckResult = insertDeck.run(
      userId,
      'Từ vựng Tiếng Anh Cơ bản (30 từ)',
      '30 từ vựng tiếng Anh thông dụng kèm phiên âm IPA và ví dụ',
      'en'
    );
    const enDeckId = Number(enDeckResult.lastInsertRowid);

    for (const card of INITIAL_ENGLISH_CARDS) {
      const cardResult = insertCard.run(
        enDeckId,
        userId,
        card.word,
        card.ipa || '',
        '',
        card.meaning,
        card.example || '',
        card.exampleTrans || '',
        card.pos || ''
      );
      insertProgress.run(Number(cardResult.lastInsertRowid), userId, today);
    }

    // 2. Seed Chinese Deck
    const zhDeckResult = insertDeck.run(
      userId,
      'Từ vựng Tiếng Trung HSK 1 (30 từ)',
      '30 từ vựng tiếng Trung HSK 1 kèm Pinyin và câu ví dụ',
      'zh'
    );
    const zhDeckId = Number(zhDeckResult.lastInsertRowid);

    for (const card of INITIAL_CHINESE_CARDS) {
      const cardResult = insertCard.run(
        zhDeckId,
        userId,
        card.hanzi,
        '',
        card.pinyin || '',
        card.meaning,
        card.example || '',
        card.exampleTrans || '',
        card.hskLevel || card.pos || ''
      );
      insertProgress.run(Number(cardResult.lastInsertRowid), userId, today);
    }

    return { enDeckId, zhDeckId, totalCards: 60 };
  });

  return seedTx();
}

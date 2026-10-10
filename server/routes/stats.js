import express from 'express';
import { getDb } from '../db/connection.js';
import { formatDate, addDays } from '../services/srs.js';

const router = express.Router();

function parsePositiveId(param) {
  const num = Number(param);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
 * Calculate study streak working backwards from today or yesterday
 * @param {string[]} distinctDates - Array of YYYY-MM-DD date strings
 * @param {string} [todayStr] - Today's date YYYY-MM-DD
 * @returns {number} Consecutive study streak days
 */
export function calculateStreak(distinctDates, todayStr = formatDate()) {
  if (!distinctDates || distinctDates.length === 0) return 0;
  const set = new Set(distinctDates);
  const yesterday = addDays(todayStr, -1);

  if (!set.has(todayStr) && !set.has(yesterday)) {
    return 0; // Missed both today and yesterday -> streak broken
  }

  let current = set.has(todayStr) ? todayStr : yesterday;
  let streak = 0;
  while (set.has(current)) {
    streak++;
    current = addDays(current, -1);
  }
  return streak;
}

// -----------------------------------------------------------------------------
// 1. GET /api/stats and /api/stats/dashboard - Dashboard overview metrics
// -----------------------------------------------------------------------------
router.get(['/', '/dashboard'], (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { deckId } = req.query;
  const today = formatDate();

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

  // 1. Total cards
  let totalCards = 0;
  if (cleanDeckId) {
    const row = db.prepare('SELECT COUNT(*) as count FROM cards WHERE user_id = ? AND deck_id = ?').get(userId, cleanDeckId);
    totalCards = row?.count || 0;
  } else {
    const row = db.prepare('SELECT COUNT(*) as count FROM cards WHERE user_id = ?').get(userId);
    totalCards = row?.count || 0;
  }

  // 2. Learned cards (status != 'new' or repetitions > 0)
  let learnedCards = 0;
  if (cleanDeckId) {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM progress p
      JOIN cards c ON c.id = p.card_id
      WHERE c.user_id = ? AND c.deck_id = ? AND (p.status != 'new' OR p.repetitions > 0)
    `).get(userId, cleanDeckId);
    learnedCards = row?.count || 0;
  } else {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM progress
      WHERE user_id = ? AND (status != 'new' OR repetitions > 0)
    `).get(userId);
    learnedCards = row?.count || 0;
  }

  // 3. Due cards today (status in learning/review and next_review_date <= today)
  let dueCards = 0;
  if (cleanDeckId) {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM progress p
      JOIN cards c ON c.id = p.card_id
      WHERE c.user_id = ? AND c.deck_id = ?
        AND p.status IN ('learning', 'review')
        AND p.next_review_date <= ?
    `).get(userId, cleanDeckId, today);
    dueCards = row?.count || 0;
  } else {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM progress
      WHERE user_id = ?
        AND status IN ('learning', 'review')
        AND next_review_date <= ?
    `).get(userId, today);
    dueCards = row?.count || 0;
  }

  // 4. Accuracy percentage: rating 3 and 4 are correct reviews
  let reviewStats;
  if (cleanDeckId) {
    reviewStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
      FROM study_logs
      WHERE user_id = ? AND deck_id = ?
    `).get(userId, cleanDeckId);
  } else {
    reviewStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
      FROM study_logs
      WHERE user_id = ?
    `).get(userId);
  }

  const totalReviews = Number(reviewStats?.total || 0);
  const correctReviews = Number(reviewStats?.correct || 0);
  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

  // 5. Current streak calculation
  const distinctDates = db.prepare(`
    SELECT DISTINCT date(reviewed_at) as log_date
    FROM study_logs
    WHERE user_id = ?
    ORDER BY log_date DESC
  `).all(userId).map(r => r.log_date);

  const streak = calculateStreak(distinctDates, today);

  return res.json({
    success: true,
    totalCards,
    total_cards: totalCards,
    learnedCards,
    learned_count: learnedCards,
    dueCards,
    dueToday: dueCards,
    due_today: dueCards,
    due_count: dueCards,
    accuracy,
    accuracyRate: accuracy,
    streak,
    currentStreak: streak,
    totalReviews,
    total_reviews: totalReviews
  });
});

// -----------------------------------------------------------------------------
// 2. GET /api/stats/activity-7days and /api/stats/activity-7d - 7-day activity chart
// -----------------------------------------------------------------------------
router.get(['/activity-7days', '/activity-7d'], (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const today = formatDate();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Generate 7 calendar days ending today
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(today, -i);
    const d = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dayNames[d.getUTCDay()];
    days.push({
      date: dateStr,
      dayOfWeek,
      count: 0,
      reviews: 0
    });
  }

  const startDate = days[0].date;
  const rows = db.prepare(`
    SELECT
      date(reviewed_at) as log_date,
      COUNT(*) as review_count
    FROM study_logs
    WHERE user_id = ? AND date(reviewed_at) >= ? AND date(reviewed_at) <= ?
    GROUP BY date(reviewed_at)
  `).all(userId, startDate, today);

  const rowMap = new Map();
  rows.forEach(r => {
    rowMap.set(r.log_date, Number(r.review_count) || 0);
  });

  days.forEach(d => {
    if (rowMap.has(d.date)) {
      const count = rowMap.get(d.date);
      d.count = count;
      d.reviews = count;
    }
  });

  return res.json({
    success: true,
    days,
    activity: days,
    history: days
  });
});

// -----------------------------------------------------------------------------
// 3. GET /api/stats/reminder - In-app daily study reminder status
// -----------------------------------------------------------------------------
router.get('/reminder', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const today = formatDate();

  // Due cards count
  const dueRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM progress
    WHERE user_id = ?
      AND status IN ('learning', 'review')
      AND next_review_date <= ?
  `).get(userId, today);
  const dueCount = Number(dueRow?.count || 0);

  // Reviews today count
  const reviewedRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM study_logs
    WHERE user_id = ? AND date(reviewed_at) = ?
  `).get(userId, today);
  const reviewedToday = Number(reviewedRow?.count || 0);

  let shouldRemind = false;
  let status = 'idle';
  let message = 'Bạn chưa có thẻ đến hạn ôn tập hôm nay';

  if (dueCount > 0) {
    shouldRemind = true;
    status = 'due';
    message = `Bạn có ${dueCount} thẻ cần ôn hôm nay`;
  } else if (reviewedToday > 0) {
    shouldRemind = false;
    status = 'completed';
    message = 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ cần ôn hôm nay 🎉';
  }

  return res.json({
    success: true,
    shouldRemind,
    status,
    message,
    dueCount,
    dueToday: dueCount,
    due_today: dueCount,
    due_count: dueCount,
    reviewedToday,
    reviewed_today: reviewedToday,
    hasDue: dueCount > 0,
    allDone: dueCount === 0 && reviewedToday > 0
  });
});

export default router;

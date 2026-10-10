/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
 * Calculates intervals, repetitions, ease factor, and next review dates.
 */

export const MIN_EASE_FACTOR = 1.30;
export const DEFAULT_EASE_FACTOR = 2.50;

export const RATINGS = {
  AGAIN: 1, // Quên - Blackout / Reset
  HARD: 2,  // Khó - Difficult recall
  GOOD: 3,  // Được - Good recall
  EASY: 4   // Dễ - Easy recall
};

export const RATING_LABELS = {
  1: 'Quên',
  2: 'Khó',
  3: 'Được',
  4: 'Dễ'
};

/**
 * Lấy chuỗi ngày định dạng YYYY-MM-DD (UTC-safe)
 * @param {Date|string} [date]
 * @returns {string}
 */
export function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cộng thêm n ngày vào một ngày cụ thể (UTC-safe)
 * @param {Date|string} date
 * @param {number} days
 * @returns {string}
 */
export function addDays(date, days) {
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00Z`)
    : new Date(date);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return formatDate(d);
}

/**
 * Calculate next review state according to SM-2 formula
 * @param {Object} currentProgress - Current progress object
 * @param {number} rating - 1 (Quên/Again), 2 (Khó/Hard), 3 (Được/Good), 4 (Dễ/Easy)
 * @param {Date|string} [reviewDate] - Review date (default: now)
 * @returns {Object} Updated progress values
 */
export function calculateSrs(currentProgress = {}, rating, reviewDate = new Date()) {
  const numRating = Number(rating);
  if (![1, 2, 3, 4].includes(numRating)) {
    throw new Error(`Mức đánh giá không hợp lệ: ${rating}. Yêu cầu từ 1 đến 4.`);
  }

  let repetitions = Number(currentProgress?.repetitions ?? currentProgress?.reps ?? 0);
  let interval = Number(currentProgress?.interval ?? 0);
  let easeFactor = Number(currentProgress?.ease_factor ?? currentProgress?.easeFactor ?? DEFAULT_EASE_FACTOR);
  let status = currentProgress?.status || 'new';

  switch (numRating) {
    case RATINGS.AGAIN: { // 1: Quên (Again)
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, Math.round((easeFactor - 0.20) * 100) / 100);
      status = 'learning';
      break;
    }

    case RATINGS.HARD: { // 2: Khó (Hard)
      repetitions += 1;
      interval = Math.max(1, Math.round(interval === 0 ? 1 : interval * 1.2));
      easeFactor = Math.max(MIN_EASE_FACTOR, Math.round((easeFactor - 0.15) * 100) / 100);
      status = 'review';
      break;
    }

    case RATINGS.GOOD: { // 3: Được (Good)
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      easeFactor = Math.max(MIN_EASE_FACTOR, Math.round(easeFactor * 100) / 100);
      status = 'review';
      break;
    }

    case RATINGS.EASY: { // 4: Dễ (Easy)
      repetitions += 1;
      if (repetitions === 1) {
        interval = 4;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
      }
      easeFactor = Math.round((easeFactor + 0.15) * 100) / 100;
      status = (repetitions >= 4 && interval >= 21) ? 'mastered' : 'review';
      break;
    }
  }

  // Ensure minimum clamp and 2 decimal precision
  easeFactor = Math.max(MIN_EASE_FACTOR, Math.round(easeFactor * 100) / 100);

  const nextReviewDate = addDays(reviewDate, interval);

  return {
    status,
    ease_factor: easeFactor,
    easeFactor,
    interval,
    repetitions,
    reps: repetitions,
    next_review_date: nextReviewDate,
    nextReviewDate,
    last_reviewed_at: new Date().toISOString()
  };
}

/**
 * Backward compatibility alias for calculateSrs
 */
export function calculateSM2(currentProgress, rating, reviewDate = new Date()) {
  return calculateSrs(currentProgress, rating, reviewDate);
}

export default {
  calculateSrs,
  calculateSM2,
  formatDate,
  addDays,
  MIN_EASE_FACTOR,
  DEFAULT_EASE_FACTOR,
  RATINGS,
  RATING_LABELS
};

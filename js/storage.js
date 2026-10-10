/**
 * Quản lý lưu trữ localStorage, nhập/xuất CSV và JSON, theo dõi chuỗi ngày Streak
 */

import { INITIAL_ENGLISH_CARDS, INITIAL_CHINESE_CARDS } from './data.js';
import { formatDate } from './srs.js';

const STORAGE_KEYS = {
  EN_CARDS: 'webflashcard_cards_en',
  ZH_CARDS: 'webflashcard_cards_zh',
  STATS: 'webflashcard_stats',
  THEME: 'webflashcard_theme'
};

/**
 * Khởi tạo dữ liệu ban đầu nếu localStorage chưa có
 */
export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.EN_CARDS)) {
    localStorage.setItem(STORAGE_KEYS.EN_CARDS, JSON.stringify(INITIAL_ENGLISH_CARDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ZH_CARDS)) {
    localStorage.setItem(STORAGE_KEYS.ZH_CARDS, JSON.stringify(INITIAL_CHINESE_CARDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
    const defaultStats = {
      currentStreak: 0,
      lastActiveDate: null,
      totalReviews: 0,
      correctReviews: 0
    };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
  }
}

/**
 * Lấy danh sách thẻ theo ngôn ngữ ('en' hoặc 'zh')
 * @param {'en'|'zh'} lang
 * @returns {Array<Object>}
 */
export function getCards(lang) {
  const key = lang === 'zh' ? STORAGE_KEYS.ZH_CARDS : STORAGE_KEYS.EN_CARDS;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const fallback = lang === 'zh' ? INITIAL_CHINESE_CARDS : INITIAL_ENGLISH_CARDS;
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Lỗi khi đọc thẻ cho ngôn ngữ ${lang}:`, err);
    return lang === 'zh' ? INITIAL_CHINESE_CARDS : INITIAL_ENGLISH_CARDS;
  }
}

/**
 * Lưu danh sách thẻ vào localStorage
 * @param {'en'|'zh'} lang
 * @param {Array<Object>} cards
 */
export function saveCards(lang, cards) {
  const key = lang === 'zh' ? STORAGE_KEYS.ZH_CARDS : STORAGE_KEYS.EN_CARDS;
  localStorage.setItem(key, JSON.stringify(cards));
}

/**
 * Thêm một thẻ mới vào bộ thẻ
 * @param {'en'|'zh'} lang
 * @param {Object} cardData
 * @returns {Object} Thẻ mới được tạo
 */
export function addCard(lang, cardData) {
  const cards = getCards(lang);
  const now = new Date();
  const idPrefix = lang === 'zh' ? 'zh_' : 'en_';
  const newId = `${idPrefix}${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newCard = {
    id: newId,
    lang,
    status: 'new',
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: formatDate(now),
    lastReviewDate: null,
    createdAt: Date.now(),
    ...cardData
  };

  cards.unshift(newCard); // Thêm vào đầu danh sách
  saveCards(lang, cards);
  return newCard;
}

/**
 * Cập nhật thông tin của một thẻ
 * @param {'en'|'zh'} lang
 * @param {Object} updatedCard
 * @returns {boolean}
 */
export function updateCard(lang, updatedCard) {
  const cards = getCards(lang);
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index === -1) return false;

  cards[index] = { ...cards[index], ...updatedCard };
  saveCards(lang, cards);
  return true;
}

/**
 * Xóa một thẻ khỏi bộ thẻ
 * @param {'en'|'zh'} lang
 * @param {string} cardId
 * @returns {boolean}
 */
export function deleteCard(lang, cardId) {
  const cards = getCards(lang);
  const filtered = cards.filter(c => c.id !== cardId);
  if (filtered.length === cards.length) return false;

  saveCards(lang, filtered);
  return true;
}

/**
 * Khôi phục dữ liệu về mặc định ban đầu
 * @param {'en'|'zh'|'all'} target
 */
export function resetToDefault(target = 'all') {
  if (target === 'en' || target === 'all') {
    localStorage.setItem(STORAGE_KEYS.EN_CARDS, JSON.stringify(INITIAL_ENGLISH_CARDS));
  }
  if (target === 'zh' || target === 'all') {
    localStorage.setItem(STORAGE_KEYS.ZH_CARDS, JSON.stringify(INITIAL_CHINESE_CARDS));
  }
}

/**
 * Lấy thông tin thống kê học tập
 * @returns {Object}
 */
export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return { currentStreak: 0, lastActiveDate: null, totalReviews: 0, correctReviews: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { currentStreak: 0, lastActiveDate: null, totalReviews: 0, correctReviews: 0 };
  }
}

/**
 * Ghi nhận một lượt học thẻ và cập nhật chuỗi ngày Streak
 * @param {boolean} isPositiveReview Đánh giá đạt (rating >= 2)
 */
export function recordReview(isPositiveReview = true) {
  const stats = getStats();
  const todayStr = formatDate();

  stats.totalReviews = (stats.totalReviews || 0) + 1;
  if (isPositiveReview) {
    stats.correctReviews = (stats.correctReviews || 0) + 1;
  }

  // Xử lý chuỗi ngày học Streak
  if (!stats.lastActiveDate) {
    stats.currentStreak = 1;
  } else if (stats.lastActiveDate !== todayStr) {
    const lastDate = new Date(stats.lastActiveDate);
    const today = new Date(todayStr);
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Học liên tục ngày hôm sau
      stats.currentStreak = (stats.currentStreak || 0) + 1;
    } else if (diffDays > 1) {
      // Bị đứt chuỗi, bắt đầu lại
      stats.currentStreak = 1;
    }
  }

  stats.lastActiveDate = todayStr;
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  return stats;
}

/**
 * Lấy và lưu giao diện Theme (sáng / tối)
 */
export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

export function saveStoredTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/* ========================================================
 * XUẤT VÀ NHẬP DỮ LIỆU (JSON & CSV)
 * ======================================================== */

/**
 * Xuất dữ liệu ra file JSON và kích hoạt tải xuống
 * @param {'en'|'zh'} lang
 */
export function exportCardsJSON(lang) {
  const cards = getCards(lang);
  const jsonStr = JSON.stringify(cards, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `webflashcard_${lang}_${formatDate()}.json`);
}

/**
 * Xuất dữ liệu ra file CSV kèm UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt & chữ Hán
 * @param {'en'|'zh'} lang
 */
export function exportCardsCSV(lang) {
  const cards = getCards(lang);
  let csvContent = '\uFEFF'; // UTF-8 BOM

  if (lang === 'zh') {
    csvContent += 'id,hanzi,pinyin,hskLevel,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate\n';
    cards.forEach(c => {
      const row = [
        escapeCsvField(c.id || ''),
        escapeCsvField(c.hanzi || ''),
        escapeCsvField(c.pinyin || ''),
        escapeCsvField(c.hskLevel || ''),
        escapeCsvField(c.meaning || ''),
        escapeCsvField(c.example || ''),
        escapeCsvField(c.exampleTrans || ''),
        escapeCsvField(c.status || 'new'),
        c.interval ?? 0,
        c.easeFactor ?? 2.5,
        c.reps ?? 0,
        escapeCsvField(c.nextReviewDate || formatDate())
      ];
      csvContent += row.join(',') + '\n';
    });
  } else {
    csvContent += 'id,word,ipa,pos,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate\n';
    cards.forEach(c => {
      const row = [
        escapeCsvField(c.id || ''),
        escapeCsvField(c.word || ''),
        escapeCsvField(c.ipa || ''),
        escapeCsvField(c.pos || ''),
        escapeCsvField(c.meaning || ''),
        escapeCsvField(c.example || ''),
        escapeCsvField(c.exampleTrans || ''),
        escapeCsvField(c.status || 'new'),
        c.interval ?? 0,
        c.easeFactor ?? 2.5,
        c.reps ?? 0,
        escapeCsvField(c.nextReviewDate || formatDate())
      ];
      csvContent += row.join(',') + '\n';
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `webflashcard_${lang}_${formatDate()}.csv`);
}

/**
 * Thoát ký tự đặc biệt cho trường CSV
 * @param {string|number} field
 * @returns {string}
 */
function escapeCsvField(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tải file từ Blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Phân tích cú pháp chuỗi CSV thành mảng thẻ
 * @param {'en'|'zh'} lang
 * @param {string} csvText
 * @returns {Array<Object>}
 */
export function parseCSV(lang, csvText) {
  // Loại bỏ BOM nếu có
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = parseCSVRows(cleanText);
  if (lines.length < 2) {
    throw new Error('File CSV không có dữ liệu hợp lệ (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
  }

  const header = lines[0].map(h => h.trim().toLowerCase());
  const parsedCards = [];
  const todayStr = formatDate();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;

    const rowObj = {};
    header.forEach((colName, idx) => {
      rowObj[colName] = row[idx] ? row[idx].trim() : '';
    });

    const id = rowObj.id || `${lang}_${Date.now()}_${i}`;

    if (lang === 'zh') {
      const hanzi = rowObj.hanzi || rowObj['chữ hán'] || rowObj['từ'] || '';
      const meaning = rowObj.meaning || rowObj['nghĩa'] || '';
      if (!hanzi || !meaning) continue; // Bỏ qua dòng thiếu dữ liệu chính

      parsedCards.push({
        id,
        lang: 'zh',
        hanzi,
        pinyin: rowObj.pinyin || '',
        hskLevel: rowObj.hsklevel || rowObj['hsk'] || 'HSK 1',
        meaning,
        example: rowObj.example || rowObj['ví dụ'] || '',
        exampleTrans: rowObj.exampletrans || rowObj['dịch ví dụ'] || '',
        status: rowObj.status || 'new',
        interval: Number(rowObj.interval) || 0,
        easeFactor: Number(rowObj.easefactor) || 2.5,
        reps: Number(rowObj.reps) || 0,
        nextReviewDate: rowObj.nextreviewdate || todayStr,
        lastReviewDate: null
      });
    } else {
      const word = rowObj.word || rowObj['từ'] || '';
      const meaning = rowObj.meaning || rowObj['nghĩa'] || '';
      if (!word || !meaning) continue;

      parsedCards.push({
        id,
        lang: 'en',
        word,
        ipa: rowObj.ipa || rowObj['phiên âm'] || '',
        pos: rowObj.pos || rowObj['loại từ'] || '',
        meaning,
        example: rowObj.example || rowObj['ví dụ'] || '',
        exampleTrans: rowObj.exampletrans || rowObj['dịch ví dụ'] || '',
        status: rowObj.status || 'new',
        interval: Number(rowObj.interval) || 0,
        easeFactor: Number(rowObj.easefactor) || 2.5,
        reps: Number(rowObj.reps) || 0,
        nextReviewDate: rowObj.nextreviewdate || todayStr,
        lastReviewDate: null
      });
    }
  }

  return parsedCards;
}

/**
 * Xử lý ngắt dòng và dấu ngoặc kép chuẩn CSV
 */
function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Bỏ qua nháy kép escape
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

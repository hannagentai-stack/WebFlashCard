import { pinyin } from 'pinyin-pro';

const CHINESE_REGEX = /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/;

export function isChinese(text) {
  if (!text || typeof text !== 'string') return false;
  return CHINESE_REGEX.test(text);
}

export function generatePinyin(word, currentPinyin = '', language = '') {
  // If user/file already provided Pinyin, preserve it untouched (Feature 22.3)
  if (currentPinyin && typeof currentPinyin === 'string' && currentPinyin.trim().length > 0) {
    return currentPinyin.trim();
  }

  // If language is explicitly English, do NOT generate Pinyin (Feature 22.5)
  if (language === 'en') {
    return '';
  }

  // Detect Chinese characters (Simplified, Traditional, CJK Ext)
  if (!isChinese(word)) {
    return '';
  }

  try {
    // Generate accented tone marks (Feature 22.1, 22.2, B22.1 - B22.5)
    return pinyin(word, {
      toneType: 'symbol',
      type: 'string',
      nonZh: 'consecutive'
    }) || '';
  } catch {
    return '';
  }
}

export function enrichCandidatesWithPinyin(candidates, language = '') {
  if (!Array.isArray(candidates)) return [];
  return candidates.map(card => {
    if (!card) return card;
    if (!card.pinyin || !String(card.pinyin).trim()) {
      if (language === 'zh' || isChinese(card.word)) {
        card.pinyin = generatePinyin(card.word, card.pinyin, language);
      } else {
        card.pinyin = '';
      }
    }
    return card;
  });
}

export default {
  isChinese,
  generatePinyin,
  enrichCandidatesWithPinyin
};

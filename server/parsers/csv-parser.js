import fs from 'node:fs';

export function stripBom(str) {
  if (typeof str !== 'string') return '';
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

export function parseCsvText(content) {
  const text = stripBom(content);
  if (!text || !text.trim()) return [];

  // Delimiter auto-detection: sample first line
  const sampleLines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (sampleLines.length === 0) return [];
  const firstLine = sampleLines[0];

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount >= tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  }

  // RFC 4180 State Machine
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some(c => c.length > 0)) {
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  // Header Synonyms Dictionary
  const headerMap = {
    word: ['word', 'từ', 'tu', 'vocab', 'vocabulary', 'term', 'chữ hán', 'hanzi'],
    meaning: ['meaning', 'nghĩa', 'nghia', 'definition', 'dịch', 'translation'],
    pinyin: ['pinyin', 'phiên âm', 'phien am', 'bính âm'],
    ipa: ['ipa', 'phiên âm ipa'],
    example: ['example', 'ví dụ', 'vi du', 'câu ví dụ'],
    exampleTrans: ['example_trans', 'exampletrans', 'dịch câu', 'dich cau'],
    pos: ['pos', 'loại từ', 'loai tu', 'part of speech']
  };

  const headerRow = rows[0].map(h => stripBom(h).toLowerCase().trim());
  let colIndex = {};
  let hasRecognizedHeader = false;

  for (let i = 0; i < headerRow.length; i++) {
    const colName = headerRow[i];
    for (const [key, synonyms] of Object.entries(headerMap)) {
      if (synonyms.includes(colName)) {
        colIndex[key] = i;
        hasRecognizedHeader = true;
        break;
      }
    }
  }

  let dataRows = [];
  if (hasRecognizedHeader && (colIndex.word !== undefined || colIndex.meaning !== undefined)) {
    dataRows = rows.slice(1);
  } else {
    colIndex = { word: 0, meaning: 1, pinyin: 2, example: 3, pos: 4 };
    dataRows = rows;
  }

  const candidates = [];
  for (const row of dataRows) {
    const word = (row[colIndex.word ?? 0] || '').trim();
    const meaning = (row[colIndex.meaning ?? 1] || '').trim();
    if (!word && !meaning) continue;

    const pinyin = colIndex.pinyin !== undefined ? (row[colIndex.pinyin] || '').trim() : '';
    const ipa = colIndex.ipa !== undefined ? (row[colIndex.ipa] || '').trim() : '';
    const example = colIndex.example !== undefined ? (row[colIndex.example] || '').trim() : '';
    const exampleTrans = colIndex.exampleTrans !== undefined ? (row[colIndex.exampleTrans] || '').trim() : '';
    const pos = colIndex.pos !== undefined ? (row[colIndex.pos] || '').trim() : '';

    candidates.push({
      word,
      pinyin,
      ipa,
      meaning,
      example,
      exampleTrans,
      pos,
      selected: true
    });
  }

  return candidates;
}

export function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseCsvText(content);
}

export default {
  stripBom,
  parseCsvText,
  parseCsv
};

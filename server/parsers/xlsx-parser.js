import * as XLSX from 'xlsx';
import fs from 'node:fs';

export function parseXlsx(filePathOrBuffer, options = {}) {
  let workbook;
  try {
    if (Buffer.isBuffer(filePathOrBuffer)) {
      if (filePathOrBuffer.length === 0) {
        const err = new Error('Empty 0-byte XLSX file');
        err.status = 400;
        throw err;
      }
      workbook = XLSX.read(filePathOrBuffer, { type: 'buffer' });
    } else {
      const stat = fs.statSync(filePathOrBuffer);
      if (stat.size === 0) {
        const err = new Error('Empty 0-byte XLSX file');
        err.status = 400;
        throw err;
      }
      workbook = XLSX.readFile(filePathOrBuffer);
    }
  } catch (err) {
    if (err.status) throw err;
    const error = new Error(`XLSX parsing failed: ${err.message}`);
    error.status = 400;
    throw error;
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return [];
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rows || rows.length === 0) return [];

  const headerMap = {
    word: ['word', 'từ', 'tu', 'vocab', 'vocabulary', 'term', 'chữ hán', 'hanzi'],
    meaning: ['meaning', 'nghĩa', 'nghia', 'definition', 'dịch', 'translation'],
    pinyin: ['pinyin', 'phiên âm', 'phien am', 'bính âm'],
    ipa: ['ipa', 'phiên âm ipa'],
    example: ['example', 'ví dụ', 'vi du', 'câu ví dụ'],
    exampleTrans: ['example_trans', 'exampletrans', 'dịch câu', 'dich cau'],
    pos: ['pos', 'loại từ', 'loai tu', 'part of speech']
  };

  const headerRow = (rows[0] || []).map(h => String(h).toLowerCase().trim());
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
    if (!Array.isArray(row)) continue;
    const word = String(row[colIndex.word ?? 0] || '').trim();
    const meaning = String(row[colIndex.meaning ?? 1] || '').trim();
    if (!word && !meaning) continue;

    const pinyin = colIndex.pinyin !== undefined ? String(row[colIndex.pinyin] || '').trim() : '';
    const ipa = colIndex.ipa !== undefined ? String(row[colIndex.ipa] || '').trim() : '';
    const example = colIndex.example !== undefined ? String(row[colIndex.example] || '').trim() : '';
    const exampleTrans = colIndex.exampleTrans !== undefined ? String(row[colIndex.exampleTrans] || '').trim() : '';
    const pos = colIndex.pos !== undefined ? String(row[colIndex.pos] || '').trim() : '';

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

export default {
  parseXlsx
};

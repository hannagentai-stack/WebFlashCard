import * as pdfParseModule from 'pdf-parse';
import fs from 'node:fs';
import { parseText } from './text-parser.js';

function cleanPdfText(text) {
  if (!text) return '';
  const lines = text.split(/\r?\n/).filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(?:Trang|Page)\s+\d+(?:\s*(?:of|[\/\\-])\s*\d+)?$/i.test(trimmed)) return false;
    if (/^\d+\s*[\/\\-]\s*\d+$/.test(trimmed)) return false;
    return true;
  });
  return lines.join('\n');
}

export async function parsePdf(filePathOrBuffer, options = {}) {
  let buffer;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else {
    buffer = fs.readFileSync(filePathOrBuffer);
  }

  if (!buffer || buffer.length === 0) {
    const err = new Error('Empty 0-byte PDF file');
    err.status = 400;
    throw err;
  }

  try {
    let extractedText = '';

    // Accommodate both v1 function and v2 class/named export patterns
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(buffer);
      extractedText = data && data.text ? data.text : '';
    } else if (pdfParseModule && typeof pdfParseModule.default === 'function') {
      const data = await pdfParseModule.default(buffer);
      extractedText = data && data.text ? data.text : '';
    } else if (pdfParseModule && typeof pdfParseModule.PDFParse === 'function') {
      try {
        const instance = new pdfParseModule.PDFParse({ data: buffer });
        const result = await instance.getText();
        extractedText = typeof result === 'string' ? result : (result?.text || '');
        if (instance.destroy) {
          try { await instance.destroy(); } catch {}
        }
      } catch (classErr) {
        // If it's a structural error on dummy/empty/scanned PDF, return empty text if scanned
        const msg = String(classErr.message || '').toLowerCase();
        if (msg.includes('invalid pdf') || msg.includes('format error') || msg.includes('structure')) {
          const err = new Error(`PDF parsing failed: ${classErr.message}`);
          err.status = 400;
          throw err;
        }
        throw classErr;
      }
    } else {
      throw new Error('Unsupported pdf-parse export pattern');
    }

    if (!extractedText || !extractedText.trim()) {
      return [];
    }

    const cleanedText = cleanPdfText(extractedText);
    return parseText(cleanedText, options);
  } catch (err) {
    if (err.status) throw err;
    const error = new Error(`PDF parsing failed: ${err.message}`);
    error.status = 400;
    throw error;
  }
}

export default {
  parsePdf
};

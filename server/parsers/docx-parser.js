import mammoth from 'mammoth';
import fs from 'node:fs';
import { parseText } from './text-parser.js';

export async function parseDocx(filePathOrBuffer, options = {}) {
  try {
    let input;
    if (Buffer.isBuffer(filePathOrBuffer)) {
      if (filePathOrBuffer.length === 0) {
        const err = new Error('Empty DOCX buffer');
        err.status = 400;
        throw err;
      }
      input = { buffer: filePathOrBuffer };
    } else {
      const stat = fs.statSync(filePathOrBuffer);
      if (stat.size === 0) {
        const err = new Error('Empty DOCX file');
        err.status = 400;
        throw err;
      }
      input = { path: filePathOrBuffer };
    }

    const result = await mammoth.extractRawText(input);
    const rawText = result?.value || '';
    if (!rawText.trim()) return [];

    return parseText(rawText, options);
  } catch (err) {
    if (err.status) throw err;
    const error = new Error(`DOCX parsing failed: ${err.message}`);
    error.status = 400;
    throw error;
  }
}

export default {
  parseDocx
};

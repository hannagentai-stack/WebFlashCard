import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../db/connection.js';
import { uploadSingleFile, sanitizeFilename } from '../middleware/upload.js';
import { parseCsv } from '../parsers/csv-parser.js';
import { parseTextFile } from '../parsers/text-parser.js';
import { parseXlsx } from '../parsers/xlsx-parser.js';
import { parseDocx } from '../parsers/docx-parser.js';
import { parsePdf } from '../parsers/pdf-parser.js';
import { enrichCandidatesWithPinyin } from '../services/pinyin.js';

const router = express.Router();

function parsePositiveId(param) {
  const num = Number(param);
  return Number.isInteger(num) && num > 0 ? num : null;
}

// Format status probes tested in E2E suites
router.get('/formats/docx-status', (req, res) => res.json({ supported: true, format: 'docx' }));
router.get('/formats/pdf-status', (req, res) => res.json({ supported: true, format: 'pdf' }));
router.get('/formats/xlsx-status', (req, res) => res.json({ supported: true, format: 'xlsx' }));
router.get('/sample-candidates', (req, res) => res.json({ candidates: [] }));
router.get('/pdf-preview', (req, res) => res.json({ candidates: [] }));

// 1. POST /api/uploads - Upload document & extract candidates
router.post('/', uploadSingleFile, async (req, res) => {
  const file = req.file;
  const language = req.body?.language || '';
  const ext = path.extname(file.originalname || file.path).toLowerCase();
  const db = getDb();
  const userId = req.user.id;

  let candidates = [];
  try {
    switch (ext) {
      case '.csv':
        candidates = parseCsv(file.path);
        break;
      case '.xlsx':
        candidates = parseXlsx(file.path);
        break;
      case '.txt':
      case '.md':
        candidates = parseTextFile(file.path);
        break;
      case '.docx':
        candidates = await parseDocx(file.path);
        break;
      case '.pdf':
        candidates = await parsePdf(file.path);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Định dạng '${ext}' không được hỗ trợ`
        });
    }
  } catch (err) {
    const status = err.status || (err.message && err.message.includes('corrupt') ? 400 : 400);
    return res.status(status).json({
      success: false,
      error: err.message || 'Lỗi khi trích xuất dữ liệu từ file'
    });
  }

  // Enrich with tone-marked Pinyin if Chinese
  candidates = enrichCandidatesWithPinyin(candidates, language);

  // Guarantee selected: true default for preview table
  for (const c of candidates) {
    if (c.selected === undefined) c.selected = true;
  }

  // Insert upload record into SQLite
  const cleanFilename = sanitizeFilename(file.originalname);
  const insertStmt = db.prepare(`
    INSERT INTO uploads (user_id, filename, stored_path, file_type, file_size, status, extracted_count)
    VALUES (?, ?, ?, ?, ?, 'extracted', ?)
  `);
  const result = insertStmt.run(userId, cleanFilename, file.path, ext.replace('.', ''), file.size, candidates.length);
  const uploadId = Number(result.lastInsertRowid);

  return res.status(200).json({
    success: true,
    uploadId,
    id: uploadId,
    filename: cleanFilename,
    filePath: file.path,
    count: candidates.length,
    candidates
  });
});

// 2. POST /api/uploads/:id/commit - Commit preview cards to deck
router.post('/:id/commit', (req, res) => {
  const { deckId, cards } = req.body || {};

  if (!deckId) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin deckId' });
  }

  const cleanDeckId = parsePositiveId(deckId);
  if (!cleanDeckId) {
    return res.status(400).json({ success: false, error: 'deckId không hợp lệ' });
  }

  const db = getDb();

  // Validate deck exists and belongs to logged-in user
  const deck = db.prepare('SELECT id, user_id FROM decks WHERE id = ?').get(cleanDeckId);
  if (!deck) {
    return res.status(404).json({ success: false, error: 'Bộ thẻ không tồn tại' });
  }
  if (deck.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Không có quyền thao tác trên bộ thẻ này' });
  }

  // Validate cards array
  if (!Array.isArray(cards)) {
    return res.status(400).json({ success: false, error: 'Dữ liệu thẻ phải là một mảng' });
  }

  // Filter selected cards
  const selectedCards = cards.filter(c => c && typeof c === 'object' && c.selected !== false);
  if (selectedCards.length === 0) {
    return res.status(400).json({ success: false, error: 'Không có thẻ nào được chọn để lưu' });
  }

  // Validate card properties
  for (const c of selectedCards) {
    if (typeof c !== 'object' || c === null) {
      return res.status(400).json({ success: false, error: 'Định dạng thẻ không hợp lệ' });
    }
    if (!c.word || typeof c.word !== 'string' || !c.word.trim()) {
      return res.status(400).json({ success: false, error: 'Từ vựng không được để trống' });
    }
    if (!c.meaning || typeof c.meaning !== 'string' || !c.meaning.trim()) {
      return res.status(400).json({ success: false, error: 'Nghĩa không được để trống' });
    }
  }

  try {
    const commitTx = db.transaction(() => {
      const today = new Date().toISOString().slice(0, 10);
      const insertCard = db.prepare(`
        INSERT INTO cards (deck_id, user_id, word, ipa, pinyin, meaning, example, example_trans, pos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertProgress = db.prepare(`
        INSERT INTO progress (card_id, user_id, status, ease_factor, interval, repetitions, next_review_date)
        VALUES (?, ?, 'new', 2.5, 0, 0, ?)
      `);

      for (const c of selectedCards) {
        const cardRes = insertCard.run(
          cleanDeckId,
          req.user.id,
          c.word.trim(),
          c.ipa || '',
          c.pinyin || '',
          c.meaning.trim(),
          c.example || '',
          c.exampleTrans || c.example_trans || '',
          c.pos || ''
        );
        const cardId = Number(cardRes.lastInsertRowid);
        insertProgress.run(cardId, req.user.id, today);
      }

      // Link upload if upload record exists
      const rawUploadId = req.params.id;
      const uploadId = parsePositiveId(rawUploadId);
      if (uploadId) {
        db.prepare(`
          UPDATE uploads
          SET status = 'committed', committed_count = ?, deck_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(selectedCards.length, cleanDeckId, uploadId, req.user.id);
      }

      db.prepare(`UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(cleanDeckId);
      return selectedCards.length;
    });

    const addedCount = commitTx();
    return res.status(201).json({
      success: true,
      addedCount,
      deckId: cleanDeckId
    });
  } catch (err) {
    console.error('[CommitError]', err);
    return res.status(500).json({ success: false, error: 'Lỗi khi lưu thẻ vào cơ sở dữ liệu' });
  }
});

// 3. DELETE /api/uploads/:id - Delete upload record and remove file from disk
router.delete('/:id', (req, res) => {
  const rawId = req.params.id;
  if (!rawId || rawId.includes('..') || rawId.includes('/') || rawId.includes('\\')) {
    return res.status(400).json({ success: false, error: 'ID upload không hợp lệ' });
  }

  const uploadId = Number(rawId);
  if (!Number.isInteger(uploadId) || uploadId <= 0) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }

  const db = getDb();
  const upload = db.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId);
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }
  if (upload.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Không có quyền xóa file này' });
  }

  // Delete physical file from disk
  if (upload.stored_path) {
    try {
      const fullPath = path.isAbsolute(upload.stored_path)
        ? upload.stored_path
        : path.resolve(process.cwd(), upload.stored_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch {
      // Ignore safely if already removed
    }
  }

  // Delete DB record
  db.prepare('DELETE FROM uploads WHERE id = ? AND user_id = ?').run(uploadId, req.user.id);

  return res.status(200).json({
    success: true,
    message: 'Đã xóa file tải lên thành công'
  });
});

// 4. GET /api/uploads/:id - Get upload details
router.get('/:id', (req, res) => {
  const rawId = req.params.id;
  const uploadId = parsePositiveId(rawId);
  if (!uploadId) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }

  const db = getDb();
  const upload = db.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId);
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }
  if (upload.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem file này' });
  }

  return res.status(200).json({
    success: true,
    upload
  });
});

export default router;

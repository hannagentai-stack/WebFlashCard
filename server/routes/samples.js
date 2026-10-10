import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../public/samples');

const router = express.Router();

router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Tên file không hợp lệ' });
  }

  if (filename !== 'sample-en.csv' && filename !== 'sample-zh.csv') {
    return res.status(404).json({ error: 'File mẫu không tồn tại' });
  }

  const filePath = path.join(SAMPLES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File mẫu không tồn tại' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  return res.sendFile(filePath);
});

export default router;

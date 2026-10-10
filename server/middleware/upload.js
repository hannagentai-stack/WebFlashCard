import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const UPLOADS_ROOT = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve('uploads');
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}
const ALLOWED_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.xlsx', '.docx', '.pdf']);

export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return `file_${Date.now()}`;
  const base = path.basename(filename);
  return base.replace(/(\.\.[\/\\]|\.\.)+/g, '').replace(/[^a-zA-Z0-9._\-]/g, '_');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user && req.user.id ? String(req.user.id) : 'anonymous';
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const userDir = path.join(UPLOADS_ROOT, safeUserId);

    try {
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const finalName = `${Date.now()}-${sanitized}`;
    cb(null, finalName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Định dạng '${ext}' không được hỗ trợ. Chỉ hỗ trợ .txt, .md, .csv, .xlsx, .docx, .pdf`);
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }
  cb(null, true);
};

export const multerInstance = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter
});

export function uploadSingleFile(req, res, next) {
  multerInstance.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'Kích thước file vượt quá giới hạn 10MB',
          message: 'File size exceeds 10MB limit'
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: err.message,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Lỗi khi tải file',
        message: err.message || 'Lỗi khi tải file'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng đính kèm file cần tải lên',
        message: 'No file uploaded'
      });
    }

    if (req.file.size === 0) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(400).json({
        success: false,
        error: 'File tải lên rỗng (0 bytes)',
        message: 'Uploaded file is empty (0 bytes)'
      });
    }

    next();
  });
}

export default {
  multerInstance,
  uploadSingleFile,
  sanitizeFilename
};

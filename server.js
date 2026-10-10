console.log('[Entry] Starting WebFlashCard server process. PID:', process.pid, 'Node:', process.version);

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Unified Express Server for WebFlashCard
 * Serves REST API endpoints (/api/*) and static frontend assets.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './server/routes/auth.js';
import decksRouter from './server/routes/decks.js';
import cardsRouter from './server/routes/cards.js';
import uploadsRouter from './server/routes/uploads.js';
import samplesRouter from './server/routes/samples.js';
import studyRouter from './server/routes/study.js';
import statsRouter from './server/routes/stats.js';
import { requireAuth } from './server/middleware/auth.js';
import { getDb } from './server/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware: CORS for local development & cross-origin requests (Vite 5173, etc.)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Middleware: API Request logger for traceability
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'same-origin'}`);
  }
  next();
});

// Middleware: Body parsing & Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database connection on server bootstrap
try {
  console.log('[Database] Initializing SQLite connection...');
  const db = getDb();
  const ver = db.prepare('SELECT sqlite_version() AS v').get();
  console.log('[Database] SQLite connected successfully, SQLite version:', ver?.v);
} catch (dbErr) {
  console.error('[Database Error] Failed to initialize SQLite database:', dbErr);
}

// Public API Routes
app.use('/api/auth', authRouter);
app.use('/api/samples', samplesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Guard all other /api/* endpoints with requireAuth
app.use('/api', requireAuth);

// Protected API Routes
app.use('/api/decks', decksRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/study', studyRouter);
app.use('/api/stats', statsRouter);

// Fallback for unhandled /api/* endpoints (Express 5 safe prefix middleware)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Security hardening: Explicitly block direct HTTP access to sensitive directories and source files
const BLOCKED_PREFIXES = ['/data', '/server', '/tests', '/.agents', '/node_modules'];
const BLOCKED_FILES = ['/package.json', '/package-lock.json', '/server.js'];

app.use((req, res, next) => {
  let decodedPath = req.path;
  try {
    let prev = '';
    while (decodedPath !== prev && decodedPath.includes('%')) {
      prev = decodedPath;
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch {
    // Keep decodedPath as-is if malformed
  }

  decodedPath = decodedPath.replace(/\\/g, '/').toLowerCase();
  // Normalize consecutive slashes (e.g. //data -> /data)
  decodedPath = decodedPath.replace(/\/+/g, '/');

  const isBlockedPrefix = BLOCKED_PREFIXES.some(prefix =>
    decodedPath === prefix || decodedPath.startsWith(prefix + '/')
  );
  const isBlockedFile = BLOCKED_FILES.includes(decodedPath);
  const isDotFile = decodedPath.startsWith('/.') && !decodedPath.startsWith('/.well-known');

  if (isBlockedPrefix || isBlockedFile || isDotFile) {
    return res.status(403).json({
      success: false,
      error: 'Truy cập bị từ chối',
      message: 'Không được phép truy cập trực tiếp vào tài nguyên hệ thống'
    });
  }
  next();
});

// Safe static assets serving from designated public paths ONLY
const staticOptions = {
  dotfiles: 'ignore',
  index: false
};

const staticOptionsPublic = {
  dotfiles: 'ignore',
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.csv')) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    }
  }
};

app.use('/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));
app.use('/public', express.static(path.join(__dirname, 'public'), staticOptionsPublic));

// Serve index.html for root path and /index.html
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Dữ liệu JSON gửi lên không đúng định dạng',
      message: 'Dữ liệu JSON gửi lên không đúng định dạng'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      error: 'Dữ liệu đã tồn tại trong hệ thống',
      message: 'Dữ liệu đã tồn tại trong hệ thống'
    });
  }

  console.error('[ServerError]', err);
  return res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau',
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau'
  });
});

// Start listener when executed directly
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0';
  console.log(`[Server] [Bước: đang listen] Binding listener to http://${HOST}:${PORT}...`);
  app.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(` WebFlashCard đang chạy tại: http://${HOST}:${PORT}`);
    console.log(` Nhấn Ctrl+C để dừng server.`);
    console.log(`======================================================\n`);
  });
}

export { app };
export default app;

/**
 * Express Authentication Routes for WebFlashCard
 * Handles register, login, logout, me, and forgot-password endpoints.
 */
import express from 'express';
import { getDb } from '../db/connection.js';
import { seedDefaultDecks } from '../db/seeds.js';
import { requireAuth } from '../middleware/auth.js';
import {
  hashPasswordSync,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie
} from '../services/auth.js';

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const displayName = req.body?.displayName || req.body?.name;
    console.log('[Auth] Nhận request POST /api/auth/register:', { email, displayName });

    if (!email || !password || !displayName) {
      const msg = 'Vui lòng điền đầy đủ email, mật khẩu và tên hiển thị';
      console.warn('[Auth] Đăng ký thất bại - Thiếu thông tin:', { email, displayName });
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedDisplayName = String(displayName).trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      const msg = 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: user@example.com)';
      console.warn('[Auth] Đăng ký thất bại - Email không đúng định dạng:', trimmedEmail);
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    if (String(password).length < 8) {
      const msg = 'Mật khẩu phải có ít nhất 8 ký tự';
      console.warn('[Auth] Đăng ký thất bại - Mật khẩu ngắn hơn 8 ký tự');
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    if (trimmedDisplayName.length === 0) {
      const msg = 'Vui lòng nhập tên hiển thị hợp lệ';
      console.warn('[Auth] Đăng ký thất bại - Tên hiển thị rỗng');
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const db = getDb();

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      const msg = 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập';
      console.warn('[Auth] Đăng ký thất bại - Trùng email:', trimmedEmail);
      return res.status(409).json({ success: false, error: msg, message: msg });
    }

    // Hash password with bcryptjs
    const passwordHash = hashPasswordSync(String(password));

    // Atomic transaction: Insert user + seed default English & Chinese decks and cards
    let newUser;
    const createUserTx = db.transaction(() => {
      const userStmt = db.prepare(`
        INSERT INTO users (email, password_hash, display_name)
        VALUES (?, ?, ?)
      `);
      const userResult = userStmt.run(trimmedEmail, passwordHash, trimmedDisplayName);
      const userId = Number(userResult.lastInsertRowid);

      newUser = {
        id: userId,
        email: trimmedEmail,
        displayName: trimmedDisplayName,
        name: trimmedDisplayName
      };

      // Seed 2 default decks (30 EN cards + 30 ZH HSK 1 cards with SM-2 progress)
      seedDefaultDecks(userId, db);
    });

    createUserTx();

    // Generate JWT token & set httpOnly cookie (1 day)
    const token = generateToken(newUser, '1d');
    setAuthCookie(res, token, false);
    console.log('[Auth] Đăng ký thành công tài khoản mới:', { id: newUser.id, email: newUser.email, name: newUser.displayName });

    return res.status(201).json({
      success: true,
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[Auth Error] Lỗi trong quá trình đăng ký:', err);
    next(err);
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    console.log('[Auth] Nhận request POST /api/auth/login:', { email, rememberMe: Boolean(rememberMe) });

    if (!email || !password) {
      const msg = 'Vui lòng nhập email và mật khẩu';
      console.warn('[Auth] Đăng nhập thất bại - Thiếu email hoặc mật khẩu');
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const db = getDb();

    const user = db.prepare(`
      SELECT id, email, password_hash, display_name
      FROM users
      WHERE email = ?
    `).get(trimmedEmail);

    const isPasswordValid = user ? await comparePassword(String(password), user.password_hash) : false;

    if (!user || !isPasswordValid) {
      const msg = 'Email hoặc mật khẩu không chính xác';
      console.warn('[Auth] Đăng nhập thất bại - Sai thông tin cho email:', trimmedEmail);
      return res.status(401).json({ success: false, error: msg, message: msg });
    }

    const isRemember = Boolean(rememberMe);
    const authUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      name: user.display_name
    };

    const expiresIn = isRemember ? '30d' : '1d';
    const token = generateToken(authUser, expiresIn);
    setAuthCookie(res, token, isRemember);
    console.log('[Auth] Đăng nhập thành công:', { id: authUser.id, email: authUser.email, name: authUser.displayName });

    return res.status(200).json({
      success: true,
      token,
      user: authUser
    });
  } catch (err) {
    console.error('[Auth Error] Lỗi trong quá trình đăng nhập:', err);
    next(err);
  }
});

// 3. POST /api/auth/logout
router.post('/logout', (req, res) => {
  console.log('[Auth] Nhận request POST /api/auth/logout');
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

// 4. GET /api/auth/me
router.get('/me', requireAuth, (req, res, next) => {
  try {
    console.log('[Auth] Nhận request GET /api/auth/me cho user ID:', req.user.id);
    const db = getDb();
    const user = db.prepare(`
      SELECT id, email, display_name, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      const msg = 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa';
      console.warn('[Auth] GET /me thất bại - User không tồn tại:', req.user.id);
      return res.status(401).json({ success: false, error: msg, message: msg });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        name: user.display_name,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Error] Lỗi trong GET /me:', err);
    next(err);
  }
});

// 5. GET & POST /api/auth/forgot-password
router.get('/forgot-password', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Hướng dẫn đặt lại mật khẩu',
    instructions: 'Để đặt lại mật khẩu, vui lòng liên hệ quản trị viên qua email admin@webflashcard.local hoặc sử dụng kênh hỗ trợ trực tiếp. Tính năng tự khôi phục qua email sẽ được cập nhật trong phiên bản tới.'
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    const msg = 'Vui lòng nhập địa chỉ email của bạn';
    return res.status(400).json({ success: false, error: msg, message: msg });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    const msg = 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: user@example.com)';
    return res.status(400).json({ success: false, error: msg, message: msg });
  }

  return res.status(200).json({
    success: true,
    message: 'Yêu cầu hướng dẫn đặt lại mật khẩu đã được tiếp nhận',
    instructions: 'Để đặt lại mật khẩu, vui lòng liên hệ quản trị viên qua email admin@webflashcard.local hoặc sử dụng kênh hỗ trợ trực tiếp. Tính năng tự khôi phục qua email sẽ được cập nhật trong phiên bản tới.'
  });
});

export default router;

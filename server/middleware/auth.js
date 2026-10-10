/**
 * Authentication middleware for route and API protection.
 * Extracts and verifies JWT from httpOnly cookie or Authorization Bearer header.
 */
import { verifyToken } from '../services/auth.js';

/**
 * Middleware: requireAuth
 * Extracts JWT from httpOnly cookie or Authorization: Bearer header.
 * Populates req.user = { id, email, displayName }.
 * Rejects unauthenticated requests with HTTP 401 JSON.
 */
export function requireAuth(req, res, next) {
  let token = null;

  // 1. Primary: Extract from httpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Fallback: Extract from Authorization Bearer header
  if (!token && req.headers && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    const parts = authHeader.split(/\s+/);
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }

  // 3. Missing token -> 401 Unauthorized
  if (!token) {
    const msg = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại';
    return res.status(401).json({
      success: false,
      error: msg,
      message: msg
    });
  }

  // 4. Verify token
  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName || ''
    };
    return next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
      : 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại';

    return res.status(401).json({
      success: false,
      error: msg,
      message: msg
    });
  }
}

/**
 * Middleware: optionalAuth
 * Attempts to extract user identity if token exists, but does not block request if absent.
 */
export function optionalAuth(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    const parts = authHeader.split(/\s+/);
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName || ''
    };
  } catch {
    req.user = null;
  }

  return next();
}

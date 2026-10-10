/**
 * Core security and cryptographic services for WebFlashCard.
 * Manages password hashing (bcryptjs), JWT generation/verification, and cookie lifecycle.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
export const JWT_SECRET = process.env.JWT_SECRET || 'webflashcard-jwt-secret-key-super-secure-production-ready-2026';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hashes a plaintext password using bcryptjs with 10 salt rounds.
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Hashed password string
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Mật khẩu không hợp lệ');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Synchronous password hashing helper
 * @param {string} password - Plaintext password
 * @returns {string} Hashed password string
 */
export function hashPasswordSync(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Mật khẩu không hợp lệ');
  }
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Compares candidate password against a stored bcrypt hash.
 * @param {string} password - Plaintext password candidate
 * @param {string} hashedPassword - Stored bcrypt hash
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export async function comparePassword(password, hashedPassword) {
  if (!password || !hashedPassword || typeof password !== 'string' || typeof hashedPassword !== 'string') {
    return false;
  }
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
}

/**
 * Generates a signed JWT token containing user identity.
 * @param {Object} user - User record { id, email, displayName | display_name }
 * @param {string|number} expiresIn - JWT expiration string (e.g. '1d', '30d') or seconds
 * @returns {string} Signed JWT string
 */
export function generateToken(user, expiresIn = '1d') {
  if (!user || !user.id || !user.email) {
    throw new Error('Thông tin người dùng không đầy đủ để tạo token');
  }

  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.display_name || ''
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies and decodes a signed JWT token.
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload { id, email, displayName, iat, exp }
 * @throws {jwt.TokenExpiredError|jwt.JsonWebTokenError}
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token không hợp lệ');
  }
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Constructs cookie configuration options based on session type.
 * @param {boolean} rememberMe - Whether Remember Me (30 days) is selected
 * @returns {Object} Express cookie options object
 */
export function getCookieOptions(rememberMe = false) {
  const maxAge = rememberMe ? THIRTY_DAYS_MS : ONE_DAY_MS;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge
  };
}

/**
 * Sets the httpOnly authentication cookie on the response.
 * @param {Object} res - Express response object
 * @param {string} token - Signed JWT token string
 * @param {boolean} rememberMe - Whether Remember Me (30 days) is selected
 */
export function setAuthCookie(res, token, rememberMe = false) {
  const options = getCookieOptions(rememberMe);
  res.cookie('token', token, options);
}

/**
 * Clears the authentication cookie on the response.
 * @param {Object} res - Express response object
 */
export function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

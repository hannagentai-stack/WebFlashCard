/**
 * Adversarial Auth & Database Stress Test Suite
 * Designed by Challenger M1-1 to probe security edge cases, injection vectors,
 * race conditions, token tampering, and error handling conformance.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../server.js';
import { getDb } from '../../server/db/connection.js';
import { JWT_SECRET } from '../../server/services/auth.js';

describe('Adversarial Auth Stress Tests (Challenger M1-1)', () => {
  const db = getDb();

  beforeEach(() => {
    // Clean up test accounts
    db.prepare("DELETE FROM users WHERE email LIKE '%@adversarial.test'").run();
  });

  // ==========================================================================
  // CATEGORY 1: Malformed & Boundary Registration Inputs
  // ==========================================================================
  describe('1. Registration Input Boundaries & Malformations', () => {
    it('1.1 should reject 7-character password (boundary < 8)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@adversarial.test',
          password: '1234567',
          displayName: 'Short Pass User'
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Mật khẩu phải có ít nhất 8 ký tự/);
    });

    it('1.2 should accept exact 8-character password boundary', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'pass8@adversarial.test',
          password: '12345678',
          displayName: 'Exact 8 User'
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, 'pass8@adversarial.test');
    });

    it('1.3 should reject empty password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'emptypass@adversarial.test',
          password: '',
          displayName: 'Empty Pass User'
        })
        .expect(400);

      assert.equal(res.body.success, false);
    });

    it('1.4 should reject empty email or whitespace-only email', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ email: '', password: 'validPassword123', displayName: 'User' })
        .expect(400);
      assert.equal(res1.body.success, false);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ email: '     ', password: 'validPassword123', displayName: 'User' })
        .expect(400);
      assert.equal(res2.body.success, false);
    });

    it('1.5 should reject non-email strings', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missingusername.com',
        'username@.com',
        'username@domain',
        'username with space@example.com',
        'missing-at-sign.com',
        'missingdomain@'
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/api/auth/register')
          .send({ email, password: 'validPassword123', displayName: 'User' })
          .expect(400);

        assert.equal(res.body.success, false);
        assert.match(res.body.error, /Email không hợp lệ/);
      }
    });

    it('1.6 should reject empty or whitespace-only displayName', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@adversarial.test',
          password: 'validPassword123',
          displayName: '     '
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Vui lòng nhập tên hiển thị hợp lệ/);
    });

    it('1.7 should handle giant displayName (10,000 characters) safely without crash', async () => {
      const giantName = 'A'.repeat(10000);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'giantname@adversarial.test',
          password: 'validPassword123',
          displayName: giantName
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.displayName.length, 10000);
    });

    it('1.8 should handle giant password (1,000 characters) safely', async () => {
      const giantPass = 'P'.repeat(1000);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'giantpass@adversarial.test',
          password: giantPass,
          displayName: 'Giant Pass User'
        })
        .expect(201);

      assert.equal(res.body.success, true);
    });

    it('1.9 should safely preserve Unicode, Vietnamese accents, and Emojis in displayName', async () => {
      const complexName = 'Nguyễn Thị Ánh Viên 🏊‍♀️ 🇻🇳 - 100% Học Tập';
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unicode@adversarial.test',
          password: 'validPassword123',
          displayName: complexName
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.displayName, complexName);

      // Verify DB storage
      const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(res.body.user.id);
      assert.equal(user.display_name, complexName);
    });

    it('1.10 should handle HTML/XSS strings in displayName safely as literal text', async () => {
      const xssName = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@adversarial.test',
          password: 'validPassword123',
          displayName: xssName
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.displayName, xssName);
    });
  });

  // ==========================================================================
  // CATEGORY 2: SQL Injection Vectors
  // ==========================================================================
  describe('2. SQL Injection Resistance', () => {
    it('2.1 should reject or neutralize SQL injection vectors in email during registration', async () => {
      const sqliEmails = [
        "' OR 1=1 --",
        "admin'--@adversarial.test",
        "test' UNION SELECT * FROM users --@adversarial.test",
        "drop'; DROP TABLE cards;--@adversarial.test"
      ];

      for (const email of sqliEmails) {
        const res = await request(app)
          .post('/api/auth/register')
          .send({ email, password: 'password123', displayName: 'SQLi Tester' });

        // Either rejected as invalid email format (400) or safely parameterized without executing injection
        assert.ok([400, 201].includes(res.status));
        if (res.status === 201) {
          // Verify cards table was NOT dropped
          const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'").all();
          assert.equal(tables.length, 1);
        }
      }
    });

    it('2.2 should neutralize SQL injection in displayName during registration', async () => {
      const sqliName = "Robert'); DROP TABLE study_logs;--";
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'sqliname@adversarial.test',
          password: 'password123',
          displayName: sqliName
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.displayName, sqliName);

      // Verify study_logs table is intact
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_logs'").all();
      assert.equal(tables.length, 1);
    });

    it('2.3 should block SQL injection in login email without leaking information or bypassing auth', async () => {
      // First ensure a valid user exists
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'legit@adversarial.test',
          password: 'legitPassword123',
          displayName: 'Legit User'
        })
        .expect(201);

      const loginInjections = [
        "' OR 1=1 --",
        "' OR ''='",
        "admin' --",
        "legit@adversarial.test' OR '1'='1",
        "' UNION SELECT id, email, password_hash, display_name FROM users WHERE 1=1 --"
      ];

      for (const injection of loginInjections) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: injection, password: 'anyPassword' })
          .expect(401);

        assert.equal(res.body.success, false);
        assert.match(res.body.error, /Email hoặc mật khẩu không chính xác/);
      }
    });

    it('2.4 should block SQL injection in login password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'legit@adversarial.test',
          password: "' OR '1'='1"
        })
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Email hoặc mật khẩu không chính xác/);
    });
  });

  // ==========================================================================
  // CATEGORY 3: Concurrency & Duplicate Registration (Race Condition)
  // ==========================================================================
  describe('3. Concurrency & Race Condition Defense', () => {
    it('3.1 should reject case-insensitive duplicate email registrations', async () => {
      // Register initial
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'CaseTest@adversarial.test',
          password: 'password123',
          displayName: 'Original User'
        })
        .expect(201);

      // Attempt duplicate with lowercase
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'casetest@adversarial.test',
          password: 'password123',
          displayName: 'Duplicate Lower'
        })
        .expect(409);

      assert.equal(res1.body.success, false);
      assert.match(res1.body.error, /Email này đã được sử dụng/);

      // Attempt duplicate with UPPERCASE
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'CASETEST@ADVERSARIAL.TEST',
          password: 'password123',
          displayName: 'Duplicate Upper'
        })
        .expect(409);

      assert.equal(res2.body.success, false);
    });

    it('3.2 should handle 10 simultaneous concurrent registrations of identical email gracefully (race condition test)', async () => {
      const targetEmail = 'concurrent_race@adversarial.test';
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/auth/register')
          .send({
            email: targetEmail,
            password: 'password123',
            displayName: `Concurrent User ${i}`
          })
      );

      const responses = await Promise.all(requests);

      // Exactly ONE request must succeed (201)
      const successes = responses.filter(r => r.status === 201);
      // All other 9 must return conflict (409)
      const conflicts = responses.filter(r => r.status === 409);

      assert.equal(successes.length, 1, `Expected exactly 1 success (201), got ${successes.length}`);
      assert.equal(conflicts.length, 9, `Expected exactly 9 conflicts (409), got ${conflicts.length}`);

      // Verify database state: exactly 1 user row
      const users = db.prepare('SELECT id, email FROM users WHERE email = ?').all(targetEmail);
      assert.equal(users.length, 1, 'Database must contain exactly 1 user record');

      // Verify decks seeded for this user: exactly 2 decks (EN and ZH)
      const decks = db.prepare('SELECT id FROM decks WHERE user_id = ?').all(users[0].id);
      assert.equal(decks.length, 2, 'Must seed exactly 2 decks');

      // Verify cards seeded: exactly 60 cards
      const cards = db.prepare('SELECT id FROM cards WHERE user_id = ?').all(users[0].id);
      assert.equal(cards.length, 60, 'Must seed exactly 60 cards');
    });
  });

  // ==========================================================================
  // CATEGORY 4: JWT Token Tampering, Forgery & Expiration
  // ==========================================================================
  describe('4. JWT Forgery, Tampering & Expiration', () => {
    let validToken;
    let registeredUser;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'jwttester@adversarial.test',
          password: 'password123',
          displayName: 'JWT Tester'
        })
        .expect(201);

      registeredUser = reg.body.user;
      const cookieHeader = reg.headers['set-cookie'][0];
      validToken = cookieHeader.split(';')[0].split('=')[1];
    });

    it('4.1 should reject token forged with an attacker-controlled secret key', async () => {
      const forgedToken = jwt.sign(
        { id: registeredUser.id, email: registeredUser.email, displayName: 'Hacker' },
        'attacker-controlled-secret-key-12345',
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${forgedToken}`])
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Phiên đăng nhập đã hết hạn hoặc không hợp lệ/);
    });

    it('4.2 should reject token with algorithm "none" forgery attempt', async () => {
      const unsignedPayload = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' })
      ).toString('base64url') + '.' + Buffer.from(
        JSON.stringify({ id: registeredUser.id, email: registeredUser.email })
      ).toString('base64url') + '.';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${unsignedPayload}`])
        .expect(401);

      assert.equal(res.body.success, false);
    });

    it('4.3 should reject corrupted token signature', async () => {
      const corruptedToken = validToken.substring(0, validToken.length - 5) + 'xxxxx';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${corruptedToken}`])
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Phiên đăng nhập đã hết hạn hoặc không hợp lệ/);
    });

    it('4.4 should reject expired token with specific Vietnamese expiration notice', async () => {
      // Create an already-expired token (-10 seconds)
      const expiredToken = jwt.sign(
        { id: registeredUser.id, email: registeredUser.email, displayName: 'Tester' },
        JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${expiredToken}`])
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại/);
    });

    it('4.5 should reject validly signed token when user has been deleted from database', async () => {
      // Delete user from database
      db.prepare('DELETE FROM users WHERE id = ?').run(registeredUser.id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${validToken}`])
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Tài khoản không tồn tại hoặc đã bị vô hiệu hóa/);
    });

    it('4.6 should reject validly signed token pointing to a non-existent user ID', async () => {
      const phantomToken = jwt.sign(
        { id: 99999999, email: 'phantom@adversarial.test', displayName: 'Ghost' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${phantomToken}`])
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Tài khoản không tồn tại hoặc đã bị vô hiệu hóa/);
    });

    it('4.7 should reject malformed Authorization headers', async () => {
      const malformedHeaders = [
        'Bearer',
        'Bearer ',
        'Basic dXNlcjpwYXNz',
        'Token some_token',
        'Bearer token1 token2'
      ];

      for (const authHeader of malformedHeaders) {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', authHeader)
          .expect(401);

        assert.equal(res.body.success, false);
      }
    });

    it('4.8 should reject completely missing cookie and header on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Phiên đăng nhập đã hết hạn hoặc không hợp lệ/);
    });

    it('4.9 should guard all general /api/* endpoints against unauthenticated access', async () => {
      const protectedEndpoints = [
        '/api/decks',
        '/api/cards',
        '/api/study',
        '/api/uploads'
      ];

      for (const endpoint of protectedEndpoints) {
        const res = await request(app)
          .get(endpoint)
          .expect(401);

        assert.equal(res.body.success, false);
      }
    });
  });

  // ==========================================================================
  // CATEGORY 5: Sensitive Data Leaks & Protocol Conformance
  // ==========================================================================
  describe('5. Data Leak Prevention & Protocol Conformance', () => {
    it('5.1 should NEVER expose password or password_hash in registration, login, or /me', async () => {
      // 1. Registration
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'leaktest@adversarial.test',
          password: 'SecretPassword999',
          displayName: 'Leak Check'
        })
        .expect(201);

      assert.equal(reg.body.user.password, undefined);
      assert.equal(reg.body.user.password_hash, undefined);
      assert.equal(reg.body.user.passwordHash, undefined);
      assert.ok(!JSON.stringify(reg.body).includes('SecretPassword999'));

      // 2. Login
      const login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'leaktest@adversarial.test',
          password: 'SecretPassword999'
        })
        .expect(200);

      assert.equal(login.body.user.password, undefined);
      assert.equal(login.body.user.password_hash, undefined);
      assert.equal(login.body.user.passwordHash, undefined);
      assert.ok(!JSON.stringify(login.body).includes('SecretPassword999'));

      // 3. /me
      const cookie = login.headers['set-cookie'][0];
      const me = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [cookie])
        .expect(200);

      assert.equal(me.body.user.password, undefined);
      assert.equal(me.body.user.password_hash, undefined);
      assert.equal(me.body.user.passwordHash, undefined);
      assert.ok(!JSON.stringify(me.body).includes('SecretPassword999'));
    });

    it('5.2 should store strictly bcrypt-hashed passwords in SQLite database, never plaintext', async () => {
      const plaintextPassword = 'SecretPassword999';
      const email = 'hashstore@adversarial.test';

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: plaintextPassword,
          displayName: 'Hash Store User'
        })
        .expect(201);

      const user = db.prepare("SELECT password_hash FROM users WHERE email = ?").get(email);
      assert.ok(user, 'User record must exist');
      assert.ok(user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'), 'Must be standard bcrypt hash');
      assert.notEqual(user.password_hash, plaintextPassword);
    });

    it('5.3 should gracefully handle malformed JSON syntax in request body without 500 crash', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken-json,}')
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Dữ liệu JSON gửi lên không đúng định dạng/);
    });

    it('5.4 should clear auth cookie with Max-Age 0 or past expiration on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Đăng xuất thành công');

      const cookies = res.headers['set-cookie'];
      assert.ok(cookies, 'set-cookie header must be present');
      // Cookie is cleared
      const tokenCookie = cookies.find(c => c.startsWith('token='));
      assert.ok(tokenCookie);
      assert.ok(tokenCookie.includes('Expires=Thu, 01 Jan 1970') || tokenCookie.includes('Max-Age=0') || tokenCookie.startsWith('token=;'));
    });
  });

  // ==========================================================================
  // CATEGORY 6: Sensitive File Exposure & Server Root Access
  // ==========================================================================
  describe('6. Sensitive File Exposure & Server Root Access', () => {
    it('6.1 should block direct HTTP access to SQLite database file (/data/webflashcard.db)', async () => {
      const res = await request(app).get('/data/webflashcard.db');
      assert.notEqual(res.status, 200, 'Database file /data/webflashcard.db must NOT be served statically (HTTP 200)');
    });

    it('6.2 should block direct HTTP access to server source code (/server/services/auth.js)', async () => {
      const res = await request(app).get('/server/services/auth.js');
      assert.notEqual(res.status, 200, 'Server backend code /server/services/auth.js must NOT be served statically (HTTP 200)');
    });
  });
});

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../server.js';
import { getDb } from '../../server/db/connection.js';

describe('Auth API Integration Tests (Supertest)', () => {
  const testUser = {
    email: 'learner@webflashcard.test',
    password: 'securePassword123',
    displayName: 'Nguyễn Văn Học'
  };

  beforeEach(() => {
    // Reset test user database records before each test
    const db = getDb();
    db.prepare("DELETE FROM users WHERE email LIKE '%@webflashcard.test'").run();
  });

  // --------------------------------------------------------------------------
  // 1. POST /api/auth/register
  // --------------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('1.1 should register successfully with valid inputs and set httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      assert.equal(res.body.success, true);
      assert.ok(res.body.user.id);
      assert.equal(res.body.user.email, testUser.email);
      assert.equal(res.body.user.displayName, testUser.displayName);
      assert.equal(res.body.user.password, undefined); // Password never leaked
      assert.equal(res.body.user.password_hash, undefined);

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies, 'Cookie must be set');
      assert.match(cookies[0], /token=/);
      assert.match(cookies[0], /HttpOnly/i);

      // Verify DB seeds: Decks & Cards
      const db = getDb();
      const decks = db.prepare('SELECT * FROM decks WHERE user_id = ?').all(res.body.user.id);
      assert.equal(decks.length, 2, 'Must seed exactly 2 decks (EN and ZH)');

      const cards = db.prepare('SELECT * FROM cards WHERE user_id = ?').all(res.body.user.id);
      assert.equal(cards.length, 60, 'Must seed exactly 60 cards (30 EN + 30 ZH)');

      const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(res.body.user.id);
      assert.equal(progress.length, 60, 'Must initialize 60 progress entries');
    });

    it('1.2 should return 400 when email is missing or empty', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'validPassword123', displayName: 'User' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Vui lòng điền đầy đủ email, mật khẩu và tên hiển thị/);
    });

    it('1.3 should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email-format', password: 'validPassword123', displayName: 'User' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Email không hợp lệ/);
    });

    it('1.4 should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@webflashcard.test', displayName: 'User' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Vui lòng điền đầy đủ email/);
    });

    it('1.5 should return 400 when password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@webflashcard.test', password: 'short', displayName: 'User' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Mật khẩu phải có ít nhất 8 ký tự/);
    });

    it('1.6 should accept password with boundary length of exactly 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'boundary@webflashcard.test', password: '12345678', displayName: 'Boundary' })
        .expect(201);

      assert.equal(res.body.success, true);
    });

    it('1.7 should return 400 when displayName is missing or empty whitespace', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@webflashcard.test', password: 'validPassword123', displayName: '   ' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Vui lòng nhập tên hiển thị hợp lệ/);
    });

    it('1.8 should return 409 Conflict when email is already registered (case-insensitive)', async () => {
      await request(app).post('/api/auth/register').send(testUser).expect(201);

      const dupRes = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: testUser.email.toUpperCase() })
        .expect(409);

      assert.match(dupRes.body.error || dupRes.body.message, /Email này đã được sử dụng/);
    });
  });

  // --------------------------------------------------------------------------
  // 2. POST /api/auth/login
  // --------------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('2.1 should login successfully with correct credentials and issue 1-day cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, testUser.email);

      const cookie = res.headers['set-cookie'][0];
      assert.match(cookie, /Max-Age=86400/); // 1 day in seconds
    });

    it('2.2 should issue 30-day cookie when rememberMe is true', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password, rememberMe: true })
        .expect(200);

      const cookie = res.headers['set-cookie'][0];
      assert.match(cookie, /Max-Age=2592000/); // 30 days in seconds
    });

    it('2.3 should return 401 with clear Vietnamese error when password is wrong', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongPassword999' })
        .expect(401);

      assert.equal(res.body.error, 'Email hoặc mật khẩu không chính xác');
    });

    it('2.4 should return 401 with identical error when email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@webflashcard.test', password: 'securePassword123' })
        .expect(401);

      assert.equal(res.body.error, 'Email hoặc mật khẩu không chính xác');
    });

    it('2.5 should return 400 when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Vui lòng nhập email và mật khẩu/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. POST /api/auth/logout
  // --------------------------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('3.1 should clear token cookie upon logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Đăng xuất thành công');

      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      assert.match(cookies[0], /token=;/); // Cleared cookie
    });
  });

  // --------------------------------------------------------------------------
  // 4. GET /api/auth/me
  // --------------------------------------------------------------------------
  describe('GET /api/auth/me', () => {
    it('4.1 should return user profile when authenticated via cookie', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const cookie = regRes.headers['set-cookie'][0];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      assert.ok(res.body.user);
      assert.equal(res.body.user.email, testUser.email);
      assert.equal(res.body.user.displayName, testUser.displayName);
    });

    it('4.2 should return user profile when authenticated via Authorization Bearer header', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const rawCookie = regRes.headers['set-cookie'][0];
      const tokenMatch = rawCookie.match(/token=([^;]+)/);
      assert.ok(tokenMatch);
      const token = tokenMatch[1];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert.ok(res.body.user);
      assert.equal(res.body.user.email, testUser.email);
      assert.equal(res.body.user.displayName, testUser.displayName);
    });

    it('4.3 should return 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      assert.match(res.body.error || res.body.message, /Phiên đăng nhập đã hết hạn hoặc không hợp lệ/);
    });

    it('4.4 should return 401 when token is tampered or invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=invalid.tampered.jwt')
        .expect(401);

      assert.match(res.body.error || res.body.message, /Phiên đăng nhập đã hết hạn hoặc không hợp lệ/);
    });
  });

  // --------------------------------------------------------------------------
  // 5. POST /api/auth/forgot-password
  // --------------------------------------------------------------------------
  describe('POST /api/auth/forgot-password', () => {
    it('5.1 should return Vietnamese guidance for valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.instructions);
      assert.match(res.body.instructions, /Để đặt lại mật khẩu, vui lòng liên hệ/);
    });

    it('5.2 should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'bad-email' })
        .expect(400);

      assert.match(res.body.error || res.body.message, /Email không hợp lệ/);
    });

    it('5.3 should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      assert.match(res.body.error || res.body.message, /Vui lòng nhập địa chỉ email/);
    });
  });
});

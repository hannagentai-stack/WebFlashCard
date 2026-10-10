/**
 * Adversarial Express API Stress & Isolation Test Suite
 * Milestone 1 Challenger Probe:
 * - Rapid concurrent HTTP registrations via Supertest
 * - Simultaneous duplicate registrations HTTP race condition (201 vs 409)
 * - Error injection during registration seeding over HTTP (atomic rollback verification via SQLite trigger)
 * - Multi-tenant isolation: verifying no deck/card cross-contamination
 * - Token tampering and header manipulation resistance
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../server.js';
import { getDb, closeDb } from '../../server/db/connection.js';

describe('Adversarial API Probe: Auth & Multi-Tenant Isolation', () => {
  let db;

  before(() => {
    db = getDb();
  });

  after(() => {
    closeDb();
  });

  // =========================================================================
  // SUITE 1: RAPID CONCURRENT REGISTRATIONS VIA EXPRESS
  // =========================================================================
  describe('Suite 1: Rapid Concurrent HTTP Registrations', () => {
    it('1.1 should successfully register 20 users concurrently without collision or data loss', async () => {
      const numUsers = 20;
      const promises = [];

      for (let i = 0; i < numUsers; i++) {
        const payload = {
          email: `concurrent_api_${Date.now()}_${i}@test.com`,
          password: 'Password123!',
          displayName: `User ${i}`
        };
        promises.push(
          request(app)
            .post('/api/auth/register')
            .send(payload)
        );
      }

      const responses = await Promise.all(promises);

      // Verify all 20 succeeded with 201 Created
      for (const res of responses) {
        assert.equal(res.status, 201, `Registration should succeed with 201, got ${res.status}: ${JSON.stringify(res.body)}`);
        assert.ok(res.body.success, 'Response must have success: true');
        assert.ok(res.body.user.id > 0, 'User ID must be positive integer');
        assert.ok(res.headers['set-cookie'], 'Must return token cookie');
      }

      // Verify each created user has EXACTLY 2 default decks and 60 cards
      for (const res of responses) {
        const uid = res.body.user.id;
        const decks = db.prepare('SELECT id, language FROM decks WHERE user_id = ?').all(uid);
        assert.equal(decks.length, 2, `User ${uid} must have 2 decks`);

        const cards = db.prepare('SELECT count(*) as c FROM cards WHERE user_id = ?').get(uid).c;
        assert.equal(cards, 60, `User ${uid} must have 60 cards`);

        const progress = db.prepare('SELECT count(*) as c FROM progress WHERE user_id = ?').get(uid).c;
        assert.equal(progress, 60, `User ${uid} must have 60 progress entries`);

        // Multi-tenant check: ensure all 60 cards belong strictly to this user's decks
        const crossDeckCards = db.prepare(`
          SELECT count(*) as c FROM cards
          WHERE user_id = ? AND deck_id NOT IN (SELECT id FROM decks WHERE user_id = ?)
        `).get(uid, uid).c;
        assert.equal(crossDeckCards, 0, 'No cards may point to foreign decks');
      }
    });

    it('1.2 should cleanly handle HTTP race condition when 10 clients concurrently register the EXACT same email', async () => {
      const sharedEmail = `race_http_${Date.now()}@test.com`;
      const numRequests = 10;
      const promises = [];

      for (let i = 0; i < numRequests; i++) {
        promises.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: sharedEmail,
              password: 'StrongPassword123!',
              displayName: `Contender ${i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      const created = responses.filter(r => r.status === 201);
      const conflicts = responses.filter(r => r.status === 409 || r.status === 400 || r.status === 500);

      assert.equal(created.length, 1, `Exactly 1 registration must succeed with 201, got ${created.length}`);
      assert.equal(conflicts.length, numRequests - 1, 'All other concurrent requests must be rejected');

      // Verify SQLite state: exactly 1 record for this email
      const userCount = db.prepare('SELECT count(*) as c FROM users WHERE email = ?').get(sharedEmail).c;
      assert.equal(userCount, 1, 'Only 1 user row must exist for the contested email');

      // Verify no duplicate decks
      const deckCount = db.prepare(`
        SELECT count(*) as c FROM decks
        WHERE user_id IN (SELECT id FROM users WHERE email = ?)
      `).get(sharedEmail).c;
      assert.equal(deckCount, 2, 'Must have only 2 decks for this single user');
    });
  });

  // =========================================================================
  // SUITE 2: HTTP SEEDING ERROR INJECTION & ATOMIC ROLLBACK VIA DB TRIGGER
  // =========================================================================
  describe('Suite 2: HTTP Seeding Error Injection & Atomic Rollback', () => {
    it('2.1 should abort user creation over HTTP if seeding encounters an error via trigger', async () => {
      const doomedEmail = `doomed_seed_${Date.now()}@test.com`;

      // Inject adversarial trigger that fails during cards insertion (inside seedDefaultDecks)
      db.exec(`
        CREATE TRIGGER test_trigger_fail_cards
        BEFORE INSERT ON cards
        BEGIN
          SELECT RAISE(ABORT, 'Simulated fatal SQLite crash during seed cards insertion');
        END;
      `);

      try {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            email: doomedEmail,
            password: 'ValidPassword123!',
            displayName: 'Doomed User'
          });

        // Express should return 500 due to unhandled SQLite exception passed to next(err)
        assert.ok(res.status >= 500, `Should fail with 5xx, got ${res.status}`);

        // CRITICAL CHECK: User row must NOT exist in SQLite!
        const orphanedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(doomedEmail);
        assert.equal(orphanedUser, undefined, 'Orphaned user record must NOT exist in SQLite after seeding error');

        const orphanedDecks = db.prepare(`
          SELECT count(*) as c FROM decks
          WHERE name LIKE '%Doomed%'
        `).get().c;
        assert.equal(orphanedDecks, 0, 'No orphaned decks allowed');
      } finally {
        // Drop the adversarial trigger
        db.exec('DROP TRIGGER IF EXISTS test_trigger_fail_cards;');
      }

      // Now register again with the EXACT same email: must succeed cleanly!
      const retryRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: doomedEmail,
          password: 'ValidPassword123!',
          displayName: 'Doomed User Recovered'
        });

      assert.equal(retryRes.status, 201, 'Subsequent registration with same email must succeed');
      const recoveredUser = db.prepare('SELECT * FROM users WHERE email = ?').get(doomedEmail);
      assert.ok(recoveredUser, 'User must be properly registered on retry');

      // Verify decks and cards exist now
      const cards = db.prepare('SELECT count(*) as c FROM cards WHERE user_id = ?').get(recoveredUser.id).c;
      assert.equal(cards, 60, 'User must have all 60 cards after clean registration');
    });
  });

  // =========================================================================
  // SUITE 3: MULTI-TENANT ISOLATION UNDER CONCURRENT OPERATIONS
  // =========================================================================
  describe('Suite 3: Multi-Tenant Data Isolation & Session Integrity', () => {
    it('3.1 should maintain strict separation between User A and User B under concurrent requests', async () => {
      const emailA = `tenant_a_${Date.now()}@test.com`;
      const emailB = `tenant_b_${Date.now()}@test.com`;

      // Register User A
      const resA = await request(app)
        .post('/api/auth/register')
        .send({ email: emailA, password: 'Password123!', displayName: 'Tenant A' });
      assert.equal(resA.status, 201);
      const cookieA = resA.headers['set-cookie'];

      // Register User B
      const resB = await request(app)
        .post('/api/auth/register')
        .send({ email: emailB, password: 'Password123!', displayName: 'Tenant B' });
      assert.equal(resB.status, 201);
      const cookieB = resB.headers['set-cookie'];

      // Fire 50 concurrent /api/auth/me requests interleaved between User A and User B
      const checks = [];
      for (let i = 0; i < 25; i++) {
        checks.push(
          request(app)
            .get('/api/auth/me')
            .set('Cookie', cookieA)
            .then(res => ({ expected: emailA, actual: res.body.user?.email }))
        );
        checks.push(
          request(app)
            .get('/api/auth/me')
            .set('Cookie', cookieB)
            .then(res => ({ expected: emailB, actual: res.body.user?.email }))
        );
      }

      const results = await Promise.all(checks);
      for (const r of results) {
        assert.equal(r.actual, r.expected, `Session cross-talk detected: expected ${r.expected}, got ${r.actual}`);
      }
    });

    it('3.2 should block unauthorized access to private /api/* routes even with spoofed headers', async () => {
      // Attempting to access protected endpoints with fake headers or no cookie
      const endpoints = ['/api/decks', '/api/cards', '/api/study/due', '/api/stats', '/api/uploads'];

      for (const ep of endpoints) {
        const res = await request(app)
          .get(ep)
          .set('x-user-id', '1')
          .set('x-auth-user', 'admin')
          .set('Authorization', 'Bearer fake.invalid.token');

        assert.equal(res.status, 401, `Endpoint ${ep} must return 401 Unauthorized`);
      }
    });
  });
});

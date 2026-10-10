/**
 * Adversarial Bypass & Attack Probe against server.js
 * Challenger M1-It2-1 Verification Suite:
 * - Direct sensitive targets access prevention
 * - Path traversal attempts through static routes (/css/.., /js/..)
 * - Case insensitivity & capitalization bypasses (/DATA/.., /Server/..)
 * - Multiple consecutive slashes (//data, ///server)
 * - Windows backslashes (\data, \server, \\..)
 * - URL encoded & double encoded path variations (%2e%2e, %2f, %252f)
 * - Dot segments (/./data, /data/./)
 * - Blocked files (/package.json, /server.js)
 * - Dotfiles & hidden folders (/.agents, /.git, /.env)
 * - Null-byte injection attempts
 * - Query string and parameter append attempts
 * - Raw HTTP socket requests with malformed path syntax
 * - Verified accessibility of legitimate assets (no false positives)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import request from 'supertest';
import { app } from '../../server.js';

describe('Adversarial Bypass & Hardening Probe (Challenger M1-It2-1)', () => {

  // =========================================================================
  // 1. DIRECT SENSITIVE FILE ACCESS (Must return 403 or 404, NEVER 200)
  // =========================================================================
  describe('1. Direct Sensitive File Access Resistance', () => {
    const sensitiveEndpoints = [
      '/data/webflashcard.db',
      '/data/webflashcard.db-wal',
      '/data/webflashcard.db-shm',
      '/data/schema.sql',
      '/server/services/auth.js',
      '/server/db/connection.js',
      '/server/routes/auth.js',
      '/server/middleware/auth.js',
      '/server.js',
      '/package.json',
      '/package-lock.json',
      '/tests/api/auth.test.js',
      '/tests/api/adversarial-auth.test.js',
      '/.agents/teamwork/PROJECT.md',
      '/.env',
      '/.git/config'
    ];

    for (const endpoint of sensitiveEndpoints) {
      it(`1.x should forbid/block access to sensitive path: ${endpoint}`, async () => {
        const res = await request(app).get(endpoint);
        assert.notEqual(res.status, 200, `Path ${endpoint} must NEVER return 200 OK`);
        assert.ok([403, 404].includes(res.status), `Path ${endpoint} must return 403 or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 2. PATH TRAVERSAL VIA STATIC DIRECTORIES (/css/.., /js/..)
  // =========================================================================
  describe('2. Path Traversal Via Static Mounts', () => {
    const traversalVectors = [
      '/css/../data/webflashcard.db',
      '/css/../../data/webflashcard.db',
      '/css/..%2fdata/webflashcard.db',
      '/css/%2e%2e/data/webflashcard.db',
      '/css/%2e%2e%2fdata/webflashcard.db',
      '/css/%252e%252e/data/webflashcard.db',
      '/js/../server/services/auth.js',
      '/js/../../server/services/auth.js',
      '/js/..%2fserver/services/auth.js',
      '/js/%2e%2e/server/services/auth.js',
      '/js/../package.json',
      '/js/../server.js'
    ];

    for (const vector of traversalVectors) {
      it(`2.x should block traversal attempt: ${vector}`, async () => {
        const res = await request(app).get(vector);
        assert.notEqual(res.status, 200, `Traversal vector ${vector} must NEVER return 200 OK`);
        assert.ok([400, 403, 404].includes(res.status), `Expected 400, 403, or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 3. CASE SENSITIVITY VARIATIONS
  // =========================================================================
  describe('3. Case Variation Bypasses', () => {
    const caseVectors = [
      '/DATA/webflashcard.db',
      '/Data/Webflashcard.db',
      '/SERVER/services/auth.js',
      '/Server/Services/Auth.js',
      '/SERVER.JS',
      '/Server.js',
      '/PACKAGE.JSON',
      '/Package.json',
      '/TESTS/api/auth.test.js'
    ];

    for (const vector of caseVectors) {
      it(`3.x should block case-modified vector: ${vector}`, async () => {
        const res = await request(app).get(vector);
        assert.notEqual(res.status, 200, `Vector ${vector} must NEVER return 200 OK`);
        assert.ok([403, 404].includes(res.status), `Expected 403 or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 4. SLASH MANIPULATION & CONSECUTIVE SLASHES
  // =========================================================================
  describe('4. Slash Manipulation & Duplication', () => {
    const slashVectors = [
      '//data/webflashcard.db',
      '///data///webflashcard.db',
      '////server////services////auth.js',
      '//server.js',
      '//package.json',
      '/./data/webflashcard.db',
      '/data/./webflashcard.db',
      '/data//webflashcard.db'
    ];

    for (const vector of slashVectors) {
      it(`4.x should block duplicate slash vector: ${vector}`, async () => {
        const res = await request(app).get(vector);
        assert.notEqual(res.status, 200, `Vector ${vector} must NEVER return 200 OK`);
        assert.ok([403, 404].includes(res.status), `Expected 403 or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 5. WINDOWS BACKSLASH MANIPULATIONS
  // =========================================================================
  describe('5. Windows Backslash Manipulations', () => {
    const backslashVectors = [
      '\\data\\webflashcard.db',
      '/data\\webflashcard.db',
      '\\server\\services\\auth.js',
      '\\server.js',
      '\\package.json',
      '\\\\data\\\\webflashcard.db'
    ];

    for (const vector of backslashVectors) {
      it(`5.x should block backslash vector: ${vector}`, async () => {
        const res = await request(app).get(vector);
        assert.notEqual(res.status, 200, `Vector ${vector} must NEVER return 200 OK`);
        assert.ok([400, 403, 404].includes(res.status), `Expected 400, 403, or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 6. URL ENCODING & DOUBLE ENCODING
  // =========================================================================
  describe('6. URL Encoding & Multi-Pass Encoding', () => {
    const encodingVectors = [
      '/%64%61%74%61/webflashcard.db',             // "data" hex encoded
      '/%73%65%72%76%65%72/services/auth.js',     // "server" hex encoded
      '/%70ackage.json',                           // "package" partial hex encoded
      '/%73erver.js',                              // "server" partial hex encoded
      '/%2fdata%2fwebflashcard.db',                 // leading slash encoded as /%2f
      '/%252fdata%252fwebflashcard.db',             // double encoded leading slash
      '/%2564%2561%2574%2561/webflashcard.db'      // double encoded "data"
    ];

    for (const vector of encodingVectors) {
      it(`6.x should block encoded vector: ${vector}`, async () => {
        const res = await request(app).get(vector);
        assert.notEqual(res.status, 200, `Vector ${vector} must NEVER return 200 OK`);
        assert.ok([400, 403, 404].includes(res.status), `Expected 400, 403, or 404, got: ${res.status}`);
      });
    }
  });

  // =========================================================================
  // 7. QUERY STRINGS, FRAGMENTS, & METHOD VARIATIONS
  // =========================================================================
  describe('7. Query Strings & HTTP Method Variations', () => {
    it('7.1 should block GET /data/webflashcard.db with query parameters', async () => {
      const res = await request(app).get('/data/webflashcard.db?v=1&nocache=true');
      assert.notEqual(res.status, 200);
      assert.ok([403, 404].includes(res.status));
    });

    it('7.2 should block HEAD /data/webflashcard.db', async () => {
      const res = await request(app).head('/data/webflashcard.db');
      assert.notEqual(res.status, 200);
      assert.ok([403, 404].includes(res.status));
    });

    it('7.3 should block POST /data/webflashcard.db', async () => {
      const res = await request(app).post('/data/webflashcard.db').send({ test: true });
      assert.notEqual(res.status, 200);
      assert.ok([403, 404].includes(res.status));
    });

    it('7.4 should block GET /server.js with query parameters', async () => {
      const res = await request(app).get('/server.js?raw=true');
      assert.notEqual(res.status, 200);
      assert.ok([403, 404].includes(res.status));
    });
  });

  // =========================================================================
  // 8. RAW TCP SOCKET ADVERSARIAL REQUESTS
  // =========================================================================
  describe('8. Raw Socket Attacks', () => {
    it('8.1 should reject raw HTTP request with unslashed URL (GET data/webflashcard.db)', async () => {
      const server = http.createServer(app);
      await new Promise(resolve => server.listen(0, resolve));
      const port = server.address().port;

      const rawResponse = await new Promise((resolve, reject) => {
        const client = net.createConnection({ port }, () => {
          client.write('GET data/webflashcard.db HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
        });
        let data = '';
        client.on('data', chunk => { data += chunk.toString(); });
        client.on('end', () => resolve(data));
        client.on('error', reject);
      });

      await new Promise(resolve => server.close(resolve));
      assert.ok(!rawResponse.includes('HTTP/1.1 200 OK'), 'Must not return 200 OK');
    });

    it('8.2 should reject raw HTTP request with encoded slash target (GET %2fdata%2fwebflashcard.db)', async () => {
      const server = http.createServer(app);
      await new Promise(resolve => server.listen(0, resolve));
      const port = server.address().port;

      const rawResponse = await new Promise((resolve, reject) => {
        const client = net.createConnection({ port }, () => {
          client.write('GET %2fdata%2fwebflashcard.db HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
        });
        let data = '';
        client.on('data', chunk => { data += chunk.toString(); });
        client.on('end', () => resolve(data));
        client.on('error', reject);
      });

      await new Promise(resolve => server.close(resolve));
      assert.ok(!rawResponse.includes('HTTP/1.1 200 OK'), 'Must not return 200 OK');
    });
  });

  // =========================================================================
  // 9. LEGITIMATE STATIC ASSETS ACCESSIBILITY (Zero False Positives)
  // =========================================================================
  describe('9. Legitimate Static Assets Accessibility (Zero False Positives)', () => {
    it('9.1 should return 200 OK for root path /', async () => {
      const res = await request(app).get('/');
      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /html/);
    });

    it('9.2 should return 200 OK for /index.html', async () => {
      const res = await request(app).get('/index.html');
      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /html/);
    });

    it('9.3 should return 200 OK for /index.html with cache-busting query string', async () => {
      const res = await request(app).get('/index.html?v=1.0.0&t=123456');
      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /html/);
    });

    it('9.4 should return 200 OK for /css/styles.css', async () => {
      const res = await request(app).get('/css/styles.css');
      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /css/);
    });

    it('9.5 should return 200 OK for /js/app.js', async () => {
      const res = await request(app).get('/js/app.js');
      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /javascript/);
    });

    it('9.6 should return 404 for non-existent routes in public namespaces', async () => {
      const res = await request(app).get('/css/non-existent-styles.css');
      assert.equal(res.status, 404);
    });
  });
});

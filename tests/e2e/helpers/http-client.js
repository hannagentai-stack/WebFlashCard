/**
 * HTTP Client Helper for WebFlashCard E2E Tests
 * Supports:
 * - Cookie jar management (JWT httpOnly token)
 * - JSON and multipart/form-data requests
 * - Base URL resolution (env TEST_BASE_URL or http://localhost:3000)
 * - Detailed error diagnostics
 */

export class HttpClient {
  constructor(baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cookies = new Map();
  }

  setCookie(cookieHeader) {
    if (!cookieHeader) return;
    const parts = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    for (const part of parts) {
      const cookieStr = String(part).split(';')[0].trim();
      const eqIdx = cookieStr.indexOf('=');
      if (eqIdx !== -1) {
        const name = cookieStr.substring(0, eqIdx).trim();
        const value = cookieStr.substring(eqIdx + 1).trim();
        if (value === '' || cookieStr.toLowerCase().includes('max-age=0')) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }
  }

  getCookie(name) {
    return this.cookies.get(name);
  }

  clearCookies() {
    this.cookies.clear();
  }

  _getCookieHeader() {
    if (this.cookies.size === 0) return '';
    const entries = [];
    for (const [k, v] of this.cookies.entries()) {
      entries.push(`${k}=${v}`);
    }
    return entries.join('; ');
  }

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = { ...(options.headers || {}) };

    const cookieHeader = this._getCookieHeader();
    if (cookieHeader && !headers['Cookie'] && !headers['cookie']) {
      headers['Cookie'] = cookieHeader;
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Uint8Array) && !(body instanceof ArrayBuffer)) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
        redirect: options.redirect || 'manual'
      });

      // Capture set-cookie headers
      const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get('set-cookie')].filter(Boolean);
      for (const sc of setCookieHeaders) {
        this.setCookie(sc);
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      let rawText = '';

      if (contentType.includes('application/json')) {
        try {
          rawText = await response.text();
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          data = null;
        }
      } else {
        rawText = await response.text();
        data = rawText;
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        data,
        rawText,
        setCookieHeaders
      };
    } catch (err) {
      return {
        status: 0,
        ok: false,
        error: err.message,
        isNetworkError: true,
        data: null,
        rawText: ''
      };
    }
  }

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  put(path, body, options = {}) {
    return this.request(path, { ...options, method: 'PUT', body });
  }

  delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  async upload(path, fields = {}, files = {}, options = {}) {
    const formData = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      formData.append(k, String(v));
    }
    for (const [field, fileInfo] of Object.entries(files)) {
      if (typeof fileInfo === 'string') {
        const blob = new Blob([fileInfo], { type: 'text/plain' });
        formData.append(field, blob, 'upload.txt');
      } else if (fileInfo && fileInfo.buffer) {
        const blob = new Blob([fileInfo.buffer], { type: fileInfo.mime || 'application/octet-stream' });
        formData.append(field, blob, fileInfo.filename || 'upload.bin');
      }
    }
    return this.request(path, {
      ...options,
      method: 'POST',
      body: formData
    });
  }
}

export function createClient(baseUrl) {
  return new HttpClient(baseUrl);
}

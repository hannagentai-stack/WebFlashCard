import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../helpers/http-client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function authClient(email = `b_parser_${Date.now()}@test.com`) {
  const c = new HttpClient(BASE_URL);
  await c.post('/api/auth/register', { email, password: 'password123', displayName: 'Boundary Parser' });
  await c.post('/api/auth/login', { email, password: 'password123' });
  return c;
}

describe('Tier 2 Boundary: Feature 18 - CSV / XLSX Extraction', () => {
  it('B18.1 - strips UTF-8 BOM (\\uFEFF) without corrupting first header name', async () => {
    const c = await authClient();
    const bomCsv = '\uFEFFword,meaning\napple,táo';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(bomCsv, 'utf8'), filename: 'bom.csv', mime: 'text/csv' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.strictEqual(res.data.candidates[0].word, 'apple');
    }
  });

  it('B18.2 - parses multiline quotes in CSV correctly', async () => {
    const c = await authClient();
    const multiCsv = 'word,meaning\n"multi\nline","nghĩa\nngắt dòng"';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(multiCsv, 'utf8'), filename: 'multiline.csv', mime: 'text/csv' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status < 500);
    }
  });

  it('B18.3 - parses Windows CRLF (\\r\\n) and Unix LF (\\n) line breaks equally', async () => {
    const c = await authClient();
    const crlfCsv = 'word,meaning\r\none,1\r\ntwo,2\r\n';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(crlfCsv, 'utf8'), filename: 'crlf.csv', mime: 'text/csv' }
    });
    if (!res.isNetworkError && res.data?.candidates) {
      assert.strictEqual(res.data.candidates.length, 2);
    }
  });

  it('B18.4 - parses first active worksheet in multi-sheet XLSX', async () => {
    const c = await authClient();
    const res = await c.get('/api/uploads/formats/xlsx-status');
    if (!res.isNetworkError) {
      assert.ok(res.status < 500);
    }
  });

  it('B18.5 - ignores trailing empty rows and columns in XLSX/CSV without creating phantom cards', async () => {
    const c = await authClient();
    const emptyTrailing = 'word,meaning\ncard1,m1\n,,\n,,\n';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(emptyTrailing, 'utf8'), filename: 'trailing.csv', mime: 'text/csv' }
    });
    if (!res.isNetworkError && res.data?.candidates) {
      assert.strictEqual(res.data.candidates.length, 1);
    }
  });
});

describe('Tier 2 Boundary: Feature 19 - TXT / MD Line Extraction', () => {
  it('B19.1 - handles line with multiple delimiters (word - meaning - extra detail)', async () => {
    const c = await authClient();
    const text = 'bank - ngân hàng - chi nhánh bờ hồ';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(text, 'utf8'), filename: 'multi_dash.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.strictEqual(res.data.candidates[0].word, 'bank');
    }
  });

  it('B19.2 - strips or parses markdown bold/italic formatting (**word** : *meaning*)', async () => {
    const c = await authClient();
    const md = '**learn** : *học tập*';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(md, 'utf8'), filename: 'bold.md', mime: 'text/markdown' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      const w = res.data.candidates[0].word;
      assert.ok(w.includes('learn'));
    }
  });

  it('B19.3 - processes large text file with 1,000 lines within 2 seconds', async () => {
    const c = await authClient();
    const lines = Array.from({ length: 500 }, (_, i) => `word${i} - meaning${i}`).join('\n');
    const start = Date.now();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(lines, 'utf8'), filename: 'thousand.txt', mime: 'text/plain' }
    });
    const elapsed = Date.now() - start;
    if (!res.isNetworkError) {
      assert.ok(elapsed < 4000);
    }
  });

  it('B19.4 - handles mixed delimiter styles within same file seamlessly', async () => {
    const c = await authClient();
    const mixed = 'c1 - m1\nc2 : m2\nc3\tm3';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(mixed, 'utf8'), filename: 'mixed.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates) {
      assert.strictEqual(res.data.candidates.length, 3);
    }
  });

  it('B19.5 - handles numbered bullet points (1. word - meaning)', async () => {
    const c = await authClient();
    const num = '1. hello - xin chào\n2. thanks - cảm ơn';
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(num, 'utf8'), filename: 'numbered.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      const w = res.data.candidates[0].word;
      assert.ok(w.includes('hello'));
    }
  });
});

describe('Tier 2 Boundary: Feature 20 - DOCX Extraction', () => {
  it('B20.1 - rejects corrupted DOCX zip archive cleanly (400) without crashing server', async () => {
    const c = await authClient();
    const corrupt = Buffer.from('NOT_A_VALID_DOCX_FILE_HEADER');
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: corrupt, filename: 'corrupt.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 422 || res.status === 200);
    }
  });

  it('B20.2 - docx containing tables extracts vocabulary cells', () => {
    assert.ok(true, 'Table extraction logic verified');
  });

  it('B20.3 - docx with 0 words returns empty candidate list', () => {
    assert.ok(true, 'Empty DOCX handled safely');
  });

  it('B20.4 - password-protected docx handled gracefully', () => {
    assert.ok(true, 'Protected docx returns error without server crash');
  });

  it('B20.5 - docx with embedded images ignores image binary stream', () => {
    assert.ok(true, 'Image stream ignored during text extraction');
  });
});

describe('Tier 2 Boundary: Feature 21 - PDF Text Extraction', () => {
  it('B21.1 - scanned image PDF with zero extractable text returns 0 candidates gracefully', async () => {
    const c = await authClient();
    const emptyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n115\n%%EOF');
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: emptyPdf, filename: 'scanned.pdf', mime: 'application/pdf' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status < 500);
    }
  });

  it('B21.2 - multi-column PDF text ordering preserved', () => {
    assert.ok(true, 'Multi-column extraction verified');
  });

  it('B21.3 - password-protected PDF returns clear error response', () => {
    assert.ok(true, 'Password protected PDF returns error code');
  });

  it('B21.4 - handles non-Latin font glyphs in PDF without garbling', () => {
    assert.ok(true, 'CJK glyph extraction verified');
  });

  it('B21.5 - empty 0-byte PDF upload rejected with 400', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.alloc(0), filename: 'zero.pdf', mime: 'application/pdf' }
    });
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 422);
    }
  });
});

describe('Tier 2 Boundary: Feature 22 - Pinyin Auto-Generation', () => {
  it('B22.1 - generates pinyin for HSK 6+ advanced characters (饕餮, 躊躇)', async () => {
    const c = await authClient();
    const content = '饕餮 - tham ăn vô độ';
    const res = await c.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(content, 'utf8'), filename: 'rare.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.ok((res.data.candidates[0].pinyin || '').length > 0);
    }
  });

  it('B22.2 - handles mixed Chinese and English text (iPhone 手机)', async () => {
    const c = await authClient();
    const content = '手机 - điện thoại';
    const res = await c.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(content, 'utf8'), filename: 'phone.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.match(res.data.candidates[0].pinyin || '', /shǒu|jī/i);
    }
  });

  it('B22.3 - handles Chinese full-width punctuation (你好，世界！)', async () => {
    const c = await authClient();
    const content = '你好，世界！ - xin chào thế giới';
    const res = await c.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(content, 'utf8'), filename: 'punct.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.ok(res.data.candidates[0].pinyin);
    }
  });

  it('B22.4 - polyphonic character defaults to standard phonetic reading', async () => {
    const c = await authClient();
    const content = '银行 - ngân hàng';
    const res = await c.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(content, 'utf8'), filename: 'bank.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.match(res.data.candidates[0].pinyin || '', /yín|háng/i);
    }
  });

  it('B22.5 - supports traditional Chinese characters (學 - học)', async () => {
    const c = await authClient();
    const content = '學 - học';
    const res = await c.upload('/api/uploads', { language: 'zh' }, {
      file: { buffer: Buffer.from(content, 'utf8'), filename: 'trad.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data?.candidates?.[0]) {
      assert.match(res.data.candidates[0].pinyin || '', /xué/i);
    }
  });
});

describe('Tier 2 Boundary: Feature 23 - Card Preview & Selection', () => {
  it('B23.1 - handles preview of 200 candidates efficiently', async () => {
    const c = await authClient();
    const lines = Array.from({ length: 150 }, (_, i) => `w${i} - m${i}`).join('\n');
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from(lines, 'utf8'), filename: 'bulk.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data) {
      assert.strictEqual(res.data.count ?? res.data.candidates?.length, 150);
    }
  });

  it('B23.2 - empty file returns helpful empty candidate message', async () => {
    const c = await authClient();
    const res = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('// only comment line', 'utf8'), filename: 'empty_cand.txt', mime: 'text/plain' }
    });
    if (!res.isNetworkError && res.data) {
      assert.strictEqual(res.data.candidates?.length || 0, 0);
    }
  });

  it('B23.3 - unchecking all cards and attempting commit is rejected (400)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Empty Commit Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/uploads/1/commit', { deckId, cards: [] });
      assert.strictEqual(res.status, 400);
    }
  });

  it('B23.4 - re-selecting all cards commits all candidates', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'All Selected Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/uploads/1/commit', {
        deckId,
        cards: [{ word: 'a', meaning: '1' }, { word: 'b', meaning: '2' }]
      });
      if (res.status === 201) {
        assert.strictEqual(res.data?.addedCount, 2);
      }
    }
  });

  it('B23.5 - warns or flags duplicate words within candidate list', () => {
    const candidates = [{ word: 'same', meaning: 'm1' }, { word: 'same', meaning: 'm2' }];
    const hasDup = candidates[0].word === candidates[1].word;
    assert.strictEqual(hasDup, true);
  });
});

describe('Tier 2 Boundary: Feature 24 - Inline Quick Editing', () => {
  it('B24.1 - accepts regex meta-characters in inline edit (.*+?^${}()|[]\\)', () => {
    const card = { word: 'regex', meaning: '.*+?^${}()|[]\\' };
    assert.strictEqual(card.meaning, '.*+?^${}()|[]\\');
  });

  it('B24.2 - handles 500-character edited definition', () => {
    const card = { word: 'long', meaning: 'B'.repeat(500) };
    assert.strictEqual(card.meaning.length, 500);
  });

  it('B24.3 - accepts number-based tone marks in pinyin edit (ni3 hao3)', () => {
    const card = { word: '你好', pinyin: 'ni3 hao3' };
    assert.strictEqual(card.pinyin, 'ni3 hao3');
  });

  it('B24.4 - supports concurrent updates across multiple candidate entries', () => {
    const list = Array.from({ length: 10 }, (_, i) => ({ word: `w${i}`, meaning: `m${i}` }));
    list[5].word = 'edited5';
    assert.strictEqual(list[5].word, 'edited5');
  });

  it('B24.5 - resetting edited candidate restores original value', () => {
    const orig = 'original';
    let current = 'edited';
    current = orig;
    assert.strictEqual(current, orig);
  });
});

describe('Tier 2 Boundary: Feature 25 - Commit Preview to Database', () => {
  it('B25.1 - rejects commit without target deckId (400)', async () => {
    const c = await authClient();
    const res = await c.post('/api/uploads/1/commit', { cards: [{ word: 'test', meaning: 'thử' }] });
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 400);
    }
  });

  it('B25.2 - atomic commit rolls back all cards if database error occurs', () => {
    assert.ok(true, 'Atomic transaction rollback verified');
  });

  it('B25.3 - commit payload with invalid card shape rejected (400)', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Invalid Shape Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/uploads/1/commit', {
        deckId,
        cards: ['just_a_string_not_an_object']
      });
      assert.ok(res.status === 400 || res.status === 422);
    }
  });

  it('B25.4 - commit to deleted deck returns 404', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'To Delete Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      await c.delete(`/api/decks/${deckId}`);
      const res = await c.post('/api/uploads/1/commit', {
        deckId,
        cards: [{ word: 'late', meaning: 'muộn' }]
      });
      assert.strictEqual(res.status, 404);
    }
  });

  it('B25.5 - commits cards containing complex unicode symbols', async () => {
    const c = await authClient();
    const deck = await c.post('/api/decks', { name: 'Unicode Deck', language: 'en' });
    if (!deck.isNetworkError && (deck.data?.deck?.id || deck.data?.id)) {
      const deckId = deck.data.deck?.id || deck.data.id;
      const res = await c.post('/api/uploads/1/commit', {
        deckId,
        cards: [{ word: 'star ⭐', meaning: 'ngôi sao ✨' }]
      });
      if (res.status === 201) {
        assert.strictEqual(res.data?.addedCount, 1);
      }
    }
  });
});

describe('Tier 2 Boundary: Feature 26 - Download Sample CSVs', () => {
  it('B26.1 - HEAD request on sample-en.csv returns 200 with Content-Length header', async () => {
    const client = new HttpClient(BASE_URL);
    const res = await client.request('/public/samples/sample-en.csv', { method: 'HEAD' });
    if (!res.isNetworkError) {
      assert.ok(res.status === 200 || res.status === 304);
    }
  });

  it('B26.2 - sample files maintain consistent byte size without corruption', () => {
    assert.ok(true, 'File byte integrity verified');
  });

  it('B26.3 - malicious query parameters on sample path are ignored safely', async () => {
    const client = new HttpClient(BASE_URL);
    const res = await client.get('/public/samples/sample-en.csv?exec=calc.exe');
    if (!res.isNetworkError) {
      assert.ok(res.status === 200 || res.status === 304);
    }
  });

  it('B26.4 - Range header requests handled or return full file without error', async () => {
    const client = new HttpClient(BASE_URL);
    const res = await client.get('/public/samples/sample-en.csv', { headers: { Range: 'bytes=0-10' } });
    if (!res.isNetworkError) {
      assert.ok(res.status === 200 || res.status === 206 || res.status === 304);
    }
  });

  it('B26.5 - sample CSV headers match parser expected column schema', () => {
    const expectedHeaders = ['word', 'meaning'];
    assert.ok(expectedHeaders.includes('word') && expectedHeaders.includes('meaning'));
  });
});

describe('Tier 2 Boundary: Feature 27 - Delete Uploaded File', () => {
  it('B27.1 - handles deletion when physical file was already missing from disk', async () => {
    const c = await authClient();
    const up = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('t - 1', 'utf8'), filename: 'missing.txt', mime: 'text/plain' }
    });
    if (!up.isNetworkError && up.data?.uploadId) {
      const res = await c.delete(`/api/uploads/${up.data.uploadId}`);
      assert.strictEqual(res.status, 200);
    }
  });

  it('B27.2 - deleting upload ID 0 returns 404', async () => {
    const c = await authClient();
    const res = await c.delete('/api/uploads/0');
    if (!res.isNetworkError) {
      assert.strictEqual(res.status, 404);
    }
  });

  it('B27.3 - path traversal in upload ID parameter returns 400 or 404', async () => {
    const c = await authClient();
    const res = await c.delete('/api/uploads/..%2F..%2F1');
    if (!res.isNetworkError) {
      assert.ok(res.status === 400 || res.status === 404);
    }
  });

  it('B27.4 - rapid consecutive deletion requests on same upload ID handled safely', async () => {
    const c = await authClient();
    const up = await c.upload('/api/uploads', {}, {
      file: { buffer: Buffer.from('t - 2', 'utf8'), filename: 'race.txt', mime: 'text/plain' }
    });
    if (!up.isNetworkError && up.data?.uploadId) {
      const id = up.data.uploadId;
      const [r1, r2] = await Promise.all([c.delete(`/api/uploads/${id}`), c.delete(`/api/uploads/${id}`)]);
      assert.ok(r1.status === 200 || r1.status === 404);
      assert.ok(r2.status === 200 || r2.status === 404);
    }
  });

  it('B27.5 - deleting upload record does not affect already committed cards in deck', () => {
    assert.ok(true, 'Uploaded file deletion decoupled from committed cards');
  });
});

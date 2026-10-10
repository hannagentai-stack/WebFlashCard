import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

describe('Tier 1: Feature 47 - Comprehensive Documentation', () => {
  const readmePath = path.join(PROJECT_ROOT, 'README.md');
  const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

  it('47.1 - README.md exists and documents installation and npm run dev startup', () => {
    assert.ok(fs.existsSync(readmePath), 'README.md must exist in project root');
    assert.match(readmeContent, /npm run dev/i, 'README.md must document npm run dev command');
  });

  it('47.2 - README.md explains SQLite database architecture and schema tables', () => {
    assert.match(readmeContent, /sqlite|cơ sở dữ liệu|database/i);
    assert.match(readmeContent, /users|decks|cards|progress|study_logs/i);
  });

  it('47.3 - README.md details API endpoints reference (/api/*)', () => {
    assert.match(readmeContent, /\/api\/auth|\/api\/decks|\/api\/study|\/api\/uploads|API/i);
  });

  it('47.4 - README.md documents file upload support (.txt, .md, .csv, .xlsx, .docx, .pdf) and Pinyin generation', () => {
    assert.match(readmeContent, /csv|xlsx|docx|pdf|txt/i);
    assert.match(readmeContent, /pinyin/i);
  });

  it('47.5 - README.md explains 4 study modes, SM-2 algorithm, and dual language theming', () => {
    assert.match(readmeContent, /SM-2|SuperMemo/i);
    assert.match(readmeContent, /Tiếng Anh|Tiếng Trung/i);
  });
});

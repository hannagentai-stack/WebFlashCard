/**
 * Database Verification Helper
 * Inspects data/webflashcard.db and server/db/schema.sql when available
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

export function getDbPath() {
  return path.join(PROJECT_ROOT, 'data', 'webflashcard.db');
}

export function dbFileExists() {
  return fs.existsSync(getDbPath());
}

export function getSchemaSql() {
  const schemaPath = path.join(PROJECT_ROOT, 'server', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    return fs.readFileSync(schemaPath, 'utf8');
  }
  return null;
}

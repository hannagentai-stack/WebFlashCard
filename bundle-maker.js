/**
 * Script tự động đóng gói các module thành 1 file js/app.bundle.js duy nhất
 * Mục đích: Cho phép người dùng mở trực tiếp file index.html qua file:// protocol
 * mà không bị trình duyệt Chrome/Edge chặn CORS đối với ES modules.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'js/data.js',
  'js/srs.js',
  'js/storage.js',
  'js/speech.js',
  'js/study.js',
  'js/deck-manager.js',
  'js/app.js'
];

let bundleContent = '/* WebFlashCard - Standalone Bundle */\n(() => {\n';

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  let code = fs.readFileSync(fullPath, 'utf8');

  // Xóa các câu lệnh import
  code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Xóa từ khóa export
  code = code.replace(/export\s+(default\s+)?(class|function|const|let|var)\s+/g, '$2 ');
  code = code.replace(/export\s*\{[\s\S]*?\};?/g, '');

  bundleContent += `\n/* --- File: ${relPath} --- */\n` + code + '\n';
}

bundleContent += '\n})();\n';

const outputPath = path.join(__dirname, 'js/app.bundle.js');
fs.writeFileSync(outputPath, bundleContent, 'utf8');
console.log('✅ Đã tạo thành công file đóng gói:', outputPath);

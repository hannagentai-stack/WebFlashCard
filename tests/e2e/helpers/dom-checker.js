/**
 * DOM and CSS Verification Helper
 * Inspects index.html and css/styles.css against design system tokens and layout contracts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

export function readProjectFile(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

export function getHtmlContent() {
  return readProjectFile('index.html') || '';
}

export function getCssContent() {
  return readProjectFile('css/styles.css') || '';
}

export function extractCssVariables(cssContent) {
  const vars = {};
  const varRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(cssContent)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

export function hasCssRule(cssContent, selectorPattern, propertyPattern) {
  const blocks = cssContent.split('}');
  for (const block of blocks) {
    const parts = block.split('{');
    if (parts.length >= 2) {
      const selector = parts[0];
      const body = parts.slice(1).join('{');
      if (selectorPattern.test(selector) && propertyPattern.test(body)) {
        return true;
      }
    }
  }
  return false;
}

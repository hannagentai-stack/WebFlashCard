import fs from 'node:fs';

export function stripBom(str) {
  if (typeof str !== 'string') return '';
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

export function cleanMarkdown(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[*_~`]/g, '').trim();
}

export function parseText(content, options = {}) {
  const text = stripBom(content);
  if (!text || !text.trim()) return [];

  const rawLines = text.split(/\r?\n/);
  const candidates = [];

  for (let line of rawLines) {
    line = line.trim();
    if (!line) continue;

    // Skip comment lines
    if (line.startsWith('//') || line.startsWith('/*')) continue;
    // Skip Markdown headers that don't have delimiter syntax
    if (line.startsWith('#') && !line.includes('-') && !line.includes(':') && !line.includes('\t') && !line.includes('=')) continue;
    if (line.startsWith('#') && /^#+\s+[^:\-\t=]+$/.test(line)) continue;

    // Strip leading list bullet markers: "- ", "* ", "+ ", "1. ", "2) "
    line = line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '').trim();
    if (!line) continue;

    let word = '';
    let meaning = '';

    if (line.includes('\t')) {
      const parts = line.split('\t');
      word = parts[0].trim();
      meaning = parts.slice(1).join('\t').trim();
    } else {
      // Split ONLY on the first delimiter match
      const delimMatch = line.match(/\s+[-—–:=]\s+|\s*[-—–]\s+|\s*:\s+|\s*=\s*/);
      if (delimMatch && delimMatch.index !== undefined) {
        word = line.substring(0, delimMatch.index).trim();
        meaning = line.substring(delimMatch.index + delimMatch[0].length).trim();
      } else {
        continue;
      }
    }

    word = cleanMarkdown(word);
    meaning = cleanMarkdown(meaning);

    if (!word && !meaning) continue;

    candidates.push({
      word,
      pinyin: '',
      ipa: '',
      meaning,
      example: '',
      exampleTrans: '',
      pos: '',
      selected: true
    });
  }

  return candidates;
}

export function parseTextFile(filePath, options = {}) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseText(content, options);
}

export default {
  stripBom,
  cleanMarkdown,
  parseText,
  parseTextFile
};

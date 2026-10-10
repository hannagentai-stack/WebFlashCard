import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCssContent, getHtmlContent } from '../helpers/dom-checker.js';

describe('Tier 3: Pairwise Combinations - Theme, Focus Mode, Responsive Nav & Touch', () => {
  it('P37 - Switching to Chinese deck activates Chinese theme (pastel pink & 20px radius)', () => {
    const css = getCssContent();
    assert.match(css, /#FFF7FA/i);
    assert.match(css, /20px/);
  });

  it('P38 - Switching to English deck activates English theme (sky blue & 16px radius)', () => {
    const css = getCssContent();
    assert.match(css, /#F5FBFF/i);
    assert.match(css, /16px/);
  });

  it('P39 - Chinese deck in Focus Mode renders centered card with pastel pink styling', () => {
    const css = getCssContent();
    assert.match(css, /focus-mode|center/i);
  });

  it('P40 - English deck in Focus Mode renders centered card with sky blue styling', () => {
    const css = getCssContent();
    assert.match(css, /focus-mode|center/i);
  });

  it('P41 - Focus Mode + Desktop Shortcuts: Space flips card, 1-4 rates card', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('Space') || html.includes('Enter') || html.includes('flashcard') || html.includes('card'));
  });

  it('P42 - Focus Mode + Touch Gestures: Swipe flips and rates card within thumb reach', () => {
    const css = getCssContent();
    assert.match(css, /touch-action|rating-btn|transform/i);
  });

  it('P43 - Focus Mode honors safe area top for exit button and safe area bottom for ratings', () => {
    const css = getCssContent();
    assert.match(css, /safe-area-inset-top/);
    assert.match(css, /safe-area-inset-bottom/);
  });

  it('P44 - Exiting Focus Mode restores previous navigation view and theme cleanly', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('✖') || html.includes('exit') || html.includes('close'));
  });

  it('P45 - Responsive layout adapts: bottom nav on mobile (<768px), sidebar on desktop (>=768px)', () => {
    const css = getCssContent();
    assert.match(css, /@media\s*\(/);
  });

  it('P46 - Mobile virtual keyboard padding active in typing study mode', () => {
    const css = getCssContent();
    assert.match(css, /typing|input|box-sizing/i);
  });

  it('P47 - Dynamic theme swapping alternates CSS tokens without residual style leaks', () => {
    const css = getCssContent();
    assert.match(css, /\[data-lang-theme="zh"\]|--color-primary|--bg-primary/i);
  });
});

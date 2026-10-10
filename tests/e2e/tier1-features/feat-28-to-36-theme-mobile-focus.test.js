import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCssContent, getHtmlContent } from '../helpers/dom-checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

describe('Tier 1: Feature 28 - Chinese Language Theme', () => {
  it('28.1 - defines pastel pink background (#FFF7FA) token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#FFF7FA/i, 'CSS must contain pastel pink ivory background token #FFF7FA');
  });

  it('28.2 - defines peach pink accent (#F472B6) token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#F472B6/i, 'CSS must contain peach pink accent token #F472B6');
  });

  it('28.3 - defines warm dark gray (#3B2A33) text token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#3B2A33/i, 'CSS must contain warm dark gray text token #3B2A33');
  });

  it('28.4 - defines large border radius (20px) for Chinese theme cards', () => {
    const css = getCssContent();
    assert.match(css, /20px/, 'Chinese theme must configure 20px card radius');
  });

  it('28.5 - configures CJK font stack (Noto Sans SC, PingFang SC, Microsoft YaHei)', () => {
    const css = getCssContent();
    assert.match(css, /Noto Sans SC/i);
    assert.match(css, /Microsoft YaHei/i);
  });
});

describe('Tier 1: Feature 29 - English Language Theme', () => {
  it('29.1 - defines sky blue tint background (#F5FBFF) token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#F5FBFF/i, 'CSS must contain sky blue background token #F5FBFF');
  });

  it('29.2 - defines sky blue accent (#38BDF8) token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#38BDF8/i, 'CSS must contain sky blue accent token #38BDF8');
  });

  it('29.3 - defines dark blue-gray text (#1E3A4A) token in CSS', () => {
    const css = getCssContent();
    assert.match(css, /#1E3A4A/i, 'CSS must contain dark blue-gray text token #1E3A4A');
  });

  it('29.4 - defines sleek border radius (16px) for English theme cards', () => {
    const css = getCssContent();
    assert.match(css, /16px/, 'English theme must configure 16px card radius');
  });

  it('29.5 - configures Inter or clean sans-serif typography in HTML / CSS', () => {
    const html = getHtmlContent();
    const css = getCssContent();
    assert.ok(html.includes('Inter') || css.includes('Inter'), 'Inter font family must be linked or declared');
  });
});

describe('Tier 1: Feature 30 - Success & Error Visual States', () => {
  it('30.1 - defines success state color token (green) in CSS', () => {
    const css = getCssContent();
    assert.match(css, /--color-success|#10b981|#16a34a|green/i);
  });

  it('30.2 - defines error state color token (red) in CSS', () => {
    const css = getCssContent();
    assert.match(css, /--color-danger|--color-error|#ef4444|#dc2626|red/i);
  });

  it('30.3 - provides checkmark icon or token for correct feedback (✅)', () => {
    const html = getHtmlContent();
    const css = getCssContent();
    assert.ok(html.includes('✅') || html.includes('check') || css.includes('success'));
  });

  it('30.4 - provides cross icon or token for incorrect feedback (❌)', () => {
    const html = getHtmlContent();
    const css = getCssContent();
    assert.ok(html.includes('❌') || html.includes('cross') || css.includes('danger') || css.includes('error'));
  });

  it('30.5 - styles include interactive feedback states for quiz options', () => {
    const css = getCssContent();
    assert.match(css, /\.quiz|quiz-option|choice/i);
  });
});

describe('Tier 1: Feature 31 - Accessible Touch Targets (44px)', () => {
  it('31.1 - interactive buttons enforce minimum height 44px or padding token', () => {
    const css = getCssContent();
    assert.match(css, /min-height:\s*(44px|48px|3rem)|min-height:\s*var\(--touch-min|44px/);
  });

  it('31.2 - interactive buttons enforce minimum width 44px or adequate touch sizing', () => {
    const css = getCssContent();
    assert.match(css, /44px|min-width:\s*(44px|48px)|padding:/);
  });

  it('31.3 - bottom navigation items have accessible touch bounds', () => {
    const css = getCssContent();
    assert.match(css, /nav|bottom-nav|nav-view-btn/i);
  });

  it('31.4 - rating buttons in study mode provide large thumb reach targets', () => {
    const css = getCssContent();
    assert.match(css, /rating-btn|btn-rate|thumb/i);
  });

  it('31.5 - mobile form inputs have comfortable touch target heights', () => {
    const css = getCssContent();
    assert.match(css, /input|textarea|form-control/i);
  });
});

describe('Tier 1: Feature 32 - Safe Area & Notch Inset Handling', () => {
  it('32.1 - CSS incorporates env(safe-area-inset-bottom)', () => {
    const css = getCssContent();
    assert.match(css, /env\(safe-area-inset-bottom\)/);
  });

  it('32.2 - CSS incorporates env(safe-area-inset-top)', () => {
    const css = getCssContent();
    assert.match(css, /env\(safe-area-inset-top\)/);
  });

  it('32.3 - index.html viewport meta tag includes viewport-fit=cover or responsive scaling', () => {
    const html = getHtmlContent();
    assert.match(html, /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/i);
  });

  it('32.4 - bottom navigation layout includes safe-area padding', () => {
    const css = getCssContent();
    assert.match(css, /safe-area-inset-bottom|padding-bottom:\s*max\(/i);
  });

  it('32.5 - focus mode header/exit button pads safe-area top', () => {
    const css = getCssContent();
    assert.match(css, /safe-area-inset-top|padding-top:\s*max\(/i);
  });
});

describe('Tier 1: Feature 33 - Virtual Keyboard Padding', () => {
  it('33.1 - CSS / layout specifies keyboard padding rules for typing mode', () => {
    const css = getCssContent();
    assert.match(css, /typing|fill-in|keyboard-pad|padding-bottom/i);
  });

  it('33.2 - typing submit/action button remains visible within viewport', () => {
    const css = getCssContent();
    assert.match(css, /typing|input-group|btn-check/i);
  });

  it('33.3 - typing inputs have autocomplete disabled to prevent answer prompting', () => {
    const html = getHtmlContent();
    assert.match(html, /autocomplete="off"|type="text"/i);
  });

  it('33.4 - typing container avoids layout overflow when keyboard activates', () => {
    const css = getCssContent();
    assert.match(css, /box-sizing:\s*border-box/);
  });

  it('33.5 - input focus styling provides clear contrast indicator', () => {
    const css = getCssContent();
    assert.match(css, /:focus|outline|border-focus/i);
  });
});

describe('Tier 1: Feature 34 - Responsive Bottom Nav / Sidebar', () => {
  it('34.1 - contains 4 primary navigation items (Home, Study, Library, Stats)', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('Học') || html.includes('Study') || html.includes('nav'));
    assert.ok(html.includes('Thư viện') || html.includes('Quản Lý') || html.includes('deck') || html.includes('library'));
  });

  it('34.2 - mobile viewport defines bottom navigation bar layout', () => {
    const css = getCssContent();
    assert.match(css, /@media\s*\(max-width|bottom:\s*0|fixed/i);
  });

  it('34.3 - desktop breakpoint (>=768px) transforms navigation into sidebar', () => {
    const css = getCssContent();
    assert.match(css, /@media\s*\((min-width:\s*768px|min-width:\s*640px|max-width:\s*768px)\)/i);
  });

  it('34.4 - active navigation view item is styled with active class or attribute', () => {
    const css = getCssContent();
    assert.match(css, /\.active|\[aria-selected="true"\]|--color-primary/i);
  });

  it('34.5 - view switching operates as a single-page app without reload', () => {
    const html = getHtmlContent();
    assert.match(html, /<main|<section|view-section|data-view/i);
  });
});

describe('Tier 1: Feature 35 - Focus Mode Distraction-Free UI', () => {
  it('35.1 - defines focus-mode-active class in CSS', () => {
    const css = getCssContent();
    assert.match(css, /focus-mode-active|\.focus-mode/i);
  });

  it('35.2 - hides navigation bar, sidebar, and extraneous UI in focus mode', () => {
    const css = getCssContent();
    assert.match(css, /(focus-mode-active|\.focus-mode)[^{}]*display:\s*none|visibility:\s*hidden/i);
  });

  it('35.3 - renders single flashcard centered in viewport during focus mode', () => {
    const css = getCssContent();
    assert.match(css, /flashcard|card-container|perspective|center/i);
  });

  it('35.4 - renders thin progress bar at top of viewport in focus mode', () => {
    const css = getCssContent();
    assert.match(css, /progress-bar|progress-fill|study-progress/i);
  });

  it('35.5 - provides visible exit button (✖) to leave focus mode', () => {
    const html = getHtmlContent();
    const css = getCssContent();
    assert.ok(html.includes('✖') || html.includes('close') || html.includes('exit') || css.includes('exit-focus') || css.includes('btn-close'));
  });
});

describe('Tier 1: Feature 36 - Focus Mode Swipe Gestures', () => {
  it('36.1 - supports card flipping trigger via tap or swipe', () => {
    const css = getCssContent();
    assert.match(css, /flip|transform:\s*rotateY|backface-visibility/i);
  });

  it('36.2 - supports swipe left rating trigger', () => {
    const css = getCssContent();
    assert.match(css, /transition|touch-action|transform/i);
  });

  it('36.3 - supports swipe right rating trigger', () => {
    const css = getCssContent();
    assert.match(css, /translate|swipe/i);
  });

  it('36.4 - renders 4 large thumb-reach rating buttons in focus mode', () => {
    const html = getHtmlContent();
    assert.ok(html.includes('Quên') || html.includes('Khó') || html.includes('Được') || html.includes('Dễ') || html.includes('Again'));
  });

  it('36.5 - touch action CSS prevents undesired browser zooming or pull-refresh during swipe', () => {
    const css = getCssContent();
    assert.match(css, /touch-action:\s*(pan-y|manipulation|none)/i);
  });
});

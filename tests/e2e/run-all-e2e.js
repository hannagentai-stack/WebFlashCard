#!/usr/bin/env node

/**
 * Unified E2E Test Runner for WebFlashCard
 * Executes requirement-driven test suites across Tiers 1-4:
 * - Tier 1: 47 Inventoried Features (>= 5 cases each -> 235 tests)
 * - Tier 2: Boundary & Corner Cases (235 tests)
 * - Tier 3: Pairwise Combinations (47 tests)
 * - Tier 4: Real-World Scenarios (24 tests)
 * Total Target: 541 tests
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { isServerRunning, ensureServerRunning, stopSpawnedServer } from './helpers/test-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const SUITE_FILES = [
  // Tier 1
  'tests/e2e/tier1-features/feat-01-to-09-auth-db.test.js',
  'tests/e2e/tier1-features/feat-10-to-17-decks-cards-upload.test.js',
  'tests/e2e/tier1-features/feat-18-to-27-parsers-preview.test.js',
  'tests/e2e/tier1-features/feat-28-to-36-theme-mobile-focus.test.js',
  'tests/e2e/tier1-features/feat-37-to-46-study-srs-stats.test.js',
  'tests/e2e/tier1-features/feat-47-documentation.test.js',
  // Tier 2
  'tests/e2e/tier2-boundary/boundary-auth-db.test.js',
  'tests/e2e/tier2-boundary/boundary-decks-cards-upload.test.js',
  'tests/e2e/tier2-boundary/boundary-parsers-preview.test.js',
  'tests/e2e/tier2-boundary/boundary-theme-mobile-focus.test.js',
  'tests/e2e/tier2-boundary/boundary-study-srs-stats.test.js',
  'tests/e2e/tier2-boundary/boundary-documentation.test.js',
  // Tier 3
  'tests/e2e/tier3-combinations/pairwise-auth-deck-card.test.js',
  'tests/e2e/tier3-combinations/pairwise-upload-preview-commit.test.js',
  'tests/e2e/tier3-combinations/pairwise-study-srs-stats.test.js',
  'tests/e2e/tier3-combinations/pairwise-theme-focus-mobile.test.js',
  // Tier 4
  'tests/e2e/tier4-scenarios/scenario-english-journey.test.js',
  'tests/e2e/tier4-scenarios/scenario-chinese-hsk-journey.test.js',
  'tests/e2e/tier4-scenarios/scenario-multi-user-isolation.test.js',
  'tests/e2e/tier4-scenarios/scenario-offline-resilience.test.js'
];

async function main() {
  console.log('================================================================');
  console.log('   WebFlashCard Requirement-Driven E2E Test Suite Runner');
  console.log('================================================================\n');

  const port = process.env.TEST_PORT || 3000;
  const baseUrl = process.env.TEST_BASE_URL || `http://localhost:${port}`;
  console.log(`Target Server: ${baseUrl}`);

  const serverLive = await isServerRunning(baseUrl);
  if (serverLive) {
    console.log(`[STATUS] Server is ACTIVE on ${baseUrl}`);
  } else {
    console.log(`[STATUS] Server is not running on ${baseUrl}. Attempting auto-start...`);
    const serverResult = await ensureServerRunning({ port });
    if (serverResult.available) {
      console.log(`[STATUS] Spawned server on ${serverResult.baseUrl}`);
    } else {
      console.log(`[NOTE] Server could not be spawned (${serverResult.error || 'server.js pending'}).`);
      console.log(`       Tests will run with offline fallbacks / assertions.`);
    }
  }

  console.log(`\nDiscovered ${SUITE_FILES.length} test suite files across Tiers 1-4.`);
  console.log('Running test suites via node --test...\n');

  const startTime = Date.now();
  const testArgs = ['--test', ...SUITE_FILES];

  const child = spawn(process.execPath, testArgs, {
    cwd: PROJECT_ROOT,
    env: { ...process.env, TEST_BASE_URL: baseUrl },
    stdio: 'inherit'
  });

  child.on('close', (code) => {
    stopSpawnedServer();
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log(`Test Execution Finished in ${durationSec}s with Exit Code: ${code}`);
    console.log('Summary Breakdown:');
    console.log('  - Tier 1: 235 Feature Coverage Tests (47 features x 5)');
    console.log('  - Tier 2: 235 Boundary & Corner Case Tests (47 features x 5)');
    console.log('  - Tier 3: 47 Pairwise Cross-Feature Interactions');
    console.log('  - Tier 4: 24 Real-World Application Learner Scenarios');
    console.log('  - Total Defined Tests: 541 Test Cases');
    console.log('================================================================\n');
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  stopSpawnedServer();
  console.error('[ERROR] Runner failed:', err);
  process.exit(1);
});

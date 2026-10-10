/**
 * Test Server Lifecycle Helper
 * Checks if target server is alive.
 * Optionally spawns background server process if server.js exists.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

let spawnedProcess = null;

export async function isServerRunning(url = 'http://localhost:3000') {
  try {
    const res = await fetch(`${url}/`, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function ensureServerRunning(options = {}) {
  const port = options.port || process.env.TEST_PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  if (await isServerRunning(baseUrl)) {
    return { baseUrl, spawned: false };
  }

  // Check if server.js or dev-server.js exists to spawn
  const serverJs = path.join(PROJECT_ROOT, 'server.js');
  const devServerJs = path.join(PROJECT_ROOT, 'dev-server.js');
  const targetScript = fs.existsSync(serverJs) ? serverJs : (fs.existsSync(devServerJs) ? devServerJs : null);

  if (!targetScript) {
    return { baseUrl, spawned: false, available: false, error: 'No server script found' };
  }

  // Spawn server process
  spawnedProcess = spawn(process.execPath, [targetScript], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore'
  });

  // Wait for server to respond
  const startTime = Date.now();
  while (Date.now() - startTime < 6000) {
    await new Promise((r) => setTimeout(r, 250));
    if (await isServerRunning(baseUrl)) {
      return { baseUrl, spawned: true, available: true };
    }
  }

  return { baseUrl, spawned: true, available: false, error: 'Timed out waiting for server to start' };
}

export function stopSpawnedServer() {
  if (spawnedProcess && !spawnedProcess.killed) {
    try {
      spawnedProcess.kill('SIGTERM');
    } catch {}
    spawnedProcess = null;
  }
}

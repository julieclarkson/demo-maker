/**
 * Post-tool hook: checks if demo assets are stale after code changes.
 * Runs after git commit or code modification commands.
 * If demo-output/ exists and code has changed since generation, flags for regeneration.
 */

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const cwd = process.cwd();
const demoOutputDir = join(cwd, 'demo-output');
const demoMakerDir = join(cwd, '.demo-maker');
const fingerprintPath = join(demoOutputDir, '.fingerprint');

// Only run if demo-output exists
if (!existsSync(demoOutputDir) || !existsSync(fingerprintPath)) {
  process.exit(0);
}

try {
  const savedFingerprint = readFileSync(fingerprintPath, 'utf-8').trim();

  // Get current state hash
  let currentHash = '';
  try {
    currentHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    process.exit(0); // Not a git repo, skip
  }

  if (savedFingerprint !== currentHash) {
    // Demo is stale — write to pending file for agent to pick up
    const pendingPath = join(demoMakerDir, 'pending-refresh.json');
    const pending = JSON.stringify({
      stale: true,
      generatedAt: savedFingerprint,
      currentHead: currentHash,
      message: 'Demo assets may be out of date. Run /demo-maker:demo to regenerate.'
    }, null, 2);

    require('fs').writeFileSync(pendingPath, pending, 'utf-8');
  }
} catch (err) {
  // Silent failure — hooks should never block the user
  process.exit(0);
}

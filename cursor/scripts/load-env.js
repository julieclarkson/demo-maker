/**
 * load-env.js — Reads .demo-maker/.env and returns key-value pairs.
 * This keeps API keys out of config.json and out of the AI's context.
 *
 * Usage:
 *   const env = require('./load-env')();
 *   const key = env.ELEVENLABS_API_KEY;
 *
 * The .env file format is standard KEY=value, one per line.
 * Lines starting with # are comments. Blank lines are ignored.
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

module.exports = function loadEnv(projectRoot) {
  const root = projectRoot || process.cwd();
  const envPath = join(root, '.demo-maker', '.env');

  if (!existsSync(envPath)) {
    return {};
  }

  const env = {};
  const content = readFileSync(envPath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
};

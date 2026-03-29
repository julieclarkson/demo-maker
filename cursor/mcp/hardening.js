/**
 * demo-maker MCP — shared hardening helpers.
 * Path confinement, credential redaction, response limits. No network, no shell.
 */

const fs = require('fs');
const path = require('path');

const MAX_PROJECT_ROOT_LEN = 8192;
const MAX_RESPONSE_CHARS = 512 * 1024;
const SENSITIVE_KEY = /^(.*_)?(apikey|api_key|secret|token|password|auth|credential|privatekey|private_key|bearer|authorization)(.*)?$/i;
const SECRET_VALUE_PATTERNS = [
  /\bsk_live_[a-zA-Z0-9]{20,}/gi,
  /\bsk_test_[a-zA-Z0-9]{20,}/gi,
  /\bxox[baprs]-[a-zA-Z0-9-]{10,}/gi,
  /\bghp_[a-zA-Z0-9]{36}\b/gi,
  /\bgho_[a-zA-Z0-9]{36}\b/gi,
  /\bgithub_pat_[a-zA-Z0-9_]{20,}\b/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g
];

function realpathExisting(p) {
  try {
    return fs.realpathSync.native ? fs.realpathSync.native(p) : fs.realpathSync(p);
  } catch {
    return null;
  }
}

/**
 * Resolve and freeze the host trust anchor at process start.
 * Optional DEMO_MAKER_MCP_ALLOWED_ROOT: absolute path; all tool paths must stay inside it.
 */
function resolveAllowedRootSnapshot() {
  const raw =
    (process.env.DEMO_MAKER_MCP_ALLOWED_ROOT || '').trim() ||
    process.cwd();
  const abs = path.resolve(raw);
  const real = realpathExisting(abs);
  return real || abs;
}

function isInsideRoot(rootReal, candidateReal) {
  if (!rootReal || !candidateReal) return false;
  if (rootReal === candidateReal) return true;
  const prefix = rootReal.endsWith(path.sep) ? rootReal : rootReal + path.sep;
  const norm = candidateReal.startsWith(prefix);
  return norm;
}

/**
 * Resolve user-supplied project root to an absolute path confined under allowedRoot.
 * @param {string|undefined} userInput
 * @param {string} allowedRootReal
 */
function resolveConfinedProjectRoot(userInput, allowedRootReal) {
  if (userInput == null || userInput === '') {
    return allowedRootReal;
  }
  if (typeof userInput !== 'string') {
    throw new Error('projectRoot must be a string');
  }
  if (userInput.includes('\0')) {
    throw new Error('invalid path');
  }
  if (userInput.length > MAX_PROJECT_ROOT_LEN) {
    throw new Error('projectRoot exceeds maximum length');
  }
  const trimmed = userInput.trim();
  const candidate = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.normalize(path.join(allowedRootReal, trimmed));

  const candidateReal = realpathExisting(candidate);
  const checkPath = candidateReal || path.resolve(candidate);

  if (!isInsideRoot(allowedRootReal, checkPath)) {
    throw new Error('projectRoot escapes allowed directory — check DEMO_MAKER_MCP_ALLOWED_ROOT');
  }
  return candidateReal || checkPath;
}

function redactString(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  for (const re of SECRET_VALUE_PATTERNS) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

function redactDeep(value, depth = 0) {
  if (depth > 32) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v, depth + 1));
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactDeep(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

function limitResponsePayload(text) {
  if (typeof text !== 'string') {
    text = JSON.stringify(text);
  }
  if (text.length > MAX_RESPONSE_CHARS) {
    return (
      text.slice(0, MAX_RESPONSE_CHARS) +
      '\n…[truncated by demo-maker MCP response limit]'
    );
  }
  return text;
}

/**
 * Normalize free text from repo files before returning via MCP (prompt-injection hygiene).
 * Does not remove all attacks; host models must still treat tool output as untrusted data.
 */
function stripDelimiterInjectionHints(text) {
  if (typeof text !== 'string') return text;
  const lines = text.split('\n');
  const dropRe = /^\s*(Human|User|Assistant|System)\s*:\s*/i;
  const out = [];
  for (const line of lines) {
    if (dropRe.test(line)) continue;
    if (/ignore (all |your |)previous instructions/i.test(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

module.exports = {
  resolveAllowedRootSnapshot,
  resolveConfinedProjectRoot,
  isInsideRoot,
  realpathExisting,
  redactString,
  redactDeep,
  limitResponsePayload,
  stripDelimiterInjectionHints,
  MAX_RESPONSE_CHARS,
  MAX_PROJECT_ROOT_LEN
};

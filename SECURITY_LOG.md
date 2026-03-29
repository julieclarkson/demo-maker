# Security Log — Demo Maker

All security-relevant changes are appended here automatically by the AI agent.

---

## 2026-03-24 — Initial Security Audit & Hardening

**Audit source:** `03_build/secure/create-security.md` hermetic build security framework  
**Auditor:** AI agent (Cursor)

### Findings & Fixes

#### CRITICAL: Shell injection in `video-publisher.js`

- **Risk:** `gh release create`, `ffmpeg`, `open`/`xdg-open` called via `exec()` / `execSync()` with string interpolation. Metadata containing shell metacharacters (`"`, backticks, `$()`) could execute arbitrary commands.
- **Files:** `shared/scripts/video-publisher.js` + production copies
- **Fix:** Replaced all `exec()`/`execSync()` with `execFileSync()` / `execFile()` using argument arrays. No user-controlled data touches a shell interpreter now.

#### HIGH: API key fallback to config.json in `narration-generator.js`

- **Risk:** Despite `.env`-only messaging, code fell back to `config.elevenlabs?.apiKey` and `config.openai?.apiKey` — encouraging key storage in JSON (easily leaked via backups, screenshots, accidental commits).
- **Files:** `shared/scripts/narration-generator.js` + production copies
- **Fix:** Removed `config.json` API key fallback. Keys now load exclusively from `.demo-maker/.env` via `load-env.js`.

#### HIGH: API key in config skeleton in `preflight.js`

- **Risk:** Default config skeleton included `apiKey: null` fields for elevenlabs and openai, modeling API keys as config values.
- **Files:** `shared/scripts/preflight.js` + production copies
- **Fix:** Removed `apiKey` fields from default config skeleton. Preflight now checks only `env.ELEVENLABS_API_KEY` / `env.OPENAI_API_KEY`.

#### HIGH: Google API key in URL query string in `veo3-generator.js`

- **Risk:** API key passed via `?key=` query parameter — visible in server logs, proxy caches, Referer headers, and browser history.
- **Files:** `shared/scripts/veo3-generator.js` + production copies
- **Fix:** Moved API key to `x-goog-api-key` HTTP header for all requests (predictLongRunning, polling, download).

#### HIGH: XSS via `JSON.stringify` in `build-portfolio.js`

- **Risk:** `JSON.stringify` embedded in inline `<script>` tag without neutralizing `</script>`. Crafted `timeline`/`commits`/`screenshots` fields could break out of the script block and inject HTML/JS.
- **Files:** `.claude/plugins/case-study-maker/scripts/build-portfolio.js`
- **Fix:** Applied `\u003c` / `\u003e` / `\u002f` escaping to JSON before inline embedding.

#### HIGH: Unescaped template substitutions in `build-portfolio.js`

- **Risk:** Template fields like `PROJECT_NAME`, `SUMMARY`, `BADGE`, `ITERATION_LEAD` etc. inserted via `String(v)` without HTML escaping — stored XSS if `portfolio_data.json` contains malicious content.
- **Files:** `.claude/plugins/case-study-maker/scripts/build-portfolio.js`
- **Fix:** Text-content substitutions now route through `escapeHtml()`. Intentional raw-HTML fields (`BENEFITS_SECTION`, `ROLE_HTML`, `ARCHITECTURE_HTML`, etc.) are explicitly allowlisted.

#### MEDIUM: Shell injection in `youtube-setup.js`

- **Risk:** `exec()` with interpolated URL string.
- **Files:** `shared/scripts/youtube-setup.js` + production copies
- **Fix:** Replaced `exec()` with `execFile()` using argument array.

### Security Posture Summary

| Area | Status |
|------|--------|
| Shell command execution | All critical paths use `execFile`/`execFileSync` (no shell) |
| API key storage | `.env` only — no `config.json` fallback |
| API key transmission | Headers only — no query-string leakage |
| HTML generation | `escapeHtml()` for text, `\u003c` escaping for inline JSON |
| `.env` committed | No — `.gitignore` blocks `.demo-maker/`, `*.env` |
| Network endpoints | Outbound only to ElevenLabs, OpenAI, Google, Runway, GitHub |
| Input validation | `capture-runner.js` SSRF protection (localhost/file only), `build-portfolio.js` path validation |

### Remaining Observations (Low / Info)

- `rm -rf` in deployment scripts (`deploy-production.sh`, `push-production.sh`) — destructive by design, operator-only context
- `innerHTML` in `terminal-recorder.js` — uses `escapeHtml` for dynamic content
- `PLAN_OUTPUTS/demo-maker-plan.md` references keys in `config.json` — stale documentation, non-executable
- CLI scripts accept arbitrary file paths via argv — expected for build tooling, mitigated by running locally

---

## 2026-03-24 — Cursor rules: publish security review + log cross-link

- **Risk:** N/A — process/documentation hardening
- **Files:** `.cursor/rules/publish-security-review.mdc` (new), `.cursor/rules/security-log.mdc` (updated)
- **Fix:** Added always-on workflow: read `03_build/secure/create-security.md` fresh on each review, audit, apply fixes, append `SECURITY_LOG.md`, update `production/README.md` security section. Linked security-log rule to publish rule for full audits.

## 2026-03-20 — Second Security Audit

**Audit source:** `03_build/secure/create-security.md` hermetic build security framework
**Auditor:** AI agent (Cursor)

### Findings & Fixes

#### HIGH: Shell injection in `youtube-uploader.js`

- **Risk:** `openUrl()` and `openFolder()` used `exec()` with string interpolation, and `generateThumbnail()` used `execSync()` with embedded file paths. Same class of vulnerability that was fixed in `video-publisher.js` during the initial audit, but missed in this file. URLs or file paths containing shell metacharacters could execute arbitrary commands.
- **Files:** `shared/scripts/youtube-uploader.js` + production copies
- **Fix:** Replaced `exec()` with `execFile()` (argument arrays) for `openUrl` and `openFolder`. Replaced `execSync()` with `execFileSync()` (argument arrays) for `generateThumbnail` and `copyToClipboard`.

#### MEDIUM: Misleading API key guidance in `preflight.js`

- **Risk:** The `checkAPIKey()` warning message told users to "Set ELEVENLABS_API_KEY or OPENAI_API_KEY in ~/.demo-maker/config.json" — directly contradicting the `.env`-only security posture established in the initial audit. Users following this message would store keys in a JSON file readable by the AI agent.
- **Files:** `shared/scripts/preflight.js` + production copies
- **Fix:** Updated the warning to say "Add ELEVENLABS_API_KEY or OPENAI_API_KEY to .demo-maker/.env".

#### MEDIUM: Unbounded redirect recursion in `runway-generator.js`

- **Risk:** `downloadFile()` followed HTTP 301/302 redirects recursively with no depth limit. An infinite redirect loop from a malicious or misconfigured server could cause a stack overflow crash.
- **Files:** `shared/scripts/runway-generator.js` + production copies
- **Fix:** Added `_redirectCount` parameter with `MAX_REDIRECTS = 5`. Function rejects with an error if limit is exceeded.

#### MEDIUM: Unescaped single quotes in ffmpeg concat file

- **Risk:** `buildConcatFile()` wrote file paths into ffmpeg's concat demuxer format using `file '${videoPath}'`. A file path containing a single quote would break the concat syntax or cause ffmpeg to read unintended files.
- **Files:** `shared/scripts/video-renderer.js` + production copies
- **Fix:** Applied POSIX-style single-quote escaping (`'` → `'\''`) to video paths before writing to the concat file.

### Updated Security Posture

| Area | Status |
|------|--------|
| Shell command execution | All paths now use `execFile`/`execFileSync` — `youtube-uploader.js` was the last holdout |
| API key guidance | All user-facing messages reference `.env` only — stale `config.json` guidance removed |
| HTTP redirects | Bounded to 5 hops max |
| FFmpeg concat paths | Single-quote-escaped to prevent path injection |

---

## 2026-03-24 — Legal section and copyright standardization

- **Risk:** Missing legal attribution; LICENSE copyright did not name publishing entity
- **Files:** `LICENSE`, `TERMS_OF_SERVICE.md` (new), `PRIVACY_POLICY.md` (new), `LIABILITY_WAIVER.md` (new), `production/README.md`, `production/cursor/README.md`, `production/claude/README.md`, `scripts/push-production.sh`
- **Fix:** Updated LICENSE copyright to Jacobus Company LLC. Created stub legal files pointing to canonical hosted pages. Added Legal section to all published READMEs with links to hosted terms, privacy, liability pages and repo copies. Updated push-production.sh to include SECURITY_LOG.md in production deploys.

## 2026-03-16 — Remove Veo 3 / Runway AI video pipeline (attack surface reduction)

- **Risk:** Unused third-party AI video integrations (Google Veo 3, Runway Gen-3 Alpha) expanded the attack surface — API key handling, network calls, and untrusted video ingestion — with no current use
- **Files deleted:** `shared/scripts/veo3-generator.js`, `shared/scripts/runway-generator.js`, `production/cursor/scripts/veo3-generator.js`, `production/cursor/scripts/runway-generator.js`, `production/claude/scripts/veo3-generator.js`, `production/claude/scripts/runway-generator.js`, `shared/remotion/src/scenes/AIClipScene.tsx`, `production/cursor/remotion/src/scenes/AIClipScene.tsx`, `production/claude/remotion/src/scenes/AIClipScene.tsx`
- **Files modified:** `shared/remotion/src/DemoVideo.tsx`, `shared/remotion/src/Root.tsx`, `production/cursor/remotion/src/DemoVideo.tsx`, `production/cursor/remotion/src/Root.tsx`, `production/claude/remotion/src/DemoVideo.tsx`, `production/claude/remotion/src/Root.tsx`, `shared/prompts/00-SETUP.md`, `production/cursor/prompts/00-SETUP.md`, `production/claude/prompts/00-SETUP.md`, `shared/prompts/02-STRATEGY.md`, `production/cursor/prompts/02-STRATEGY.md`, `production/claude/prompts/02-STRATEGY.md`, `shared/config/defaults.json`, `production/cursor/config/defaults.json`, `production/claude/config/defaults.json`, `production/claude/README.md`, `scripts/deploy-production.sh`, `git-launch/LAUNCH_KIT/producthunt-listing.md`
- **Fix:** Deleted all veo3/runway generator scripts and AIClipScene component. Removed AIClip interface, aiClips prop, and AI video ternary from DemoVideo.tsx. Removed AI video setup question, validation, and preflight state from prompts. Stripped paid tiers and aiVideo config from defaults.json. Removed deploy-production.sh required-file checks for deleted scripts. Stack is now Remotion + ElevenLabs only.

---

## 2026-03-29 — Stdio MCP layer + MCP security hardening

- **Risk:** Adding MCP without guardrails could introduce path traversal (arbitrary FS reads), credential exfiltration via tool results (`.env` / token-shaped strings), command injection (shelling out from tool args), widening trust to other plugins, prompt-injection carryover from repo content into the host model, and supply-chain risk from unpinned or non-stdio transports.
- **Files:** `shared/mcp/hardening.js`, `shared/mcp/server.js`, `shared/mcp/cli.js`, `shared/mcp/mcp-config.example.json`, `tests/mcp-hardening.test.js`, `tests/run-tests.js`, `scripts/deploy-production.sh`, `package.json`, `package-lock.json`, `production/claude/package.json`, `production/cursor/package.json`, `production/README.md`, `production/claude/mcp/*`, `production/cursor/mcp/*`
- **Fix:** Implemented a **stdio-only** MCP server (`StdioServerTransport` only; no streamable HTTP/SSE). All tool paths go through `resolveConfinedProjectRoot` against a frozen anchor (`DEMO_MAKER_MCP_ALLOWED_ROOT` or cwd at startup). Tools wrap existing read-only flows only (`detect-project`, redacted `.demo-maker/config.json`, bundled `defaults.json`) — **no** `.env` reads, **no** subprocess/shell, **no** network, **no** arbitrary file paths. Responses pass through `redactDeep`, token-pattern redaction, size limits, and light delimiter-line stripping; server `instructions` state the trust boundary. CLI redirects `console.log`/`info` to stderr so JSON-RPC stays clean. Pinned `@modelcontextprotocol/sdk@1.28.0` + explicit `zod` in plugin and dev `package.json`. Deploy script copies `shared/mcp` into both production plugins; unit tests cover traversal/redaction and source lockdown for streamable imports.

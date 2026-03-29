# Demo Maker

**Auto-generate narrated MP4 product demos from your codebase.**

Point it at your project, review the script, hit render. You get 6 platform-ready videos — Full, GitHub, Twitter, Product Hunt, Instagram, and TikTok — each with correct dimensions, timing, and narration. Everything runs locally on your machine.

<p align="center">
  <video src="media/demo.mp4" controls width="720">
    <a href="media/demo.mp4">Watch the demo (60s, with narration)</a>
  </video>
</p>

Free Cursor & Claude plugin. No SaaS, no accounts, no uploads.

## Install

> **Important:** Clone this repo _inside_ the project you want to demo.

### Cursor

```bash
cd ~/my-awesome-app
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
mkdir -p .cursor/rules
cp .demo-maker-plugin/cursor/.cursor/rules/demo-maker.mdc .cursor/rules/
```

Then say **"make a demo"** in Cursor chat. The plugin walks you through a 9-step workflow.

### Claude Desktop (Cowork)

```bash
cd ~/my-awesome-app
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
cp -r .demo-maker-plugin/claude/skills .claude/skills
cp -r .demo-maker-plugin/claude/commands .claude/commands
```

Then use `/demo` in Claude.

### Bundle (all three plugins)

- **Cursor**: [launchpad-cursor](https://github.com/julieclarkson/launchpad-cursor)
- **Claude**: [launchpad-claude](https://github.com/julieclarkson/launchpad-claude)

## How It Works

Say **"make a demo"** and the plugin runs a 9-step pipeline:

| Step | What happens |
|------|-------------|
| **1. Setup** | Creates `.demo-maker/`, checks dependencies, configures API keys |
| **2. Analyze** | Reads your codebase, case study timeline, and git history |
| **3. Strategy** | You choose platforms, visual style, and demo focus |
| **4. Script** | AI writes a 60-second narration script; you review and edit |
| **5. Storyboard** | Scenes are planned with visual types, transitions, and priorities |
| **6. Capture** | Screenshots your running app via Playwright (web) or records terminal (CLI) |
| **7. Narrate** | Generates voice narration via ElevenLabs (or caption-only mode) |
| **8. Render** | Assembles video with Remotion — scenes, narration, captions, transitions |
| **9. Cutdowns** | Generates platform-specific versions (Twitter 37s, Product Hunt 59s, Instagram vertical, etc.) |

Optional: **Publish** to GitHub Releases and **Integrate** into Case Study Maker pages and Git Launcher posts.

## Commands

| Trigger | What it does |
|---------|-------------|
| **"make a demo"** | Start the full 9-step workflow (Cursor) |
| **"dm-init"** | Initialize Demo Maker in your project without starting a demo |
| `/demo` | Start the full workflow (Claude) |
| `/dm` | Alias for `/demo` (Claude) |

## Structure

```
cursor/   — Cursor plugin (rules, prompts, scripts, Remotion project)
claude/   — Claude plugin (skills, commands, prompts, scripts, Remotion project)
media/    — Demo video for README
```

See `cursor/README.md` or `claude/README.md` for full documentation.

## Requirements

- **Node.js 18+** — for scripts, Remotion, and Playwright
- **FFmpeg** — `brew install ffmpeg` (macOS) or [ffmpeg.org](https://ffmpeg.org)
- **ElevenLabs API key** — for voice narration (or skip for caption-only mode)
- **Playwright Chromium** — installed during setup (`npx playwright install chromium`)
- **GitHub CLI** (`gh`) — for publishing to GitHub Releases (optional)

## Security

**Built-in safeguards:**

- **API keys in `.env` only** — keys load from `.demo-maker/.env` at runtime via `load-env.js`. No fallback to `config.json`. Keys never appear in AI context or generated output.
- **No shell injection** — all subprocess calls use `execFile`/`execFileSync` with argument arrays. No user-controlled data touches a shell interpreter.
- **API keys in headers only** — external API keys are sent via HTTP headers, never in URL query strings.
- **SSRF prevention** — capture URLs are restricted to `localhost`, `127.0.0.1`, and `file://` only.
- **HTML escaping** — template text content runs through `escapeHtml()`. Inline JSON uses `\u003c` encoding to prevent `</script>` breakout.
- **Selector validation** — Playwright selectors are checked for injection characters (`<`, `>`, `;`).
- **Redirect limits** — HTTP redirect following is bounded (max 5 hops) to prevent infinite loops.
- **FFmpeg path escaping** — file paths in concat demuxer files are single-quote-escaped to prevent path injection.
- **`.gitignore` enforced** — `.demo-maker/`, `OUTPUTS_DEMO_MAKER/`, and `.env` are added to `.gitignore` during setup.
- **MCP (stdio) opt-in** — the `mcp/` folder runs a Model Context Protocol server over **stdio only** (no HTTP/SSE listener). Tools are read-only wrappers around existing Demo Maker logic: project detection, redacted `config.json`, and bundled defaults. All project paths are confined under `DEMO_MAKER_MCP_ALLOWED_ROOT` or the server process cwd at startup (no path traversal). The server does **not** read `.env`, execute shell commands, or invoke other MCP servers. Tool outputs are redacted, size-capped, and minimally scrubbed for delimiter-style lines — still treat them as untrusted data in the host model. Pin `@modelcontextprotocol/sdk` to the version in `package.json` and run `npm install` in the plugin directory after clone. See `mcp/mcp-config.example.json`.

**Your responsibility:**

- **Manage IDE scope and permissions.** Demo Maker requires several operations outside the sandbox: Playwright Chromium download (Google CDN), ElevenLabs narration (`api.elevenlabs.io`), Remotion render (headless Chrome), GitHub publish (`gh` CLI). Cursor and Claude will request expanded permissions for each. Review every prompt and approve only what you understand. If you enable the optional MCP server in your AI client, treat it like any other local tool host: do not chain it with untrusted MCP servers in a way that lets one server exfiltrate another’s context, and keep `DEMO_MAKER_MCP_ALLOWED_ROOT` aligned with the repo you intend to expose.
- **Store API keys securely.** Use `.demo-maker/.env` (gitignored) or a secrets manager like 1Password CLI. Never paste keys into chat or config files.
- **Install system dependencies yourself.** Run `npm install`, `npx playwright install chromium`, and `brew install ffmpeg` directly in your terminal — not through the AI agent — to avoid unnecessary sandbox escalation.

All security changes are tracked in `SECURITY_LOG.md`.

## Companion Plugins

Demo Maker is part of a three-plugin workflow:

1. [Case Study Maker](https://github.com/julieclarkson/case-study-maker) — Capture build decisions and generate case studies
2. **Demo Maker** (this plugin) — Generate narrated video demos from your codebase
3. [Git Launcher](https://github.com/julieclarkson/git-launcher) — Generate README, launch posts, and social assets

Demo Maker reads your Case Study Maker timeline for narrative context. Git Launcher reads your demo output and embeds platform-specific videos into launch posts automatically.

**Install order:** Case Study Maker → Demo Maker → Git Launcher

## Legal

Published by **Jacobus Company LLC** (dba **Superfly Web Designs**), United States.

- [LICENSE](LICENSE) — MIT License (copyright Jacobus Company LLC)
- [Terms of Service](https://julieclarkson.com/terms.html) — ([repo copy](TERMS_OF_SERVICE.md))
- [Privacy Policy](https://julieclarkson.com/privacy.html) — ([repo copy](PRIVACY_POLICY.md))
- [Liability Waiver](https://julieclarkson.com/liability.html) — ([repo copy](LIABILITY_WAIVER.md))

The Software is provided "as is." You are responsible for reviewing generated content, managing credentials, and IDE permissions. The hosted pages above are the canonical human-readable legal documents.

## License

MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Jacobus Company LLC (dba Superfly Web Designs).

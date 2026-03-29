# Demo Maker

**Auto-generate narrated MP4 product demos from your codebase.**

Point it at your project, review the script, hit render. You get 6 platform-ready videos — Full, GitHub, Twitter, Product Hunt, Instagram, and TikTok — each with correct dimensions, timing, and narration. Everything runs locally on your machine.

https://github.com/julieclarkson/demo-maker/releases/download/demo-20260316-142115/demo-github.mp4

Free Cursor & Claude plugin. No SaaS, no accounts, no uploads.

---

## What It Does

Demo Maker reads your finished codebase, understands the user flow, and produces a full video pipeline:

1. **Analyzes** your project — frameworks, routes, components, user flows
2. **Scripts** a narrated walkthrough — editable markdown, not a black box
3. **Captures** your UI with Playwright (or terminal for CLI tools)
4. **Narrates** with ElevenLabs TTS — voice-locked so every scene and platform sounds like the same speaker
5. **Renders** with Remotion — React-powered video composition with transitions, typography, and gradient dissolves
6. **Cuts** platform-specific versions — each optimized for its destination
7. **Publishes** to GitHub Release and embeds URLs in your case study pages and launch kit (optional)

### Output

```
OUTPUTS_DEMO_MAKER/demo-{timestamp}/
├── demo-full.mp4            60s full walkthrough
├── demo-github.mp4          60s for README
├── demo-twitter.mp4         30s hook for Twitter/X
├── demo-producthunt.mp4     45s for Product Hunt gallery
├── demo-instagram.mp4       vertical (1080×1920) for Reels
├── demo-tiktok.mp4          vertical (1080×1920) for TikTok
├── captions/                SRT files per platform
├── thumbnails/              auto-generated per platform
└── video-urls.json          published URLs (after Step 9)
```

---

## Tech Stack

| Tool | Role |
|------|------|
| [Playwright](https://playwright.dev) | UI screen capture (browser automation) |
| [ElevenLabs](https://elevenlabs.io) | AI voice narration with Voice Design |
| [Remotion](https://remotion.dev) | React-powered video rendering and composition |
| [FFmpeg](https://ffmpeg.org) | Video encoding, thumbnails |
| Node.js | Scripting and orchestration |

---

## Prerequisites

- **Node.js 18+**
- **FFmpeg** — `brew install ffmpeg` (macOS) or [ffmpeg.org](https://ffmpeg.org) (other platforms)
- **ElevenLabs API key** — for narration (or skip for caption-only mode)
- **GitHub CLI** (`gh`) — for publishing demos to GitHub Releases (optional)

Playwright Chromium is installed automatically during setup.

---

## Install

> **Important:** Clone this repo *inside* the project you want to make a demo for. Demo Maker needs to read your project's codebase to generate the video.

### Cursor

```bash
# Go to the root of YOUR project (the one you want to demo)
cd ~/my-awesome-app

# Clone Demo Maker into your project as a hidden folder
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin

# Copy the Cursor rule so the plugin activates
mkdir -p .cursor/rules
cp .demo-maker-plugin/cursor/.cursor/rules/demo-maker.mdc .cursor/rules/
```

Now open your project in Cursor and say: **"make a demo"**

### Claude Desktop (Cowork)

```bash
# Go to the root of YOUR project
cd ~/my-awesome-app

# Clone Demo Maker into your project
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin

# Copy the Claude skill into your project
cp -r .demo-maker-plugin/claude/skills .claude/skills
```

Then use the `/demo` command in Claude.

### Bundle (all three plugins at once)

If you want Demo Maker + Case Study Maker + Git Launcher together:

- **Cursor**: [launchpad-cursor](https://github.com/julieclarkson/launchpad-cursor)
- **Claude**: [launchpad-claude](https://github.com/julieclarkson/launchpad-claude)

Clone the bundle repo into your project the same way — inside your project folder.

---

## Usage

After installing, say **"make a demo"** in Cursor or run `/demo` in Claude. The plugin walks you through a 9-step workflow:

| Step | What happens |
|------|-------------|
| 1. Analyze | Scans your codebase — frameworks, routes, components |
| 2. Strategy | Asks creative direction questions (tone, audience, focus) |
| 3. Script | Generates narration script — you review and edit |
| 4. Storyboard | Plans scenes, transitions, timing |
| 5. Capture | Records your UI via Playwright |
| 6. Narrate | Generates voice via ElevenLabs (voice-locked for consistency) |
| 7. Render | Assembles video via Remotion + FFmpeg |
| 8. Cutdowns | Generates all 6 platform-specific versions |
| 9. Publish | Uploads to GitHub Release, embeds in companion plugin outputs (optional) |

**Step 9** is optional. If you say yes, it uploads all 6 videos to a GitHub Release and automatically embeds the URLs into your Case Study Maker pages and Git Launcher posts.

---

## Sandbox and Permissions

Demo Maker requires **several operations outside the standard sandbox**. Here's what needs approval and why:

| Operation | Sandbox? | Why it needs approval |
|-----------|----------|----------------------|
| Codebase analysis, script generation | Standard sandbox | Reads project files only |
| `npm install` (Remotion dependencies) | Standard sandbox | npm registry is allowed |
| `npx playwright install chromium` | **Needs full network** | Downloads Chromium browser binary from Google CDN |
| Screen capture (Playwright) | **May need approval** | Headless browser launch can be blocked by sandbox |
| ElevenLabs narration (Step 6) | **Needs full network** | Calls ElevenLabs API (`api.elevenlabs.io`) with your API key |
| Remotion render + FFmpeg (Step 7-8) | **May need approval** | Spawns headless Chrome for rendering; FFmpeg must be installed system-wide |
| GitHub Release publish (Step 9) | **Needs full network** | Uses `gh` CLI to upload videos to GitHub |

**Your responsibility:** Cursor and Claude may request expanded permissions when running these steps. Review each permission prompt carefully and approve only what you understand. You can configure scope settings in your IDE to control what the AI agent is allowed to do.

**Tips:**
- Run `npm install` and `npx playwright install chromium` directly in your terminal to avoid sandbox issues
- FFmpeg must be installed system-wide (`brew install ffmpeg`) — this cannot be done through the AI agent
- Your ElevenLabs API key is stored locally in `.demo-maker/.env` (gitignored) and never sent anywhere except the ElevenLabs API

---

## Security

**Built-in safeguards:**

- **API keys in `.env` only** — keys load from `.demo-maker/.env` at runtime via `load-env.js`. No fallback to `config.json`. Keys never appear in AI context or generated output.
- **No shell injection** — all subprocess calls use `execFile`/`execFileSync` with argument arrays (no string interpolation through a shell interpreter).
- **SSRF prevention** — capture URLs restricted to `localhost`, `127.0.0.1`, and `file://` only.
- **HTML escaping** — template text content runs through `escapeHtml()`. Inline JSON uses `\u003c` encoding to prevent `</script>` breakout.
- **Redirect limits** — HTTP redirect following is bounded (max 5 hops) to prevent infinite loops.
- **FFmpeg path escaping** — file paths in concat demuxer files are single-quote-escaped to prevent path injection.
- **`.gitignore` enforced** — `.demo-maker/`, `OUTPUTS_DEMO_MAKER/`, and `.env` are ignored during setup.

**Your responsibility:**

- Store API keys in `.demo-maker/.env` or a secrets manager. Never paste keys in chat.
- Review IDE permission prompts carefully before approving.
- Install system dependencies (`ffmpeg`, `playwright`) directly in your terminal.

All security changes are tracked in `SECURITY_LOG.md` at the project root.

---

## Companion Plugins

Demo Maker is part of a three-plugin ecosystem. They work independently but are best together:

| Plugin | What it does | Install |
|--------|-------------|---------|
| [Case Study Maker](https://github.com/julieclarkson/case-study-maker) | Captures build reflections → generates marketing pages, portfolio pages, pitch decks | Install first |
| **Demo Maker** | Generates narrated video demos from your codebase | You are here |
| [Git Launcher](https://github.com/julieclarkson/git-launcher) | Generates README, Twitter thread, Product Hunt listing, Reddit/HN posts | Install after demos |

**Recommended order:**

1. **Case Study Maker** — capture reflections as you build
2. **Demo Maker** — generate demos (reads your reflections for better narration)
3. **Case Study Maker** `/generate` — create marketing pages (auto-embeds demo videos)
4. **Git Launcher** — create launch kit (auto-embeds platform-specific demos)

---

## How It Works

### Voice Locking

ElevenLabs Voice Design generates a random voice per API call. Demo Maker runs it once, saves the `generated_voice_id` to `voice-lock.json`, and reuses it for every scene and platform. Delete the file to get a new voice.

### Per-Platform Pipeline

Each platform gets its own script, audio, and render — not a single video cropped to fit. The 30s Twitter cut has a different narrative arc than the 60s full demo. Vertical Instagram/TikTok cuts have different framing.

### Script-First

Every narration script lives as editable markdown in `.demo-maker/scripts/`. You review and edit before anything renders. No black box.

### Local-First

Nothing leaves your machine unless you choose to publish. Your ElevenLabs API key, your Playwright browser, your FFmpeg. No cloud processing.

---

## Project Structure

```
cursor/       Cursor plugin (rules, prompts, scripts, Remotion project)
claude/       Claude plugin (skills, commands, prompts, scripts, Remotion project)
```

---

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

# Demo Maker

**Auto-generate narrated MP4 product demos from your codebase.**

Point it at your project, review the script, hit render. You get 7 platform-ready videos — Full, GitHub, Twitter, Product Hunt, Instagram, TikTok, and GIF — each with correct dimensions, timing, and narration. Everything runs locally on your machine.

![Demo Maker in action](https://github.com/julieclarkson/demo-maker/releases/download/demo-20260316-142115/demo-github.gif)

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
OUTPUT/demo-{timestamp}/
├── demo-full.mp4            60s full walkthrough
├── demo-github.mp4          60s for README
├── demo-twitter.mp4         30s hook for Twitter/X
├── demo-producthunt.mp4     45s for Product Hunt gallery
├── demo-instagram.mp4       vertical (1080×1920) for Reels
├── demo-tiktok.mp4          vertical (1080×1920) for TikTok
├── demo-gif.mp4             short loop for inline previews
├── demo-github.gif          GIF for README embedding
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
| [FFmpeg](https://ffmpeg.org) | Video encoding, GIF conversion, thumbnails |
| Node.js | Scripting and orchestration |

---

## Prerequisites

- **Node.js** 18+
- **FFmpeg** installed (`brew install ffmpeg` on macOS)
- **ElevenLabs API key** (for narration — or skip for caption-only mode)
- **Playwright** (`npx playwright install chromium`)
- **GitHub CLI** (`gh`) for publishing demos (optional)

---

## Install

### Cursor

```bash
cd your-project
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
```

Copy the Cursor rule into your project:

```bash
mkdir -p .cursor/rules
cp .demo-maker-plugin/cursor/.cursor/rules/demo-maker.mdc .cursor/rules/
```

Then tell Cursor: **"make a demo"**

### Claude Desktop (Cowork)

```bash
cd your-project
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
```

Copy the Claude skill into your project's `.claude/` directory, then use the `/demo` command.

### Bundle (all three plugins at once)

- **Cursor**: [launchpad-cursor](https://github.com/julieclarkson/launchpad-cursor)
- **Claude**: [launchpad-claude](https://github.com/julieclarkson/launchpad-claude)

---

## Usage

After installing, say **"make a demo"** in Cursor or run `/demo` in Claude. The plugin walks you through:

```
Step 1  Analyze codebase
Step 2  Ask creative direction questions
Step 3  Generate narration script (you review and edit)
Step 4  Plan scenes and storyboard
Step 5  Capture screens via Playwright
Step 6  Generate voice narration via ElevenLabs
Step 7  Render video via Remotion + FFmpeg
Step 8  Generate platform-specific cutdowns
Step 9  Publish & integrate (optional)
```

**Step 9** uploads all videos to a GitHub Release and embeds the URLs into your Case Study Maker pages and Git Launcher posts automatically. One prompt, fully automated.

---

## Companion Plugins

Demo Maker is part of a three-plugin ecosystem. They work independently but are best together:

| Plugin | What it does | Install |
|--------|-------------|---------|
| [Case Study Maker](https://github.com/julieclarkson/case-study-maker) | Captures build reflections → generates marketing pages, portfolio pages, pitch decks | Install first |
| **Demo Maker** | Generates narrated video demos from your codebase | You are here |
| [Git Launcher](https://github.com/julieclarkson/git-launcher) | Generates README, Twitter thread, Product Hunt listing, Reddit/HN posts, and more | Install after demos |

**Recommended order:**
1. **Case Study Maker** — capture reflections as you build
2. **Demo Maker** — generate demos (reads your reflections for better scripts)
3. **Case Study Maker** `/generate` — create marketing pages (auto-embeds demo videos)
4. **Git Launcher** — create launch kit (auto-embeds platform-specific demos)

---

## How It Works

### Voice Locking

ElevenLabs Voice Design generates a random voice per API call. Demo Maker runs it once, saves the `generated_voice_id` to `voice-lock.json`, and reuses it for every scene and platform. Delete the file to get a new voice.

### Per-Platform Pipeline

Each platform gets its own script, audio, and render — not a single video cropped to fit. The 30s Twitter cut has a different script arc than the 60s full demo. Vertical Instagram/TikTok cuts have different framing.

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

## License

MIT — free and open source.

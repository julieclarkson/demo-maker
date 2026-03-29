# Demo Maker — Claude Desktop Cowork Plugin

Your product is built. Now demo it properly.

Demo Maker is an AI agent plugin that reads your finished codebase and generates a narrated MP4 product demo — automatically. It analyzes your project, writes a script, captures visuals, narrates with ElevenLabs, and renders video with Remotion. You get a ~60-second full demo plus platform-specific cut-downs for Twitter/X, Product Hunt, GitHub, and YouTube.

**No cloud. No video editing. No slop.** Runs entirely within Claude Desktop Cowork. You bring your own API keys.

## Setup

### 1. Clone and copy the plugin

```bash
git clone https://github.com/julieclarkson/demo-maker.git
cp -r demo-maker/production/claude/ your-project/.claude/plugins/demo-maker/
```

### 2. Install dependencies

Demo Maker requires Node.js and FFmpeg on your machine. Remotion (the video engine) needs to be installed once:

```bash
cd your-project/.claude/plugins/demo-maker/remotion
npm install
```

This installs Remotion and React locally inside the plugin. It only needs to happen once.

### 3. Set up API keys

Open Claude Desktop Cowork, select your project folder, and activate:

```
/demo-maker:activate
```

This creates a `.demo-maker/` directory in your project. Then create your `.env` file:

```bash
cp .demo-maker/.env.example .demo-maker/.env
```

Open `.demo-maker/.env` in any text editor and add your key:

```
# Required for voice narration
ELEVENLABS_API_KEY=your-key-here
```

Where to get keys:

- **ElevenLabs** — https://elevenlabs.io/ → Profile → API Key (free tier available)

The `.env` file is gitignored and the AI agent cannot read it. Keys are only used for outbound API calls.

### 4. Generate a demo

```
/demo-maker:demo
```

Or just tell Claude: "make a demo"

## Prerequisites

| Dependency | Required | How to install |
|---|---|---|
| Node.js >= 18 | Yes | https://nodejs.org or `brew install node` |
| FFmpeg | Yes | `brew install ffmpeg` (Mac) or https://ffmpeg.org |
| Remotion npm packages | Yes | `cd remotion && npm install` (once) |
| ElevenLabs API key | Recommended | Free tier at https://elevenlabs.io |

## Commands

| Command | What it does |
|---|---|
| `/demo-maker:activate` | Initialize Demo Maker, create .demo-maker/ directory |
| `/demo-maker:demo` | Run the full demo generation workflow |
| `/demo-maker:dm` | Shortcut for demo |

## What Gets Generated

Each demo run creates a unique timestamped folder so you never overwrite previous demos:

```
OUTPUTS_DEMO_MAKER/
└── demo-20260310-143022/
    ├── demo-full.mp4           # ~60s full narrated demo
    ├── demo-github.mp4          # 60s version for GitHub
    ├── demo-twitter.mp4         # 30s cut-down for Twitter/X
    ├── demo-producthunt.mp4     # 45s cut-down for Product Hunt
    ├── demo-instagram.mp4       # Vertical (1080x1920) for Reels
    ├── demo-tiktok.mp4          # Vertical (1080x1920) for TikTok
    ├── captions/
    │   ├── demo-full.srt
    │   ├── demo-twitter.srt
    │   └── demo-producthunt.srt
    ├── thumbnails/
    │   └── thumbnail.png
    └── script.md                # Final approved narration script
```

## How It Works

1. **Analyze** — Scans your codebase to understand what it does, tech stack, and structure
2. **Strategy** — Asks creative direction questions: platform, voice (with audio previews), color scheme, animation style, dynamism, and focus
3. **Script** — Generates narration script with anti-slop validation, presents for approval
4. **Storyboard** — Plans scenes, visuals, timing, and transitions
5. **Capture** — Records your product in action via Playwright (web apps) or terminal recorder (CLI tools)
6. **Narrate** — Generates voice via ElevenLabs with preview/selection (or caption-only)
7. **Render** — Assembles video with Remotion: React-based scenes, motion graphics, captions, watermark
8. **Cut-Downs** — Auto-generates platform-specific versions from the full demo
9. **Integrate** — Links demo into Case Study Maker and Git Launcher ecosystems

## Voice Options

During strategy, Demo Maker generates audio previews so you can listen and pick:

- **Dev Casual** — conversational, slightly fast, like showing a friend what you built
- **Tech Explainer** — clear, measured, like a senior engineer walking through architecture
- **Storyteller** — warm, narrative, slower pace, like a founder at a meetup
- **Founder** — confident, direct, energetic, like a YC demo day pitch
- **Custom** — describe any voice and Demo Maker will design it ("young female dev, Australian accent")

## Integrations

Demo Maker works standalone, and also integrates with:

- **[Case Study Maker](https://github.com/julieclarkson/case-study-maker)** — Uses your build reflections and decisions to write authentic narration scripts grounded in your actual development journey
- **[Git Launcher](https://github.com/julieclarkson/git-launcher)** — Embeds your demo videos into your README and platform-specific launch posts

## Anti-Slop System

Demo Maker enforces content quality rules to prevent AI-generated demos from looking like marketing spam:

- **Banned buzzwords** — No "revolutionize", "game-changer", "seamlessly", or 40+ other offenders
- **Adjective limits** — Max 2 adjectives per sentence
- **Specific claims only** — Every claim in the script must have a matching screen capture
- **No fake metrics** — No "10x faster" without evidence
- **Minimal transitions** — Hard cuts and simple fades only. No star wipes.
- **No stock footage** — Everything shown is your actual product
- **Natural voice pacing** — Pauses between segments, not machine-gun delivery

## Security

**Built-in safeguards:**

- **API keys in `.env` only** — keys load from `.demo-maker/.env` at runtime. No fallback to `config.json`. Keys never appear in AI context or generated output.
- **No shell injection** — all subprocess calls use `execFile`/`execFileSync` with argument arrays. No user-controlled data touches a shell interpreter.
- **API keys in headers only** — external API keys are sent via HTTP headers, never in URL query strings.
- **SSRF prevention** — capture URLs restricted to `localhost`, `127.0.0.1`, and `file://` only.
- **HTML escaping** — template text content runs through `escapeHtml()`. Inline JSON uses `\u003c` encoding to prevent `</script>` breakout.
- **Redirect limits** — HTTP redirect following is bounded (max 5 hops) to prevent infinite loops.
- **FFmpeg path escaping** — file paths in concat demuxer files are single-quote-escaped to prevent path injection.
- **No telemetry** — no analytics, no cloud uploads, no data leaves your machine except outbound API calls.

**Your responsibility:**

- Store API keys in `.demo-maker/.env` or a secrets manager. Never paste keys in chat.
- Review IDE permission prompts carefully before approving.
- Install system dependencies (`ffmpeg`, `playwright`) directly in your terminal.

All security changes are tracked in `SECURITY_LOG.md`.

## Also Available for Cursor

This plugin is also available as a [Cursor IDE plugin](https://github.com/julieclarkson/demo-maker). Initialize with `bash dm-init.sh` or install from the Cursor marketplace.

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

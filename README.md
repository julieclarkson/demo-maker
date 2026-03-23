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

- **API keys in `.env` only** — keys are stored in `.demo-maker/.env` and loaded at runtime via `load-env.js`. Keys never appear in `config.json`, AI context, or generated output.
- **1Password support** — use `op read` to inject keys at runtime without writing them to disk
- **SSRF prevention** — capture URLs are restricted to `localhost`, `127.0.0.1`, and `file://` only
- **Selector validation** — Playwright selectors are checked for injection characters (`<`, `>`, `;`)
- **Credential redaction** — captured screenshots are scanned for visible credentials before rendering
- **`.gitignore` enforced** — `.demo-maker/`, `OUTPUT/`, and `.env` are added to `.gitignore` during setup

**Your responsibility:**

- **Manage IDE scope and permissions.** Demo Maker requires several operations outside the sandbox: Playwright Chromium download (Google CDN), ElevenLabs narration (`api.elevenlabs.io`), Remotion render (headless Chrome), GitHub publish (`gh` CLI). Cursor and Claude will request expanded permissions for each. Review every prompt and approve only what you understand.
- **Store API keys securely.** Use `.demo-maker/.env` (gitignored) or a secrets manager like 1Password CLI. Never paste keys into chat or config files.
- **Install system dependencies yourself.** Run `npm install`, `npx playwright install chromium`, and `brew install ffmpeg` directly in your terminal — not through the AI agent — to avoid unnecessary sandbox escalation.

## Companion Plugins

Demo Maker is the second step in a three-plugin workflow:

1. [Case Study Maker](https://github.com/julieclarkson/case-study-maker) — Capture build decisions and generate case studies
2. **Demo Maker** (this plugin) — Generate narrated video demos from your codebase
3. [Git Launcher](https://github.com/julieclarkson/git-launcher) — Generate README, launch posts, and social assets

Demo Maker reads your Case Study Maker timeline for narrative context. Git Launcher reads your demo output and embeds platform-specific videos into launch posts automatically.

**Install order:** Case Study Maker → Demo Maker → Git Launcher

## License

MIT License.

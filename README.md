# Demo Maker

**Auto-generate narrated MP4 product demos from your codebase.**

Point it at your project, review the script, hit render. You get 7 platform-ready videos — Full, GitHub, Twitter, Product Hunt, Instagram, TikTok, and GIF — each with correct dimensions, timing, and narration. Everything runs locally on your machine.

<p align="center">
  <video src="media/demo.mp4" controls width="720">
    <a href="media/demo.mp4">Watch the demo (60s, with narration)</a>
  </video>
</p>

Free Cursor & Claude plugin. No SaaS, no accounts, no uploads.

## Install

> **Important:** Clone this repo *inside* the project you want to demo.

### Cursor

```bash
cd ~/my-awesome-app
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
mkdir -p .cursor/rules
cp .demo-maker-plugin/cursor/.cursor/rules/demo-maker.mdc .cursor/rules/
```

Then say **"make a demo"** in Cursor.

### Claude Desktop (Cowork)

```bash
cd ~/my-awesome-app
git clone https://github.com/julieclarkson/demo-maker.git .demo-maker-plugin
cp -r .demo-maker-plugin/claude/skills .claude/skills
```

Then use `/demo` in Claude.

### Bundle (all three plugins)
- **Cursor**: [launchpad-cursor](https://github.com/julieclarkson/launchpad-cursor)
- **Claude**: [launchpad-claude](https://github.com/julieclarkson/launchpad-claude)

## Structure

```
cursor/   — Cursor plugin (rules, prompts, scripts, Remotion project)
claude/   — Claude plugin (skills, commands, prompts, scripts, Remotion project)
media/    — Demo video for README
```

See `cursor/README.md` or `claude/README.md` for full documentation, commands, and usage.

## Requirements

- **Node.js 18+**
- **FFmpeg** — `brew install ffmpeg` (macOS) or [ffmpeg.org](https://ffmpeg.org)
- **ElevenLabs API key** — for voice narration (or skip for caption-only mode)
- **GitHub CLI** (`gh`) — for publishing to GitHub Releases (optional)

## Sandbox and Permissions

Demo Maker requires several operations outside the standard IDE sandbox:

- **Playwright Chromium download** needs full network access (Google CDN)
- **ElevenLabs narration** needs full network access (calls `api.elevenlabs.io`)
- **Remotion render** spawns a headless Chrome process
- **GitHub publish** needs network + authentication via `gh` CLI
- **FFmpeg** must be installed system-wide — cannot be installed through the AI agent

**Your responsibility:** Cursor and Claude may request expanded permissions when running these steps. Review each permission prompt carefully and approve only what you understand. Configure scope settings in your IDE to control what the AI agent is allowed to do.

**Tip:** Run `npm install` and `npx playwright install chromium` directly in your terminal to avoid sandbox restrictions.

## Companion Plugins

Demo Maker works best with:
- [Case Study Maker](https://github.com/julieclarkson/case-study-maker) — Turn your build process into case studies
- [Git Launcher](https://github.com/julieclarkson/git-launcher) — Create launch kits for every platform

**Recommended order:** Case Study Maker → Demo Maker → Git Launcher

## License

MIT — free and open source.

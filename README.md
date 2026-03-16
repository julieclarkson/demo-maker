# Demo Maker

Your product is built. Now demo it properly.

Demo Maker is an AI agent plugin that reads your finished codebase and generates a narrated MP4 product demo — automatically. It analyzes your project, writes a script, captures visuals, narrates with ElevenLabs, and renders video with Remotion. You get a full demo plus platform-specific cuts for Twitter/X, Product Hunt, GitHub, Instagram, TikTok, and GIF.

**No cloud. No video editing. No slop.** Runs entirely in your IDE. You bring your own API keys.

## Choose Your Platform

| Platform | Directory | Setup |
|----------|-----------|-------|
| **Cursor IDE** | [`cursor/`](cursor/) | `bash dm-init.sh` or tell Cursor "make a demo" |
| **Claude Desktop Cowork** | [`claude/`](claude/) | Drop into `.claude/plugins/demo-maker/` and run `/demo-maker:activate` |

Both versions share the same core engine — same scripts, same prompts, same video quality. Pick whichever IDE you use.

## Quick Start

### Cursor

```bash
git clone https://github.com/julieclarkson/demo-maker.git
cd your-project
bash path/to/demo-maker/cursor/dm-init.sh .
```

Then tell Cursor: **"make a demo"**

### Claude Desktop Cowork

```bash
git clone https://github.com/julieclarkson/demo-maker.git
cp -r demo-maker/claude/ your-project/.claude/plugins/demo-maker/
```

Then run: **`/demo-maker:activate`**

### Dependencies

| Dependency | Required | Install |
|---|---|---|
| Node.js >= 18 | Yes | `brew install node` or [nodejs.org](https://nodejs.org) |
| FFmpeg | Yes | `brew install ffmpeg` or [ffmpeg.org](https://ffmpeg.org) |
| Remotion packages | Yes | `cd remotion && npm install` (once) |
| ElevenLabs API key | Recommended | Free tier at [elevenlabs.io](https://elevenlabs.io) |
| Google API key (Veo 3) | Optional | For AI cinematic clips |
| Runway API key | Optional | For AI cinematic clips |

## What Gets Generated

Each run creates a timestamped folder with platform-optimized videos:

```
OUTPUT/
└── demo-20260316-143022/
    ├── demo-full.mp4           # ~60s full narrated demo
    ├── demo-twitter.mp4         # 30s cut for Twitter/X
    ├── demo-producthunt.mp4     # 45s cut for Product Hunt
    ├── demo-github.mp4          # Full version for GitHub
    ├── demo-instagram.mp4       # Vertical 1080x1920
    ├── demo-tiktok.mp4          # Vertical 1080x1920
    ├── demo-gif.mp4             # Short GIF-ready clip
    ├── captions/
    ├── thumbnails/
    └── script.md
```

## How It Works

1. **Analyze** — Scans your codebase to understand what it does
2. **Strategy** — Asks creative direction: voice, visuals, platform, style
3. **Script** — Generates narration with anti-slop validation
4. **Capture** — Records your product via Playwright
5. **Narrate** — Generates voice via ElevenLabs with voice locking for consistency
6. **Render** — Assembles video with Remotion (React-based scenes, motion graphics)
7. **Cut-Downs** — Platform-specific versions with correct dimensions and timing

## Integrations

- **[Case Study Maker](https://github.com/julieclarkson/case-study-maker)** — Uses your build reflections to write authentic narration scripts
- **[Git Launcher](https://github.com/julieclarkson/git-launcher-claude)** — Embeds your demo into README and launch posts

## Security

- All data stays local — nothing leaves your machine except API calls
- API keys in `.demo-maker/.env` (gitignored), not readable by the AI agent
- Playwright only connects to localhost
- No telemetry, no analytics, no cloud uploads

## License

MIT — see [LICENSE](cursor/LICENSE) for details.

Built by [Julie Clarkson](https://superflyweb.com)

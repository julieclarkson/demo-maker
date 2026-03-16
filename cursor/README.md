# Demo Maker — Cursor Plugin

Your product is built. Now demo it properly.

Demo Maker is an AI agent plugin that reads your finished codebase and generates a narrated MP4 product demo — automatically. It analyzes your project, writes a script, captures visuals, narrates with ElevenLabs, and renders video with Remotion.

**No cloud. No video editing. No slop.**

## Setup

### 1. Clone and initialize

```bash
git clone https://github.com/julieclarkson/demo-maker.git
cd your-project
bash path/to/demo-maker/production/cursor/dm-init.sh .
```

Or manually: copy `production/cursor/` into your project and copy `.cursor/rules/demo-maker.mdc` to your project's `.cursor/rules/`.

### 2. Install dependencies

Demo Maker requires Node.js and FFmpeg. The Remotion video engine needs a one-time npm install:

```bash
cd your-project/.demo-maker-plugin/remotion
npm install
```

### 3. Set up API keys

Tell Cursor: "demo maker activate"

This creates a `.demo-maker/` directory. Then set up your keys:

```bash
cp .demo-maker/.env.example .demo-maker/.env
```

Open `.demo-maker/.env` and paste your keys:

```
# Required for voice narration
ELEVENLABS_API_KEY=your-key-here

# Optional fallback voice
OPENAI_API_KEY=your-key-here

# Optional — for AI cinematic video clips
GOOGLE_API_KEY=your-key-here
RUNWAY_API_KEY=your-key-here
```

Where to get keys:

- **ElevenLabs** — https://elevenlabs.io/ → Profile → API Key (free tier available)
- **OpenAI** — https://platform.openai.com/api-keys
- **Google Veo 3** — https://aistudio.google.com/apikey (for AI video clips)
- **Runway Gen-3** — https://app.runwayml.com/ → Settings → API Keys (for AI video clips)

The `.env` file is gitignored. Keys are only used for outbound API calls at runtime.

### 4. Generate a demo

Tell Cursor: "make a demo"

## Prerequisites

| Dependency | Required | How to install |
|---|---|---|
| Node.js >= 18 | Yes | https://nodejs.org or `brew install node` |
| FFmpeg | Yes | `brew install ffmpeg` (Mac) or https://ffmpeg.org |
| Remotion npm packages | Yes | `cd remotion && npm install` (once) |
| ElevenLabs API key | Recommended | Free tier at https://elevenlabs.io |
| Google API key (Veo 3) | Optional | For AI cinematic clips |
| Runway API key | Optional | For AI cinematic clips |

## Commands

Tell Cursor any of these:

- "make a demo" / "generate demo" / "create demo video"
- "demo maker activate" / "init demo maker"
- "run demo maker"

## What Gets Generated

Each demo run creates a unique timestamped folder:

```
OUTPUT/
└── demo-20260310-143022/
    ├── demo-full.mp4           # ~60s full narrated demo
    ├── demo-twitter.mp4         # 30s cut-down
    ├── demo-producthunt.mp4     # 45s cut-down
    ├── demo-github.gif          # GIF for README
    ├── captions/
    ├── thumbnails/
    └── script.md
```

## Visual Tiers

Choose during strategy — from free to cinematic:

| Tier | Cost | What you get |
|---|---|---|
| HTML + CSS | Free | Clean motion graphics, code-driven |
| Remotion | Free | React-based video, Lottie/Rive characters, Three.js 3D |
| Remotion + AI clips | Paid | Remotion base + 1-2 AI cinematic clips (Veo 3 / Runway) |
| Full AI video | Paid | All scenes AI-generated for a commercial feel |

## Voice Options

Demo Maker generates audio previews so you can listen and pick:

- **Dev Casual** — conversational, like showing a friend what you built
- **Tech Explainer** — clear, measured, like a senior engineer
- **Storyteller** — warm, narrative, like a founder at a meetup
- **Founder** — confident, direct, like a YC demo day pitch
- **Custom** — describe any voice and Demo Maker designs it

## Security

- All data stays local — API calls only go to your configured providers
- API keys in `.demo-maker/.env` (gitignored), not readable by the AI agent
- Playwright only connects to localhost
- No telemetry, no analytics, no cloud uploads

## Also Available for Claude Desktop

This plugin is also available as a [Claude Desktop Cowork plugin](https://github.com/julieclarkson/demo-maker). Drop it into `.claude/plugins/demo-maker/` and run `/demo-maker:activate`.

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [Julie Clarkson](https://superflyweb.com)

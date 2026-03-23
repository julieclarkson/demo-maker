# Demo Maker Prompt Library

This directory contains all prompt files that guide the Demo Maker AI agent through the autonomous demo generation workflow. These prompts are designed to be executed sequentially, with each step building on the outputs of previous steps.

---

## Prompt Files Overview

### 00-MAIN.md
**The Orchestrator**

The main entry point for the entire workflow. This prompt defines:
- The 9-step workflow sequence
- Execution rules (sequential, error handling, output location)
- Configuration management
- Integration points with Case Study Maker and Git Launcher
- Context object structure to maintain across steps
- Error handling strategy

**When to use**: Start here. Load this prompt first to initiate the demo generation.

---

### 01-ANALYZE.md
**Codebase & Context Analysis**

Analyzes the project structure and extracts metadata. This step:
- Runs `node scripts/detect-project.js` to identify project type, language, framework
- Reads `.case-study/events.json` if it exists (extract build narrative)
- Reads `git-launch/README.md` and `ARCHITECTURE.md` if they exist
- Extracts commit history via `git log`
- Detects project type (web-app, cli-tool, library, api, desktop-app, plugin)
- Identifies start commands and ports for web apps
- Stores all findings in context for downstream use

**Expected inputs**: Project codebase, optional `.case-study/` and `git-launch/` directories
**Output**: Populated analysis context with project metadata

**Executed after**: 00-MAIN
**Proceeds to**: 02-STRATEGY

---

### 02-STRATEGY.md
**Demo Strategy & Creative Direction**

Asks the user 5 strategic questions to define creative direction. Questions include:
1. **Target platforms** (GitHub, Product Hunt, Twitter, YouTube, All)
2. **Voice tone** (Technical walkthrough, Storytelling, Sales pitch, Casual dev)
3. **Demo focus** (Aha feature, End-to-end workflow, Before/after, Speed/efficiency)
4. **Visual style** (Clean minimal, Developer authentic, Product polished)
5. **Case study integration** (Conditional, only if `.case-study/` exists)

Stores all strategy decisions in context for use in script generation.

**Expected inputs**: User responses to multiple-choice questions
**Output**: Populated strategy context

**Executed after**: 01-ANALYZE
**Proceeds to**: 03-SCRIPT

---

### 03-SCRIPT.md
**Generate Narration Script**

Generates a 60-second demo script based on project analysis + strategy decisions. This step:
- Creates 5 script drafts with different angles
- Validates each draft with `node scripts/anti-slop.js` (checks for banned words, adjective overuse, natural pacing)
- Presents best version to user
- Handles user approval/revision requests
- Saves approved script to `.demo-maker/script.md`
- Updates context with script metadata (word count, duration, approval status)

Script structure: Hook (5-8s) → Context (5-8s) → Demo (30-35s) → Result (5-8s) → CTA (5-8s)

**Expected inputs**: Project metadata, strategy answers, user approval on draft script
**Output**: Approved script in `.demo-maker/script.md`

**Executed after**: 02-STRATEGY
**Proceeds to**: 04-STORYBOARD

---

### 04-STORYBOARD.md
**Storyboard & Visual Planning**

Translates the script into a detailed scene-by-scene visual plan. This step:
- Breaks down script into scenes (one per storyboard entry)
- Defines visual type for each scene: `capture` (interactive), `terminal` (CLI), `static` (screenshot), `text_card` (overlay), `user_clip` (pre-recorded)
- Specifies interaction details (clicks, navigation, highlights)
- Sets transitions (cut, fade, crossfade)
- Assigns priority levels (1-5) for platform cutdowns
- Saves storyboard as `.demo-maker/storyboard.json`
- Presents visual flow to user for review

Each scene includes: id, segment, narration, duration_ms, visual spec, transitions, priority

**Expected inputs**: Approved script, user feedback on visual flow
**Output**: Storyboard JSON in `.demo-maker/storyboard.json`

**Executed after**: 03-SCRIPT
**Proceeds to**: 05-CAPTURE

---

### 05-CAPTURE.md
**Screen Recording & Capture**

Records all screen interactions defined in the storyboard using Playwright (web apps) or terminal recording (CLI tools). This step:
- Verifies dev server is running (for web apps) or environment is ready (for CLI)
- Runs `node scripts/capture-runner.js` for web apps or `node scripts/terminal-recorder.js` for CLI
- Records each scene at 1920x1080, 30fps, WebM format
- Applies highlights and interactions as specified
- Falls back to static screenshots with ken-burns effect on capture failure
- Scans frames for credentials and redacts automatically
- Saves clips to `.demo-maker/captures/scene-{id}.webm`

**Expected inputs**: Running dev server (for web apps), finalized storyboard
**Output**: Video clips in `.demo-maker/captures/`

**Executed after**: 04-STORYBOARD
**Proceeds to**: 06-NARRATE

---

### 06-NARRATE.md
**Voice Narration Generation**

Generates voice narration for each scene using ElevenLabs API (primary), OpenAI TTS (secondary), or caption-only mode (fallback). This step:
- Loads ElevenLabs API key from `.demo-maker/config.json`
- Maps `strategy.voiceTone` to voice preset (dev-casual, tech-explainer, storyteller, founder)
- Runs `node scripts/narration-generator.js` to generate MP3 for each scene
- Validates timing (generated duration vs. target scene duration)
- Handles timing mismatches (re-narrate or extend scene)
- Falls back through: ElevenLabs → OpenAI TTS → caption-only
- Saves MP3 files to `.demo-maker/narration/scene-{id}.mp3`

**Expected inputs**: Script approved, ElevenLabs or OpenAI API key (optional, has fallback)
**Output**: MP3 audio files in `.demo-maker/narration/`

**Executed after**: 05-CAPTURE
**Proceeds to**: 07-RENDER

---

### 07-RENDER.md
**Video Rendering & Assembly**

Assembles all video clips, narration audio, and captions into the final MP4 using FFmpeg. This step:
- Concatenates all video clips with transitions (fade, cut, crossfade)
- Syncs narration audio to video timeline
- Generates captions (SRT) from script
- Burns in captions for accessibility (especially for caption-only mode)
- Adds "Made with Demo Maker" watermark (bottom-right, final 3 seconds)
- Renders to H.264 + AAC, 1920x1080, targeting 10-20MB file size
- Extracts best frame as thumbnail (PNG)
- Saves master video to `demo-output/demo-full.mp4`
- Saves captions to `demo-output/captions/demo-full.srt`

**Expected inputs**: All video clips and narration audio, finalized storyboard
**Output**: `demo-output/demo-full.mp4` + captions + thumbnail

**Executed after**: 06-NARRATE
**Proceeds to**: 08-CUTDOWNS

---

### 08-CUTDOWNS.md
**Platform-Specific Cutdowns & Edits**

Generates platform-specific versions of the demo optimized for distribution. This step:
- Analyzes storyboard priorities to determine which scenes to keep
- Generates Twitter version (30s): hook + climax + CTA
- Generates Product Hunt version (45s): complete value arc
- GitHub version (60s): same as master + GIF format
- Converts master MP4 to GIF for GitHub README embedding (10fps, 1280px)
- Updates captions and thumbnails for each platform
- Saves platform-specific videos to `demo-output/demo-{platform}.mp4`
- Generates platform-specific captions in `demo-output/captions/`

**Expected inputs**: Master video, finalized storyboard with priorities
**Output**: Platform-specific MP4 files + GIF + thumbnails + captions for each platform

**Executed after**: 07-RENDER
**Proceeds to**: 09-INTEGRATE

---

### 09-INTEGRATE.md
**Ecosystem Integration**

Integrates generated demo assets into Case Study Maker and Git Launcher ecosystems. This step:
- **Case Study Maker**: Appends `demo_generated` event to `.case-study/events.json` (if exists)
- **Git Launcher**:
  - Updates `git-launch/README.md` with demo section
  - Updates social post templates in `git-launch/LAUNCH_KIT/`
  - Updates social preview image with demo thumbnail
- Generates `demo-output/CREDITS.md` with attribution and asset inventory
- Offers to apply changes and commit to git
- Presents final summary of generated assets
- Offers advanced options (regenerate, higher quality, long-form version, etc.)

**Expected inputs**: Completed demo generation, user choice on integrations
**Output**: Updated project files, integration summaries, final report

**Executed after**: 08-CUTDOWNS
**Final step**: Workflow complete

---

## Workflow Execution

### Quick Start

To begin the entire workflow, load and follow **00-MAIN.md**. It will orchestrate all subsequent steps in order.

### Step-by-Step

If you need to resume from a specific step:

1. **Load the appropriate prompt file** (e.g., `05-CAPTURE.md` to start from screen recording)
2. **Check the context** — reference the JSON structure in previous steps for required fields
3. **Follow the step-specific instructions**
4. **Proceed to the next prompt** when complete

### Error Recovery

If a step fails:
1. Note what was skipped
2. Load the next prompt file
3. The workflow continues (no full halt)
4. At the end, get a summary of what completed vs. what was skipped

---

## Configuration

**API keys** live in `.demo-maker/.env` (gitignored, never read by the AI agent):

```
ELEVENLABS_API_KEY=your-key-here
```

**Preferences** live in `.demo-maker/config.json` (no secrets):

```json
{
  "version": 1,
  "apiKeys": "loaded from .demo-maker/.env — never stored here",
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "",
    "preset": "dev-casual"
  },
  "defaults": {
    "platform": "all",
    "tone": "storytelling",
    "focus": "end-to-end",
    "style": "developer-authentic",
    "resolution": "1920x1080"
  }
}
```

The workflow creates both files during setup. Never paste API keys in chat — edit `.env` directly.

---

## Output Structure

All generated files go to `demo-output/`:

```
demo-output/
├── demo-full.mp4                 (60s master)
├── demo-twitter.mp4              (30s)
├── demo-producthunt.mp4          (45s)
├── demo-github.mp4               (60s, same as master)
├── demo-github.gif               (60s, for README embedding)
├── captions/
│   ├── demo-full.srt
│   ├── demo-twitter.srt
│   ├── demo-producthunt.srt
│   └── demo-github.srt
├── thumbnails/
│   ├── thumbnail.png
│   ├── thumbnail-twitter.png
│   └── thumbnail-producthunt.png
├── script.md                     (final approved script)
└── CREDITS.md                    (attribution + asset inventory)
```

---

## Integration Points

### Case Study Maker
- Reads: `.case-study/events.json` (Step 1)
- Extracts: build narrative, developer reflections
- Writes: `demo_generated` event (Step 9)

### Git Launcher
- Reads: `git-launch/README.md`, `git-launch/ARCHITECTURE.md` (Step 1)
- Reads: `git-launch/LAUNCH_KIT/` social templates (Step 9)
- Writes: updated README, social posts, social preview image (Step 9)

---

## Attribution

All generated assets include attribution:
- **Video watermark**: "Made with Demo Maker" (bottom-right, final 3s)
- **Markdown footer**: "Made with [Demo Maker](https://github.com/julieclarkson/demo-maker)"
- **CREDITS.md**: Full asset inventory + tool documentation

---

## Notes for AI Agents

When following these prompts:
1. **Execute steps sequentially** — do not jump ahead
2. **Maintain context object** — carry metadata from step to step
3. **Ask for user approval** on key decisions (script, storyboard, final demo)
4. **Log errors** but continue to next step (graceful degradation)
5. **Provide clear progress** reports after each step
6. **Offer user options** at decision points (regenerate, adjust settings, proceed)
7. **Respect privacy** — redact credentials from captures automatically
8. **Validate outputs** — check file sizes, durations, codecs before proceeding
9. **Report timing** — indicate how long steps took, estimate remaining time
10. **Stay in-scope** — don't modify files outside `demo-output/` without user confirmation

---

## Troubleshooting

**Common issues & recovery steps:**

| Issue | Cause | Recovery |
|-------|-------|----------|
| Capture timeout | Slow app or long animation | Increase timeout; fall back to static screenshot |
| Narration cost too high | Large word count or many scenes | Trim script; use OpenAI TTS or captions-only |
| Video file too large | High resolution + low CRF | Reduce CRF; downscale resolution; reduce FPS |
| API key missing | ElevenLabs or OpenAI not configured | Use caption-only mode; update config later |
| Git not available | No git repo | Offer manual file edits; note that integrations skipped |

---

## Version & Updates

- **Current version**: 1.0
- **Last updated**: 2026-03-10
- **Python/Node scripts required**: detect-project.js, capture-runner.js, terminal-recorder.js, narration-generator.js, video-renderer.js, generate-cutdowns.js, audio-validator.js, anti-slop.js
- **External services**: ElevenLabs API (optional), OpenAI API (optional), FFmpeg (required)

---

**End of prompt library documentation.**

For questions or contributions, see: https://github.com/julieclarkson/demo-maker

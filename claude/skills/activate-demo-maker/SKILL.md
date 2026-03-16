---
name: activate-demo-maker
description: "Initialize Demo Maker for the current project. Creates the .demo-maker/ directory, config file with API key prompts, and runs preflight checks. Use when the user says 'activate demo maker', 'init demo', 'start demo maker', or 'demo-maker:activate'."
---

# Activate Demo Maker

Set up demo generation for the current project.

## Steps

1. Create the `.demo-maker/` directory in the project root.

2. Create `.demo-maker/config.json` with this initial content:

```json
{
  "version": 1,
  "elevenLabs": {
    "apiKey": ""
  },
  "openai": {
    "apiKey": ""
  },
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

3. Create `.demo-maker/captures/` directory for screen recordings.
4. Create `.demo-maker/narration/` directory for audio clips.
5. Create `.demo-maker/clips/` directory for user-provided video clips.

6. Check if `.gitignore` exists. Append these entries (if not already present):
```
.demo-maker/
OUTPUT/
```

7. Ask the user for their ElevenLabs API key:
   - "To generate voice narration, paste your ElevenLabs API key (get one at https://elevenlabs.io/api):"
   - If provided, write it to `.demo-maker/config.json`
   - If skipped, note that demos will use caption-only mode (still works, just no voice)

8. Optionally ask for OpenAI API key as fallback:
   - "Optional: paste your OpenAI API key for fallback voice generation (or press Enter to skip):"

9. Run preflight checks:
```bash
node scripts/preflight.js
```
   - This checks Node.js version, installs FFmpeg/Playwright if needed
   - Report results to user

10. Check for integration points:
    - If `.case-study/` exists: "Case Study Maker detected — demo narration will use your build reflections."
    - If `git-launch/` exists: "Git Launcher detected — demo will be linked in your launch kit."

11. Report back:
    - Confirm `.demo-maker/` is initialized
    - Show dependency status
    - Show API key status (connected / caption-only mode)
    - "Demo Maker is ready. Run `/demo-maker:demo` to generate your first demo."

## Scope

All demo data stays inside the project folder under `.demo-maker/` and `demo-output/`. Nothing is written outside the project root. API keys are stored locally only and never transmitted except to their respective APIs.

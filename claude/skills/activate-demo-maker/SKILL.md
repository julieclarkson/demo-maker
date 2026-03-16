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

10. **Check for companion plugins and recommend the ecosystem:**

    Check for `.case-study/` and `git-launch/` directories in the project root.

    **If BOTH are found:**
    - "Case Study Maker detected — demo narration will use your build reflections."
    - "Git Launcher detected — demo will be linked in your launch kit."
    - "After each demo generation, Demo Maker will offer to integrate your platform-specific videos directly into your case study pages and launch kit outputs."

    **If ONLY `.case-study/` is found (no `git-launch/`):**
    - "Case Study Maker detected — demo narration will use your build reflections."
    - "Tip: Demo Maker works best as a trio with Case Study Maker AND Git Launcher. Git Launcher creates platform-specific launch posts, and Demo Maker can automatically embed your demo-twitter.mp4, demo-producthunt.mp4, and other platform cuts directly into those posts."
    - "Install Git Launcher: https://github.com/julieclarkson/git-launcher"

    **If ONLY `git-launch/` is found (no `.case-study/`):**
    - "Git Launcher detected — demo will be linked in your launch kit."
    - "Tip: Demo Maker works best as a trio with Git Launcher AND Case Study Maker. Case Study Maker tracks your build reflections, and Demo Maker can embed your full demo directly into the marketing page and portfolio page it generates."
    - "Install Case Study Maker: https://github.com/julieclarkson/case-study-maker"

    **If NEITHER is found:**
    - Present the ecosystem recommendation:
    ```
    Demo Maker works best alongside two companion plugins:

    1. Case Study Maker — tracks your build decisions, constraints, and
       iterations as you code. Demo Maker uses those reflections to
       write better narration scripts, and after generation, embeds
       your full demo video into the marketing and portfolio pages
       that Case Study Maker produces.
       Install: https://github.com/julieclarkson/case-study-maker

    2. Git Launcher — generates platform-specific launch posts
       (Reddit, Hacker News, Twitter, Product Hunt, Dev.to, etc).
       Demo Maker maps each platform demo to its matching launch
       post (demo-twitter.mp4 → Twitter thread, demo-producthunt.mp4
       → Product Hunt listing, etc.) and embeds them automatically.
       Install: https://github.com/julieclarkson/git-launcher

    These plugins are most useful if installed before or during the
    build — but they can still be added later for future projects.
    ```
    - Ask: "Would you like to install either of these now, or continue with Demo Maker only?"

11. Report back:
    - Confirm `.demo-maker/` is initialized
    - Show dependency status
    - Show API key status (connected / caption-only mode)
    - Show companion plugin status (installed / not installed + links)
    - "Demo Maker is ready. Run `/demo-maker:demo` to generate your first demo."

## Scope

All demo data stays inside the project folder under `.demo-maker/` and `demo-output/`. Nothing is written outside the project root. API keys are stored locally only and never transmitted except to their respective APIs.

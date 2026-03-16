# Step 9: Ecosystem Integration

Integrate generated demo assets into the Case Study Maker and Git Launcher ecosystems. Offer to update project files with demo links and attribution.

---

## Part A: Case Study Maker Integration

If `.case-study/events.json` exists:

### Step 1: Append Demo Event

Add a new event to `.case-study/events.json`:

```json
{
  "type": "demo_generated",
  "timestamp": "2026-03-10T14:32:00Z",
  "metadata": {
    "duration": 60,
    "voiceTone": "casual-dev",
    "platforms": ["github", "twitter", "producthunt"],
    "sceneCount": 6,
    "videoPath": "demo-output/demo-full.mp4",
    "capturesTool": "playwright",
    "narrationTool": "elevenlabs",
    "ffmpegVersion": "6.0"
  }
}
```

This allows Case Study Maker (on next run) to:
- Reference the demo in generated case studies
- Embed demo video in case study narrative
- Track project milestones with demo generation date

### Step 2: Offer to Update Case Study Description

If `.case-study/README.md` exists, offer to add:

```markdown
## Demo

This project has a narrated product demo video. Watch it to see [Feature] in action:

- **Full demo** (60s): [demo-full.mp4](../OUTPUT/{run-id}/demo-full.mp4)
- **Quick version** (30s): [demo-twitter.mp4](../OUTPUT/{run-id}/demo-twitter.mp4)
- **GIF for README**: [demo-github.gif](../OUTPUT/{run-id}/demo-github.gif)

Generated with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

---

## Part B: Git Launcher Integration

If `git-launch/` directory exists:

### Step 1: Offer README.md Update

In `git-launch/README.md`, offer to add demo section:

```markdown
## Demo

Watch a 60-second demo of [Project Name] in action:

[![Watch demo](../OUTPUT/{run-id}/thumbnails/thumbnail.png)](../OUTPUT/{run-id}/demo-full.mp4)

**Quick versions:**
- [Twitter (30s)](../OUTPUT/{run-id}/demo-twitter.mp4)
- [Product Hunt (45s)](../OUTPUT/{run-id}/demo-producthunt.mp4)

Made with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

### Step 2: Offer Social Media Launch Kit Updates

If `git-launch/LAUNCH_KIT/` exists with social post templates:

Update each platform's post with demo links:

**Twitter Post** (`LAUNCH_KIT/twitter.md`):
```markdown
# Twitter Launch Post

Just shipped [Project Name]!

Watch it in action (30s):
[DEMO LINK]

It's [primary benefit]. No setup required.

[GitHub link]
[Try it link]

Made with @demo_maker
```

**Product Hunt Post** (`LAUNCH_KIT/producthunt.md`):
```markdown
# Product Hunt Launch

## Description
[Original description]

## Video Demo
Watch our 45-second product demo: [DEMO LINK]

Made with Demo Maker.
```

**Dev.to / Hacker News** (`LAUNCH_KIT/devto.md`, `LAUNCH_KIT/hn.md`):
```markdown
Check out our **product demo** to see [Feature] in action:
[DEMO LINK]

Made with Demo Maker.
```

### Step 3: Offer Social Preview Update

If `git-launch/social-preview.png` exists:

Offer to generate a new preview using the best frame from the demo:

```bash
cp demo-output/thumbnails/thumbnail.png \
   git-launch/social-preview.png
```

This ensures Twitter/LinkedIn cards show a compelling demo frame.

---

## Part C: General Attribution

### Watermark (Already in Video)
The video contains a watermark: "Made with Demo Maker" in the bottom-right corner during the final 3 seconds. No action needed.

### Text Attribution
Wherever demo links are mentioned, include:

```markdown
Made with [Demo Maker](https://github.com/julieclarkson/demo-maker)
```

Or shorter version for space-constrained places (Twitter):
```
Made with @demo_maker
```

Or HTML:
```html
<p>Made with <a href="https://github.com/julieclarkson/demo-maker">Demo Maker</a></p>
```

---

## Part D: File Organization

### Optional: Copy Assets to Project Root

If user wants easy access, offer to run:

```bash
bash scripts/apply-demo.sh
```

This script (if it exists) copies assets to predictable locations:
```
project-root/
├── demo.mp4                 (symlink to demo-output/demo-full.mp4)
├── demo.gif                 (symlink to demo-output/demo-github.gif)
└── DEMO_CREDITS.md
```

### .gitignore Update

Ensure `.demo-maker/` is in `.gitignore`:
```
.demo-maker/captures/
.demo-maker/narration/
.demo-maker/render-inputs.txt
```

But keep in git:
```
.demo-maker/config.json
.demo-maker/script.md
.demo-maker/storyboard.json
```

---

## Integration Execution

### Step 1: Detect Integration Points

Check for:
- [ ] `.case-study/events.json` → Case Study Maker
- [ ] `git-launch/README.md` → Git Launcher
- [ ] `git-launch/LAUNCH_KIT/` → Social post templates
- [ ] `git-launch/social-preview.png` → Social card

### Step 2: Offer User Choices

Present checklist:

```
🔗 Ecosystem Integration Options
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available integrations:

[ ] Case Study Maker
    └─ Append demo_generated event to events.json

[ ] Git Launcher
    ├─ Add demo section to README.md
    ├─ Update LAUNCH_KIT social posts
    └─ Update social-preview.png

[ ] General
    └─ Copy assets to project root (symlinks)

Select which to apply: [all / case-study / git-launch / none]
```

### Step 3: Apply Selected Integrations

For each selected integration:

1. Create backup of original file (optional, if git not available)
2. Apply updates
3. Show diff for user review
4. Ask for confirmation
5. Commit changes (if git available)

### Step 4: Generate Attribution Files

Create `demo-output/CREDITS.md`:

```markdown
# Demo Credits

**Demo generated with [Demo Maker](https://github.com/julieclarkson/demo-maker)**

## Generated Assets

- `demo-full.mp4` — 60-second master demo
- `demo-twitter.mp4` — 30-second version for Twitter/X
- `demo-producthunt.mp4` — 45-second version for Product Hunt
- `demo-github.gif` — GIF for README embedding
- `captions/` — Subtitle files (SRT)
- `thumbnails/` — Frame captures for social media

Each demo run creates a unique timestamped folder: `OUTPUT/demo-{YYYYMMDD}-{HHmmss}/`

## Tools & Services

- **Screen Recording**: Playwright
- **Voice Narration**: ElevenLabs (or fallback TTS)
- **Video Rendering**: FFmpeg
- **Video Editing**: Demo Maker

## Attribution

If you use or share this demo, please include:

> Made with [Demo Maker](https://github.com/julieclarkson/demo-maker)

## License

The demo video is provided under the same license as the project code.
```

---

## Summary Report

After all integrations complete, show:

```
✅ Integration Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated Assets:
├── OUTPUT/{run-id}/demo-full.mp4          (60s, 18.4 MB)
├── OUTPUT/{run-id}/demo-twitter.mp4       (30s, 6.8 MB)
├── OUTPUT/{run-id}/demo-producthunt.mp4   (45s, 12.2 MB)
├── OUTPUT/{run-id}/demo-github.gif        (60s, 11.3 MB)
├── OUTPUT/{run-id}/captions/              (3 SRT files)
├── OUTPUT/{run-id}/thumbnails/            (3 PNG files)
├── OUTPUT/{run-id}/script.md
└── OUTPUT/{run-id}/CREDITS.md

Integrations Applied:
✓ Case Study Maker (events.json updated)
✓ Git Launcher (README.md + social posts updated)
✓ General attribution (CREDITS.md created)

Next Steps:
1. Review git changes: git diff
2. Commit to git: git add -A && git commit -m "Add product demo"
3. Push to GitHub: git push
4. Share demo on social media (Twitter, Product Hunt, etc.)
5. Update project website with demo link

All done! 🎉
```

---

## User Options at End

```
What would you like to do next?

1. Preview git changes (git diff)
2. Commit changes to git
3. Open demo in browser
4. Share demo on social media
5. Regenerate with different settings
6. Export demo to external service (Slack, Discord, etc.)
7. Done!

Your choice: [1-7]
```

---

## Error Handling

- **No `.case-study/` found**: Skip Case Study integration; note in summary
- **No `git-launch/` found**: Skip Git Launcher integration; note in summary
- **Git not available**: Offer manual file edits instead
- **Integration file conflicts**: Show diff, ask to proceed or skip

---

## Final Checklist

Before declaring workflow complete:

- [ ] All 9 steps executed (or logged as skipped)
- [ ] `demo-output/` contains all expected files
- [ ] All files have reasonable sizes and durations
- [ ] Attribution is present in video + markdown
- [ ] User has reviewed and approved final demo
- [ ] Integration offers were presented and applied (or declined)
- [ ] Context summary is complete and accurate

---

## End of Workflow

Present final summary:

```
🎉 Demo Generation Workflow Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project:        [PROJECT_NAME]
Type:           [TYPE]
Demo Duration:  60 seconds
Platforms:      GitHub, Twitter, Product Hunt
Total Assets:   ~70 MB
Generated:      2026-03-10 at 14:32 UTC

Output Location: OUTPUT/{run-id}/

Thank you for using Demo Maker!
For issues or feedback: github.com/julieclarkson/demo-maker
```

---

## Optionally: Offer Advanced Options

```
Advanced:
- Regenerate with different tone/focus
- Re-render with higher quality (larger file)
- Add custom clips or branding
- Create long-form version for YouTube

Type "help" for more options.
```

---

**Workflow Complete. All 9 steps finished.**

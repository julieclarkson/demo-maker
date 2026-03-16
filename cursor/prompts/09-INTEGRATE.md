# Step 9: Ecosystem Integration

Integrate generated demo assets into the Case Study Maker and Git Launcher ecosystems. After every demo generation, check for companion plugins and offer to embed platform-specific videos into their outputs.

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
    "platforms": ["github", "twitter", "producthunt", "instagram", "tiktok", "gif"],
    "sceneCount": 6,
    "videoPath": "OUTPUT/{run-id}/demo-full.mp4",
    "capturesTool": "playwright",
    "narrationTool": "elevenlabs",
    "ffmpegVersion": "6.0"
  }
}
```

### Step 2: Embed Demos in Case Study Pages

If Case Study Maker has generated output pages (check `OUTPUTS/` or the case study output directory), embed the full demo into the appropriate pages:

| Demo File | Case Study Target | Embed Location |
|-----------|------------------|----------------|
| `demo-full.mp4` | Marketing page | Hero video section |
| `demo-full.mp4` | Portfolio page | Demo section |

For each target page, insert a video embed block:

```html
<section class="demo-video">
  <h2>See It in Action</h2>
  <video controls poster="OUTPUT/{run-id}/thumbnails/thumbnail.png" style="width:100%; max-width:800px; border-radius:8px;">
    <source src="OUTPUT/{run-id}/demo-full.mp4" type="video/mp4">
  </video>
  <p>60-second narrated demo. <a href="https://github.com/{user}/{repo}">View on GitHub</a></p>
</section>
```

### Step 3: Offer to Update Case Study README

If `.case-study/README.md` exists, offer to add:

```markdown
## Demo

- **Full demo** (60s): [demo-full.mp4](../OUTPUT/{run-id}/demo-full.mp4)
- **Quick version** (30s): [demo-twitter.mp4](../OUTPUT/{run-id}/demo-twitter.mp4)
- **GIF for README**: [demo-gif.mp4](../OUTPUT/{run-id}/demo-gif.mp4)

Generated with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

---

## Part B: Git Launcher Integration

If `git-launch/` directory exists:

### Step 1: Embed demo-github.mp4 in README

In `git-launch/README.md` (or the project root `README.md`), add the demo section with the GitHub-optimized video:

```markdown
## Demo

Watch a 60-second demo of [Project Name] in action:

[![Watch demo](OUTPUT/{run-id}/thumbnails/thumbnail.png)](OUTPUT/{run-id}/demo-github.mp4)

Made with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

Also embed `demo-gif.mp4` as an inline preview for platforms that auto-play short clips:

```markdown
![Quick preview](OUTPUT/{run-id}/demo-gif.mp4)
```

### Step 2: Embed Platform Demos in Launch Kit

If `git-launch/LAUNCH_KIT/` exists, update each platform post with its matched demo.

Read `config/demo-integration-map.json` for the authoritative mapping. Apply these embeds:

**Twitter thread** (`LAUNCH_KIT/twitter-thread.md`):
- Attach `demo-twitter.mp4` (30s cut)
- Add line: `Attach video: OUTPUT/{run-id}/demo-twitter.mp4`
- Note: "Upload this 30-second video when posting. First 3 seconds must hook — this cut is optimized for autoplay-without-sound."

**Product Hunt listing** (`LAUNCH_KIT/producthunt-listing.md`):
- Attach `demo-producthunt.mp4` (45s cut)
- Add section:
  ```markdown
  ## Video Demo
  Upload this 45-second demo to your Product Hunt gallery: `OUTPUT/{run-id}/demo-producthunt.mp4`
  ```

**Instagram post** (`LAUNCH_KIT/instagram-post.md` if exists):
- Attach `demo-instagram.mp4` (vertical 1080x1920)
- Add line: `Attach video: OUTPUT/{run-id}/demo-instagram.mp4 (optimized for Instagram Reels, 1080x1920)`

**TikTok post** (`LAUNCH_KIT/tiktok-post.md` if exists):
- Attach `demo-tiktok.mp4` (vertical 1080x1920)
- Add line: `Attach video: OUTPUT/{run-id}/demo-tiktok.mp4 (optimized for TikTok, 1080x1920)`

**Reddit post** (`LAUNCH_KIT/reddit-post.md`):
- Embed `demo-gif.mp4` as inline preview
- Add line: `Attach preview: OUTPUT/{run-id}/demo-gif.mp4 (short looping clip for inline preview)`

**Hacker News post** (`LAUNCH_KIT/hackernews-post.md`):
- Reference `demo-gif.mp4` for inline preview
- Add line near top: `Demo: OUTPUT/{run-id}/demo-gif.mp4`

**Dev.to post** (`LAUNCH_KIT/devto-post.md`):
- Embed `demo-full.mp4` or `demo-github.mp4` (Dev.to supports video embeds)
- Add block:
  ```markdown
  {% video OUTPUT/{run-id}/demo-github.mp4 %}
  ```

### Step 3: Offer Social Preview Update

If `git-launch/social-preview.png` exists, offer to replace with the best frame from the demo:

```bash
cp OUTPUT/{run-id}/thumbnails/thumbnail.png git-launch/social-preview.png
```

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

```bash
bash scripts/apply-demo.sh
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

## Part E: Post-Generation Integration Workflow

This is the main integration flow that runs after every demo generation. It must be followed consistently.

### Step 1: Detect Installed Plugins

Check for these directories in the project root:
- `.case-study/` → Case Study Maker is installed
- `git-launch/` → Git Launcher is installed

Record which are present.

### Step 2: Ask the User

If at least one companion plugin is detected:

```
Demo generation complete. These companion plugins are installed:

[x] Case Study Maker (.case-study/ found)
[x] Git Launcher (git-launch/ found)

Would you like to integrate your platform-specific demos into the
case study pages and launch kit outputs? [yes / no]
```

If user answers **yes**, proceed to Step 3.
If user answers **no**, skip to Part F (Summary).

### Step 3: Load the Integration Map

Read `config/demo-integration-map.json` (from the Demo Maker plugin root). This file defines the authoritative mapping:

| Demo File | Target Plugin | Target Output(s) | Embed Type |
|-----------|--------------|-------------------|------------|
| `demo-full.mp4` | Case Study Maker | marketing-page, portfolio-page | hero-video |
| `demo-github.mp4` | Git Launcher | README.md | demo-section |
| `demo-twitter.mp4` | Git Launcher | LAUNCH_KIT/twitter-thread.md | media-attachment |
| `demo-producthunt.mp4` | Git Launcher | LAUNCH_KIT/producthunt-listing.md | gallery-video |
| `demo-instagram.mp4` | Git Launcher | LAUNCH_KIT/instagram-post.md | media-attachment |
| `demo-tiktok.mp4` | Git Launcher | LAUNCH_KIT/tiktok-post.md | media-attachment |
| `demo-gif.mp4` | Git Launcher | README.md, LAUNCH_KIT/reddit-post.md, LAUNCH_KIT/hackernews-post.md | inline-preview |

### Step 4: Apply Integrations

For each entry in the map:

1. Check that the demo file exists in `OUTPUT/{run-id}/`
2. Check that the target output file exists
3. If both exist, embed the demo reference into the target file (using the format from Part A or Part B above)
4. If target does not exist yet (e.g., launch kit not yet generated), note it and offer to generate via the companion plugin first

Show progress as each integration is applied:
```
Integrating demos...
  demo-full.mp4       → Case Study marketing page    ✓
  demo-full.mp4       → Case Study portfolio page     ✓
  demo-github.mp4     → Git Launcher README           ✓
  demo-twitter.mp4    → Launch Kit Twitter thread      ✓
  demo-producthunt.mp4 → Launch Kit Product Hunt       ✓
  demo-instagram.mp4  → Launch Kit Instagram post      ✓
  demo-tiktok.mp4     → Launch Kit TikTok post         ✓
  demo-gif.mp4        → Git Launcher README (preview)  ✓
  demo-gif.mp4        → Launch Kit Reddit post         ✓
  demo-gif.mp4        → Launch Kit Hacker News post    ✓
```

### Step 5: Ask Where to Push

After all integrations are applied, ask the user:

```
Integration complete. Updated files are ready to push.

Which repository should the updated files go to?

1. Case Study pages → repo URL: _______________
   (e.g. https://github.com/username/website or https://github.com/username/project)

2. Git Launcher outputs → repo URL: _______________
   (e.g. https://github.com/username/project)

3. Both to the same repo → repo URL: _______________

Enter repo URL(s) or "skip" to push later:
```

If the user provides repo URL(s):
1. Stage the updated files
2. Commit with message: `Integrate Demo Maker platform videos into case study and launch kit`
3. Push to the specified remote(s)
4. Report success with the commit hash and remote URL

If the user says "skip":
- Note that files are updated locally and can be pushed later
- Show the list of modified files so the user can review

### Step 6: Handle Missing Plugins

If neither `.case-study/` nor `git-launch/` exists:

```
Demo generation complete.

Demo Maker works best alongside two companion plugins that
automatically receive your platform-specific demo videos:

1. Case Study Maker — generates marketing pages, portfolio pages,
   and pitch decks from your build process. Demo Maker embeds your
   full demo video directly into those pages.
   Install: https://github.com/julieclarkson/case-study-maker

2. Git Launcher — generates platform-specific launch posts
   (Reddit, Hacker News, Twitter, Product Hunt, Instagram, TikTok,
   Dev.to). Demo Maker maps each platform demo to its matching post.
   Install: https://github.com/julieclarkson/git-launcher

Would you like to install either of these for future projects? [yes / no / skip]
```

If the user says yes, provide the clone commands:
```bash
# For Cursor:
git clone https://github.com/julieclarkson/case-study-maker .cursor/plugins/case-study-maker
git clone https://github.com/julieclarkson/git-launcher .cursor/plugins/git-launcher

# For Claude Code:
git clone https://github.com/julieclarkson/case-study-maker .claude/plugins/case-study-maker
git clone https://github.com/julieclarkson/git-launcher-claude .claude/plugins/git-launcher
```

---

## Part F: Summary Report

After all integrations complete (or are skipped), show:

```
Integration Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated Assets:
├── OUTPUT/{run-id}/demo-full.mp4          (60s)
├── OUTPUT/{run-id}/demo-github.mp4        (60s)
├── OUTPUT/{run-id}/demo-twitter.mp4       (30s)
├── OUTPUT/{run-id}/demo-producthunt.mp4   (45s)
├── OUTPUT/{run-id}/demo-instagram.mp4     (vertical)
├── OUTPUT/{run-id}/demo-tiktok.mp4        (vertical)
├── OUTPUT/{run-id}/demo-gif.mp4           (short loop)
├── OUTPUT/{run-id}/captions/
├── OUTPUT/{run-id}/thumbnails/
├── OUTPUT/{run-id}/script.md
└── OUTPUT/{run-id}/CREDITS.md

Companion Plugin Status:
  Case Study Maker:  [installed / not installed]
  Git Launcher:      [installed / not installed]

Integrations Applied:
  [list each integration that was applied, or "none" if skipped]

Push Status:
  [repo URL + commit hash, or "not pushed — files updated locally"]

Next Steps:
1. Review changes: git diff
2. Push if not already pushed
3. Share demos on social media
4. Update project website with demo link
```

---

## User Options at End

```
What would you like to do next?

1. Preview git changes (git diff)
2. Commit and push changes
3. Open demo in browser
4. Regenerate with different settings
5. Done!

Your choice: [1-5]
```

---

## Error Handling

- **No `.case-study/` found**: Skip Case Study integration; offer install link
- **No `git-launch/` found**: Skip Git Launcher integration; offer install link
- **Target output file not found**: Note which file is missing; offer to generate via companion plugin
- **Git not available**: Offer manual file edits instead
- **Integration file conflicts**: Show diff, ask to proceed or skip
- **Push fails**: Show error, suggest manual push command

---

## Final Checklist

Before declaring workflow complete:

- [ ] All 9 steps executed (or logged as skipped)
- [ ] `OUTPUT/{run-id}/` contains all expected demo files
- [ ] Companion plugins were detected and user was prompted
- [ ] If user said yes: all demo-to-output mappings were applied
- [ ] If user said yes: push destination was asked and files were pushed (or noted for later)
- [ ] If plugins not installed: install links were offered
- [ ] Attribution is present in video + markdown
- [ ] User has reviewed and approved final demo

---

**Workflow Complete. All 9 steps finished.**

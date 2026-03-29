# Step 8: Platform-Specific Cutdowns & Edits

Generate platform-specific versions of the demo optimized for different social media and documentation platforms.

---

## Platform Specifications

| Platform | Duration | Context | Visual Style |
|----------|----------|---------|--------------|
| **GitHub README** | 60s | GIF + MP4 (choose one) | Same as master; GIF for inline embedding |
| **Twitter/X** | 30s | Hook + climax + CTA; autoplay without sound | Must grab attention immediately |
| **Product Hunt** | 45s | Problem + demo + result; complete arc | Polished, shows full value |
| **YouTube** | 120s (optional) | Full master + extended breakdown | Can include deeper explanation |

---

## Cutdown Strategy

### General Rules

1. **Always keep**:
   - Hook (problem statement)
   - Highest-priority demo scenes (P1 and P2)
   - CTA (call-to-action)

2. **Can cut**:
   - Supporting context (P2-P3 scenes)
   - Detailed explanations (if already demonstrated)
   - Filler transitions or B-roll

3. **Re-narrate if needed**:
   - If dropping scenes changes the narrative flow
   - Keep cuts as seamless as possible
   - Fallback: silence + captions if narration breaks

### Priority-Based Selection

For each platform, select scenes based on priority + duration:

**Twitter 30s (1,800ms total):**
1. Hook (P1, 5-8s)
2. 1-2 demo climax scenes (P1, 10-12s)
3. CTA (P1, 5-8s)
4. Padding: 0-2s

**Product Hunt 45s (2,700ms total):**
1. Hook (P1, 5-8s)
2. Context (1 scene, P2, 3-5s)
3. 2-3 demo scenes (P1-P2, 15-20s)
4. Result (P2, 5-8s)
5. CTA (P1, 5-8s)

**GitHub 60s:**
1. Use master video as-is

**YouTube 120s (optional):**
1. Master video (60s)
2. Extended demo scenes (P3, 30-40s)
3. Behind-the-scenes or developer commentary (20-30s)

---

## Cutdown Execution

### Step 1: Parse Storyboard for Priorities

Read `.demo-maker/storyboard.json` and extract:
- Scene ID, segment, duration, priority, narration
- Build a scene selection matrix

### Step 2: Select Scenes for Each Platform

For each platform:

```json
{
  "platform": "twitter",
  "duration_target": 30000,
  "scenes_selected": [
    "hook-1",
    "demo-2",
    "cta-1"
  ],
  "total_duration": 28500,
  "headroom": 1500
}
```

### Step 3: Check Narration Continuity

If scenes are cut, check if narration still makes sense:
- "...comes in. [DEMO]... In about 2 seconds..." (works)
- "...comes in. [DEMO CLIMAX]... In about 2 seconds..." (may not work)

If narration breaks:
- Option A: Re-generate narration for cutdown
- Option B: Add silence + captions
- Option C: Use original narration (may be longer than target)

### Step 4: Generate Cutdown Videos

For each platform, run:

```bash
node scripts/generate-cutdown.js \
  --platform twitter \
  --master OUTPUTS_DEMO_MAKER/{run-id}/demo-full.mp4 \
  --storyboard .demo-maker/storyboard.json \
  --output OUTPUTS_DEMO_MAKER/{run-id}/demo-twitter.mp4
```

Script behavior:
- Load master MP4 + storyboard
- Extract selected scenes + audio segments
- Apply transitions between selected scenes
- Re-render with same codec (H.264, AAC)
- Adjust file size if needed (smaller = higher quality loss tolerance)

### Step 5: Generate Captions for Each Platform

Update SRT files to match cutdown duration:

```bash
node scripts/generate-captions.js \
  --platform twitter \
  --srt .demo-maker/demo.srt \
  --output demo-output/captions/demo-twitter.srt
```

---

## GitHub README Special: GIF Generation

GitHub READMEs often use GIF previews for inline viewing (avoids autoplay, smaller file size).

### Step 1: Convert MP4 to GIF

```bash
node scripts/mp4-to-gif.js \
  --input OUTPUTS_DEMO_MAKER/{run-id}/demo-full.mp4 \
  --output OUTPUTS_DEMO_MAKER/{run-id}/demo-github.gif \
  --fps 10 \
  --scale 1280:-1
```

GIF specs:
- FPS: 10 (lower = smaller file, acceptable for demos)
- Resolution: 1280px wide (smaller than master, easier to embed)
- File size: typically 8-15MB for 60s

### Step 2: Create README Snippet

Generate markdown code block for embedding:

```markdown
### Demo

[![Demo](demo-github.gif)](demo-github.mp4)

Or [watch the full video](demo-github.mp4).
```

---

## Output Structure

After all cutdowns complete:

```
OUTPUTS_DEMO_MAKER/{run-id}/
├── demo-full.mp4                 (60s master)
├── demo-full-with-captions.mp4   (if caption mode)
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
│   ├── thumbnail.png             (best frame, for YouTube)
│   ├── thumbnail-twitter.png     (cropped to 16:9)
│   └── thumbnail-producthunt.png (cropped to 3:2)
└── script.md                     (final script)
```

---

## Thumbnail Generation for Each Platform

Different platforms prefer different aspect ratios:

**Twitter** (16:9 landscape):
```bash
ffmpeg -i demo-output/thumbnails/thumbnail.png \
  -vf scale=1200:675 \
  demo-output/thumbnails/thumbnail-twitter.png
```

**Product Hunt** (3:2 portrait-ish):
```bash
ffmpeg -i demo-output/thumbnails/thumbnail.png \
  -vf scale=1200:800 \
  demo-output/thumbnails/thumbnail-producthunt.png
```

**YouTube** (16:9, same as Twitter):
```bash
cp demo-output/thumbnails/thumbnail-twitter.png \
   demo-output/thumbnails/thumbnail-youtube.png
```

---

## Execution

### Run cutdown generator for all platforms:

```bash
node scripts/generate-cutdowns.js \
  --master OUTPUTS_DEMO_MAKER/{run-id}/demo-full.mp4 \
  --storyboard .demo-maker/storyboard.json \
  --platforms twitter,producthunt,github,youtube
```

### Expected output:

```
🎬 Generating Platform Cutdowns...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Master:         60s, 18.4 MB

✓ Twitter       30s  (6.8 MB) 4 scenes
✓ Product Hunt  45s  (12.2 MB) 5 scenes
✓ GitHub        60s  (18.4 MB) master
✓ YouTube       120s (requested, skipping)

✓ GIF: GitHub   60s  (11.3 MB)

Captions updated for all platforms.
Thumbnails generated.

Total output: 67.1 MB (all formats)
```

---

## Verification

Before finishing:

1. **Playback test** (spot-check):
   - [ ] Twitter 30s: Hook + climax + CTA, no dead time
   - [ ] Product Hunt 45s: Complete value arc
   - [ ] GitHub GIF: Smooth, reasonable file size
   - [ ] Captions: Match edited narration

2. **File validation**:
   - [ ] All MP4s have correct durations
   - [ ] GIF is under 15MB
   - [ ] All SRT files exist
   - [ ] All thumbnails exist

---

## Platform-Specific Guidelines

### Twitter/X
- Must auto-play without sound (captions critical)
- First 3 seconds must be compelling (hook)
- 30s is tight; every scene must serve the narrative
- Include your Twitter handle in CTA

### Product Hunt
- Appeals to maker/founder audience
- Can be slightly longer (45s) for full value prop
- Show the "why" not just the "what"
- Include link to ProductHunt landing

### GitHub README
- GIF is ideal for inline docs
- MP4 link as fallback
- Developers want to see it in action quickly
- Include link to live demo or GitHub releases

### YouTube (optional)
- Can extend to 2-3 minutes
- Better for storytelling and deeper explanations
- Include chapters/timestamps in description
- Thumbnail should be eye-catching

---

## Storage & Context

Update context:

```json
{
  "cutdowns": {
    "twitter": {
      "path": "demo-output/demo-twitter.mp4",
      "duration": 30,
      "size": "6.8 MB",
      "scenes": 4
    },
    "producthunt": {
      "path": "demo-output/demo-producthunt.mp4",
      "duration": 45,
      "size": "12.2 MB",
      "scenes": 5
    },
    "github": {
      "path": "demo-output/demo-github.mp4",
      "duration": 60,
      "size": "18.4 MB",
      "gif": "demo-output/demo-github.gif",
      "gif_size": "11.3 MB"
    }
  }
}
```

---

## Report to User

```
✅ Platform Cutdowns Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated:
├── Twitter/X   (30s)  → OUTPUTS_DEMO_MAKER/{run-id}/demo-twitter.mp4
├── Product Hunt (45s) → OUTPUTS_DEMO_MAKER/{run-id}/demo-producthunt.mp4
├── GitHub      (60s)  → OUTPUTS_DEMO_MAKER/{run-id}/demo-github.mp4
│                        + OUTPUTS_DEMO_MAKER/{run-id}/demo-github.gif
└── Captions    (all)  → OUTPUTS_DEMO_MAKER/{run-id}/captions/

Ready to proceed to ecosystem integration (Step 9)?
```

---

## Proceed to Next Step

Load and execute: `$DM_ROOT/prompts/09-INTEGRATE.md`

Step 9 offers to publish all videos to a GitHub Release and automatically embed the URLs into Case Study Maker pages and Git Launcher launch kit posts.

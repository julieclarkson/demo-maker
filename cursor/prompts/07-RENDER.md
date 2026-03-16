# Step 7: Video Rendering & Assembly

Assemble all video clips, narration audio, and captions into the final MP4 video using FFmpeg.

---

## Pre-Render Checklist

Before starting:
- [ ] All video clips exist in `.demo-maker/captures/`
- [ ] All narration MP3s exist in `.demo-maker/narration/` (or caption-only mode)
- [ ] `.demo-maker/storyboard.json` is complete
- [ ] `demo-output/` directory exists
- [ ] FFmpeg is installed and in PATH

---

## Render Configuration

From `.demo-maker/config.json`, read:
- `video.resolution` (default: 1920x1080)
- `video.fps` (default: 30)
- `video.codec` (default: h264)
- `video.maxSize` (default: 25MB)

---

## Video Assembly Pipeline

### Step 1: Prepare FFmpeg Input List

Create `.demo-maker/render-inputs.txt`:

```
file '.demo-maker/captures/scene-hook-1.webm'
duration 6.0
file '.demo-maker/captures/scene-demo-1.webm'
duration 8.0
file '.demo-maker/captures/scene-demo-2.webm'
duration 7.0
file '.demo-maker/captures/scene-result-1.webm'
duration 5.0
file '.demo-maker/captures/scene-cta-1.webm'
duration 8.0
```

Each scene includes its target `duration_ms` from the storyboard.

### Step 2: Build FFmpeg Concat & Audio Sync Script

Generate an FFmpeg script (`.demo-maker/render-filter.txt`) that:
- Concatenates all video clips in order
- Applies transitions (cut, fade, crossfade)
- Syncs audio narration to video
- Burns in captions (SRT)
- Adds watermark

Pseudocode:
```
[v0] fade=t=out:st=6:d=0.5 [v0_fade]
[v0_fade] [v1] crossfade=d=0.5 [v01]
[v01] fade=t=out:st=14:d=0.3 [v01_fade]
[v01_fade] [v2] cut [v012]
...
[subtitles] drawtext="Made with Demo Maker" @ (bottom-right, 57s-60s) [final]
```

### Step 3: Render Master Video

```bash
ffmpeg \
  -f concat -safe 0 -i .demo-maker/render-inputs.txt \
  -i .demo-maker/narration/scene-hook-1.mp3 \
  -i .demo-maker/narration/scene-demo-1.mp3 \
  -i .demo-maker/narration/scene-demo-2.mp3 \
  -i .demo-maker/narration/scene-result-1.mp3 \
  -i .demo-maker/narration/scene-cta-1.mp3 \
  -filter_complex "$(cat .demo-maker/render-filter.txt)" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -y \
  OUTPUT/{run-id}/demo-full.mp4
```

**Codec specs:**
- Video: H.264 (libx264), CRF 23 (good quality/size tradeoff)
- Audio: AAC, 128kbps (sufficient for voice)
- Resolution: 1920x1080 (or fallback to 1280x720)
- FPS: 30 (or 24 if smoother preferred)

### Step 4: Verify File Size

```bash
du -h demo-output/demo-full.mp4
```

If over 25MB:
- Reduce CRF (lower quality): try CRF 25 or 26
- Reduce resolution: try 1280x720
- Reduce FPS: try 24fps

If under 5MB:
- Quality might be too low; try CRF 21 or 22

Target: 10-20MB for 60s @ 1920x1080

---

## Caption & Subtitle Generation

### Step 1: Generate SRT File

Create `.demo-maker/demo.srt` (SubRip format):

```
1
00:00:00,000 --> 00:00:06,000
Ever spent 20 minutes hunting for a typo?

2
00:00:06,000 --> 00:00:14,000
That's where Project Name comes in.
Watch as we load a config file...

3
00:00:14,000 --> 00:00:21,000
In about 2 seconds, we've found the exact issue
on line 47.
```

Extract timestamps from storyboard (sum of scene durations).

### Step 2: Burn Captions into Video

If caption-only mode OR for accessibility:

```bash
ffmpeg \
  -i demo-output/demo-full.mp4 \
  -vf "subtitles=.demo-maker/demo.srt" \
  -c:a copy \
  -y \
  demo-output/demo-full-with-captions.mp4
```

Otherwise, output captions separately:

```bash
cp .demo-maker/demo.srt demo-output/captions/demo-full.srt
```

---

## Watermark Insertion

Add "Made with Demo Maker" text watermark:
- **Position**: bottom-right corner
- **Duration**: last 3 seconds only (57s-60s)
- **Style**: white text, semi-transparent, 18pt font, sans-serif
- **Format**: "Made with Demo Maker" (with link in YouTube description, not in video text)

FFmpeg filter:
```
drawtext=\
  text='Made with Demo Maker':\
  fontsize=18:\
  fontcolor=white@0.9:\
  x=w-text_w-10:\
  y=h-text_h-10:\
  enable='between(t,57,60)'
```

---

## Output Files

After rendering completes, generate:

```
OUTPUT/{run-id}/
├── demo-full.mp4              (main video, 60s)
├── demo-full-with-captions.mp4 (if caption-only mode)
├── captions/
│   └── demo-full.srt          (subtitle file)
├── thumbnails/
│   └── thumbnail.png          (best frame auto-selected)
└── script.md                  (final approved script)
```

### Auto-Select Thumbnail

Extract the frame with the most motion or visual interest (typically from the demo segment):

```bash
node scripts/extract-thumbnail.js \
  --video demo-output/demo-full.mp4 \
  --segment demo \
  --output demo-output/thumbnails/thumbnail.png
```

Save as 1280x720 PNG.

---

## Render Execution

### Run the full render:

```bash
node scripts/video-renderer.js \
  --storyboard .demo-maker/storyboard.json \
  --output demo-output/demo-full.mp4
```

### Expected output:

```
🎬 Rendering Video...
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clips:          6 video + 6 audio
Resolution:     1920x1080
FPS:            30
Codec:          H.264 + AAC

Progress:
[████████████████████░░░░] 85%

✓ Master video assembled
✓ Captions generated
✓ Watermark added
✓ Thumbnail extracted

Output:         OUTPUT/{run-id}/demo-full.mp4
Duration:       60s
File size:      18.4 MB
Audio:          128kbps AAC

✅ Rendering complete!
```

---

## Verification

Before considering the render done:

1. **Playback test**: Open `demo-full.mp4` in a media player
   - [ ] Audio syncs with video
   - [ ] Transitions are smooth
   - [ ] Watermark appears at end
   - [ ] No glitches or artifacts

2. **File inspection**:
   - [ ] File size is reasonable (10-25MB)
   - [ ] Duration matches storyboard (~60s)
   - [ ] Codec is H.264 (playable on all devices)

3. **Accessibility check**:
   - [ ] Captions are readable and accurate
   - [ ] Audio is clear (no distortion)

---

## Fallback: Manual FFmpeg Invocation

If `video-renderer.js` fails, run FFmpeg directly:

```bash
RUN_ID="demo-$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="OUTPUT/$RUN_ID"
mkdir -p "$OUTPUT_DIR"

ffmpeg \
  -f concat -safe 0 -i <(for f in .demo-maker/captures/scene-*.webm; do echo "file '$f'"; done) \
  -filter_complex " \
    [0:v]fade=t=out:st=6:d=0.3[v0]; \
    [1:v]fade=t=in:st=0:d=0.3[v1]; \
    [v0][v1]xfade=transition=fade:duration=0.3:offset=5.7[v_out]; \
    [v_out]drawtext='Made with Demo Maker':x=w-text_w-10:y=h-text_h-10:fontsize=18:fontcolor=white@0.9:enable='between(t,57,60)'[final]" \
  -map "[final]" \
  -c:v libx264 -preset medium -crf 23 \
  -i .demo-maker/narration-merged.mp3 \
  -c:a aac -b:a 128k \
  -shortest \
  -y \
  "$OUTPUT_DIR/demo-full.mp4"
```

---

## Storage & Context

Update context:

```json
{
  "video": {
    "fullPath": "demo-output/demo-full.mp4",
    "duration": 60,
    "fileSize": "18.4 MB",
    "resolution": "1920x1080",
    "codec": "h264",
    "captions": "demo-output/captions/demo-full.srt",
    "thumbnail": "demo-output/thumbnails/thumbnail.png"
  }
}
```

---

## Next Steps (Preview or Continue)

Ask user:

```
✅ Master Video Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
File:     demo-output/demo-full.mp4
Size:     18.4 MB
Duration: 60 seconds

Options:
1. Preview the video (open in browser/player)
2. Proceed to platform cutdowns (Twitter 30s, etc.)
3. Re-render with different settings
4. Skip to integration (Step 8)

Your choice: [1-4]
```

---

## Proceed to Next Step

Load and execute: `shared/prompts/08-CUTDOWNS.md`

The cutdowns script will generate platform-specific versions (Twitter 30s, Product Hunt 45s, etc.).

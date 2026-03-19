# Step 6: Voice Narration Generation

Generate voice narration for each scene using ElevenLabs API (primary) or fallback TTS services.

---

## Configuration & API Setup

### 1. Load Validated Provider from Preflight

The voice provider and API key were validated in Step 0 (Preflight). Read from context:

- `preflight.voice.provider` → which service to use (`elevenlabs`, `openai`, or `caption-only`)
- `preflight.voice.keyValid` → already confirmed working; no need to re-validate
- `strategy.voice.preset` → chosen in Step 2 (Strategy)
- `strategy.voice.voiceId` → resolved voice ID from preset or custom design

API keys are loaded at runtime by `scripts/load-env.js` from `.demo-maker/.env`. The narration scripts access them through environment variables — never from config.json.

If `preflight.voice.provider` is `caption-only`, skip directly to Step 5 (Caption-Only Mode).

### 2. Determine Voice Preset

Map `strategy.voiceTone` to a voice preset (from `templates/voices.json`):

| Tone | Preset | Description |
|------|--------|-------------|
| Technical walkthrough | tech-explainer | Clear, measured, professional |
| Storytelling | storyteller | Warm, narrative, engaging |
| Sales pitch | founder | Confident, direct, persuasive |
| Casual dev | dev-casual | Conversational, friendly, natural |

Use the preset from config or select based on tone.

---

## Voice Presets

Each preset defines ElevenLabs voice parameters:

**dev-casual** (default)
- Voice: "Adam" (male) or "Jessica" (female)
- Speed: 1.0x (natural)
- Stability: 0.5 (natural variation)
- Similarity: 0.75 (close to model)

**tech-explainer**
- Voice: "Michael" or "Emily"
- Speed: 0.95x (slightly slower for clarity)
- Stability: 0.6 (consistent)
- Similarity: 0.8 (very close)

**storyteller**
- Voice: "Bella" or "Chris"
- Speed: 1.0x (natural)
- Stability: 0.4 (expressive)
- Similarity: 0.7 (more emotional)

**founder**
- Voice: "Daniel" or "Rachel"
- Speed: 0.98x (confident, not rushed)
- Stability: 0.65 (assured)
- Similarity: 0.8 (professional)

---

## Narration Generation Pipeline

### Step 1: Prepare Narration Text

For each scene in `.demo-maker/storyboard.json`, extract:
- `scene.id`
- `scene.narration` (the script text)
- `scene.duration_ms` (target duration)

Create `.demo-maker/narration/scene-{id}.txt`:
```
Ever spent 20 minutes hunting for a typo in your config file?
```

### Step 2: Select Provider from Preflight

The provider was already validated. Use `preflight.voice.provider` directly — no runtime key-checking needed. If the provider unexpectedly fails at this point (e.g., key was rotated between steps), fall through the fallback chain: elevenlabs → openai → caption-only.

### Step 3: Generate with ElevenLabs (Primary)

If `preflight.voice.provider` is `elevenlabs`:

```bash
node scripts/narration-generator.js \
  --script .demo-maker/script.md \
  --config .demo-maker/config.json \
  --service elevenlabs
```

Script behavior:
- For each scene:
  - Call ElevenLabs API with narration text
  - Use voice preset parameters (stability, similarity, speed)
  - Adjust speed if needed to fit `duration_ms`
  - Save MP3 to `.demo-maker/narration/scene-{id}.mp3`
- Log timing: actual duration vs. target
- Flag if any scene is significantly over/under (e.g., >2s difference)

### Step 4: Fallback to OpenAI TTS (Secondary)

If ElevenLabs fails or key is missing, use OpenAI TTS:

```bash
node scripts/narration-generator.js \
  --script .demo-maker/script.md \
  --config .demo-maker/config.json \
  --service openai
```

Uses OpenAI's `tts-1` model with default voice (Alloy). Less customizable but reliable.

### Step 5: Caption-Only Mode (Last Resort)

If no API keys are available:

```bash
node scripts/narration-generator.js \
  --script .demo-maker/script.md \
  --service captions-only
```

- No audio generated
- Instead, create SRT subtitle file with narration
- Final video will have burned-in text captions
- Watermark will say "Made with Demo Maker (captions only)"

---

## Audio Quality & Pacing

### Natural Pacing Rules

- **No machine-gun delivery**: Vary sentence length
- **Natural pauses**: Insert `[pause 500ms]` or `[pause 1s]` in script for emphasis
- **No background music**: Unless explicitly requested in strategy
- **Fade-in/fade-out**: Slight audio envelope on first/last 200ms of scene

### Timing Adjustment

If generated audio is shorter/longer than target:

**If shorter than target (e.g., 5s text but 8s scene):**
- Add natural silence before/after
- Do not artificially slow down speech
- Let video capture provide visual content during silence

**If longer than target (e.g., 8s text but 5s scene):**
- Offer to trim the narration (edit script)
- Or extend scene duration in storyboard
- Do not speed up speech beyond 1.1x

Flag significant mismatches to user:
```
⚠️  Timing Issues
━━━━━━━━━━━━━━━
- scene-demo-2: 8s text → 5s duration (2s over; trim needed)
```

---

## Anti-Slop Audio

Validate generated audio:

```bash
node scripts/audio-validator.js --narration .demo-maker/narration/
```

Checks:
- No robotic or unnatural pacing
- No background noise or artifacts
- Natural sentence stress
- No repeated filler words ("um", "uh")

If validation fails:
- Regenerate with adjusted parameters
- Or offer to use different voice preset

---

## Execution

### Run narration generator:

```bash
node scripts/narration-generator.js \
  --script .demo-maker/script.md \
  --config .demo-maker/config.json
```

### Expected output:

```
🎤 Generating Narration...
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service:        ElevenLabs
Voice preset:   dev-casual (Adam)

✓ hook-1        "Ever spent..." (6.1s target: 6.0s) ✓
✓ demo-1        "That's where..." (8.2s target: 8.0s) ⚠
✓ demo-2        "In about 2..." (7.0s target: 7.0s) ✓
✓ result-1      "What used to..." (5.8s target: 5.0s) ⚠
✓ cta-1         "Project Name is..." (8.0s target: 8.0s) ✓

Total clips:        6
Total duration:     44.1s (target: 44.0s)
API calls:          6
Tokens used:        ~1200 (ElevenLabs)
Cost estimate:      $0.08

⚠️  2 scenes exceed target by >1s. Adjust script or duration?
```

---

## Storage

Save all MP3 files:
- `.demo-maker/narration/scene-hook-1.mp3`
- `.demo-maker/narration/scene-demo-1.mp3`
- `.demo-maker/narration/scene-demo-2.mp3`
- `.demo-maker/narration/scene-result-1.mp3`
- `.demo-maker/narration/scene-cta-1.mp3`

Update context:

```json
{
  "narration": {
    "voicePreset": "dev-casual",
    "apiUsed": "elevenlabs",
    "totalDuration": 44100,
    "clipsGenerated": 6,
    "apiCost": 0.08
  }
}
```

---

## User Decision Points

### Timing Issues

If any scenes exceed target by >2 seconds:

```
⚠️  Timing Mismatch
━━━━━━━━━━━━━━━
- demo-1: 8.2s vs. 8.0s target

Options:
1. Adjust script (trim narration)
2. Extend scene duration in storyboard
3. Accept the timing (video will adjust)
4. Regenerate with faster voice

Your choice: [1-4]
```

### Voice Quality

If audio validation flags issues:

```
⚠️  Audio Quality
━━━━━━━━━━━━━━━
- demo-2: slightly robotic pacing detected

Options:
1. Regenerate with different voice preset
2. Accept the quality (may be improved in mix)
3. Use fallback TTS service

Your choice: [1-3]
```

---

## Proceed to Next Step

Load and execute: `shared/prompts/07-RENDER.md`

The render script will assemble all video clips + audio into the final MP4 video.

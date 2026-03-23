# Step 0: Preflight & API Setup

Before analysis begins, validate the environment and guide the user through API configuration. This step builds trust by showing exactly what's configured, what's optional, and what each key unlocks — using the same numbered-choice format as the strategy questions.

---

## 1. Create Directory Structure

Verify `.demo-maker/` exists with required subdirectories. If anything is missing, create it:

```
.demo-maker/
├── .env              ← API keys (never committed)
├── config.json       ← preferences (safe to commit)
├── narration/        ← generated audio clips
├── voice-previews/   ← voice preset samples
└── captures/         ← screen recordings
```

Also verify `.demo-maker/.env` is listed in `.gitignore`. If not, add it and inform the user.

---

## 2. Load Configuration

Load or create `.demo-maker/config.json` with defaults:

```json
{
  "version": 1,
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "",
    "preset": "storytelling"
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

Config stores preferences only — never API keys.

---

## 3. API Key Status Dashboard

Check `.demo-maker/.env` for configured keys. Present a dashboard showing what's available and what it unlocks:

```
Demo Maker — Preflight
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voice Narration
  ElevenLabs:  ✓ configured     → voice preview, narration, voice design
  OpenAI TTS:  ✗ not set        → fallback narration (simpler voices)

AI Video (optional — most users skip this)
  Google Veo 3:  ✗ not set      → cinematic AI video clips
  Runway Gen-3:  ✗ not set      → AI video clips

Fallback: caption-only mode is always available (no API keys needed)
```

Use ✓ / ✗ indicators. If a key exists but is the placeholder `your-key-here`, treat it as not set.

---

## 4. Guided Key Setup

For EACH missing key that the workflow depends on, present numbered options. Start with the most important key first.

### Question: Voice Narration Setup

Always ask this — voice narration is the core capability:

```
Voice narration needs an API key. How would you like to set it up?

1. I already have an ElevenLabs key — help me add it
2. I already have an OpenAI key — use that instead
3. Skip voice narration — use caption-only mode (no API needed)
4. I need to sign up for ElevenLabs first

Your choice: [1-4]
```

**If user picks 1 (ElevenLabs key):**

```
How would you like to add your ElevenLabs API key?

1. Edit .demo-maker/.env directly (I'll create the file, you add the key yourself)
2. Use 1Password CLI (op read) to inject it automatically
3. Set it as a shell environment variable (export ELEVENLABS_API_KEY=...)

Your choice: [1-3]
```

- **Option 1**: Create `.demo-maker/.env` from the template if it doesn't exist. Then tell the user: "Open `.demo-maker/.env` in your editor and replace `your-key-here` with your actual key on the `ELEVENLABS_API_KEY=` line. **Do not paste the key in this chat.**" Wait for the user to confirm they've done it, then validate.
- **Option 2**: Guide the user through the 1Password setup:
  1. Check if `op` is installed (`which op`)
  2. If installed, ask for the vault and item name
  3. Provide the exact command: `echo "ELEVENLABS_API_KEY=$(op read 'op://VAULT/ITEM/credential')" > .demo-maker/.env`
  4. Instruct user to run this in their terminal (the agent cannot access 1Password)
  5. After user confirms, verify the `.env` file was created
- **Option 3**: Explain that shell environment variables work but are session-only. Recommend `.env` for persistence. If user proceeds, note that `load-env.js` will check `process.env` as a fallback.

**If user picks 2 (OpenAI key):**

Same three sub-options (paste, 1Password, env var). Note that OpenAI TTS has fewer voice options but is reliable and lower cost.

**If user picks 3 (caption-only):**

Confirm: "Caption-only mode will burn subtitles into the video instead of voice narration. The demo is still fully functional — this is a valid choice for projects where the visuals speak for themselves."

Store in context: `preflight.voiceProvider = "caption-only"`

**If user picks 4 (need to sign up):**

```
ElevenLabs setup:
1. Go to https://elevenlabs.io/ and create a free account
2. Free tier includes 10,000 characters/month (~10 minutes of audio)
3. After signing up: Profile icon → API Key → copy the key
4. Come back here and pick option 1 or 2 to add it

Take your time — I'll wait.
```

### Question: AI Video Setup (Conditional)

Only ask if the user has already configured voice narration (not caption-only). AI video is a power feature — frame it as optional:

```
AI video clips add cinematic flair (establishing shots, transitions).
Most demos look great without them. Want to set up AI video?

1. Yes — I have a Google (Veo 3) API key
2. Yes — I have a Runway Gen-3 API key
3. Skip — use motion graphics and screen recordings only (recommended)

Your choice: [1-3]
```

If they pick 1 or 2, follow the same paste/1Password/env-var sub-flow.

If they pick 3, confirm: "Motion graphics mode — clean, fast, no API cost."

---

## 5. Validate Configured Keys

For every key the user just configured, run a lightweight validation:

### ElevenLabs Validation

```bash
node scripts/validate-api-key.js --service elevenlabs
```

If the validation script doesn't exist, make a single API call to the ElevenLabs `/v1/user` endpoint and check for a 200 response. Do NOT generate audio yet — just confirm the key works.

Report:

```
✓ ElevenLabs key is valid (Free tier, 8,420 characters remaining this month)
```

Or:

```
✗ ElevenLabs key is invalid (HTTP 401). Double-check the key and try again.

1. Re-enter the key
2. Switch to OpenAI TTS
3. Continue with caption-only mode

Your choice: [1-3]
```

### OpenAI Validation

Call the `/v1/models` endpoint and check for `tts-1` in the response.

### Veo 3 / Runway Validation

Call a lightweight endpoint to confirm the key is valid. Do not generate any content.

---

## 6. Capabilities Summary

After all keys are validated, show the final configuration:

```
Demo Maker — Ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voice:     ElevenLabs ✓  (voice preview + narration)
AI Video:  Skipped        (using motion graphics)
Fallback:  Caption-only   (if voice fails mid-run)

Your keys are stored in .demo-maker/.env
This file is gitignored and never leaves your machine.

Ready to analyze your project (Step 1).
```

Wait for explicit confirmation before proceeding.

---

## 7. Store Preflight State

Save the validated state in context so downstream steps don't re-check:

```json
{
  "preflight": {
    "validated": true,
    "timestamp": "2026-02-26T...",
    "voice": {
      "provider": "elevenlabs",
      "keyValid": true,
      "tier": "free",
      "charactersRemaining": 8420
    },
    "aiVideo": {
      "provider": null,
      "keyValid": false
    },
    "fallback": "caption-only",
    "envPath": ".demo-maker/.env",
    "gitignored": true
  }
}
```

---

## Security Notes

- API keys are ONLY stored in `.demo-maker/.env` — never in `config.json`, never in chat context
- The agent reads `.env` through `scripts/load-env.js` at runtime; the raw key value is never logged or displayed
- If the user pastes a key into chat by accident, warn them and suggest rotating it
- 1Password CLI (`op read`) is the most secure option — the key is injected at runtime and never written to disk unless the user explicitly creates the `.env` file

---

## Error Handling

- **`.env` file missing**: Offer to create it (don't silently skip)
- **Key is placeholder text**: Treat as not set; offer setup
- **Validation fails**: Offer re-entry, provider switch, or fallback — never halt
- **1Password not signed in**: Instruct user to run `eval $(op signin)` in their terminal first
- **No keys at all**: Caption-only mode is always available; confirm and proceed

---

## Proceed to Next Step

After preflight is complete and confirmed, load and execute: `01-ANALYZE.md`

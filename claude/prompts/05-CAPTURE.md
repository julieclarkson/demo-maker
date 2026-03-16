# Step 5: Screen Recording & Capture

Record all screen interactions defined in the storyboard. This produces raw video clips that will be assembled in the rendering step.

---

## Pre-Capture Checklist

Before starting captures:
- [ ] Storyboard is finalized (`.demo-maker/storyboard.json`)
- [ ] Dev server is running (for web apps) or environment is ready (for CLI)
- [ ] `.demo-maker/captures/` directory exists (will be created if missing)
- [ ] Browser window is at correct resolution (1920x1080 recommended)
- [ ] No private data visible in screenshots (API keys, passwords, personal info)

---

## Determine Capture Method by Project Type

### Web Apps

For projects with a web UI:

1. **Check if dev server is running:**
   ```bash
   curl -s http://localhost:$PORT/
   ```

   If not running, offer to start it:
   ```bash
   npm run start
   # or yarn start, or whatever is in scripts.start
   ```

2. **Run Playwright capture:**
   ```bash
   node scripts/capture-runner.js --storyboard .demo-maker/storyboard.json
   ```

3. **Script behavior:**
   - For each `capture` scene in storyboard:
     - Navigate to the specified `url`
     - Wait for `waitFor` selector
     - Perform `action` (click, type, scroll, etc.)
     - Record video at 1920x1080, 30fps
     - Highlight `highlight` element (draw a border or glow)
     - Save to `.demo-maker/captures/scene-{id}.webm`
   - For `static` scenes:
     - Take a screenshot at the URL
     - Apply `effect` (e.g., ken-burns zoom)
     - Save as `.demo-maker/captures/scene-{id}.webm` (3s loop)

4. **Output:**
   - `.demo-maker/captures/scene-hook-1.webm`
   - `.demo-maker/captures/scene-demo-1.webm`
   - ... (one per scene)

### CLI Tools

For command-line tools:

1. **Run terminal recorder:**
   ```bash
   node scripts/terminal-recorder.js --storyboard .demo-maker/storyboard.json
   ```

2. **Script behavior:**
   - For each `terminal` scene:
     - Open a terminal window (simulated or real)
     - Execute the `command` with clear, readable output
     - Wait for the `waitFor` pattern in output
     - Highlight the `highlight` pattern (bright color or box)
     - Record terminal output as video (1920x1080, monospace font, dark background)
     - Save to `.demo-maker/captures/scene-{id}.webm`

3. **Output:**
   - `.demo-maker/captures/scene-demo-1.webm`
   - `.demo-maker/captures/scene-demo-2.webm`
   - ... (one per terminal interaction)

### Libraries & APIs

For libraries or APIs (no UI):

1. **Detect library type:**
   - JavaScript/Node library: generate a minimal HTML demo page
   - Python library: generate a Jupyter notebook or Python REPL session
   - Rust/compiled library: generate a WASM demo or compiled binary demo

2. **Generate demo page:**
   ```bash
   node scripts/generate-demo-page.js [library-name]
   ```
   This creates `.demo-maker/demo-page.html` that showcases the library.

3. **Capture the demo page:**
   ```bash
   node scripts/capture-runner.js --storyboard .demo-maker/storyboard.json
   ```

---

## Fallback Strategy

If a `capture` scene fails (timeout, selector not found, CLI error):

1. **Log the failure:**
   ```
   ⚠️ Scene demo-3 capture failed: timeout waiting for .results-panel
   ```

2. **Fall back to static screenshot:**
   - Take a screenshot of the current state
   - Apply ken-burns effect (subtle zoom/pan)
   - Use as a 3-second static clip
   - Note in output: "demo-3: static fallback (capture timeout)"

3. **Continue to next scene** (don't halt)

4. **Report at end:**
   - List which scenes used fallback
   - Suggest re-running capture with timeout adjustment

---

## Security & Privacy

### SSRF Prevention
- Only allow localhost or 127.0.0.1 URLs
- Reject any external URLs (except git-launch links)
- Validate `url` field before navigating

### Credential Redaction
- Scan all captured frames for patterns:
  - API keys (regex: `api[_-]?key`, `apikey`, `sk_live`, `sk_test`)
  - Tokens (regex: `token`, `auth`, `bearer`)
  - Passwords (regex: `password`, `pwd`)
  - Email addresses / PII
- Automatically blur or redact detected patterns
- Log what was redacted for user review

### .gitignore
- Add `.demo-maker/captures/` to `.gitignore`
- Add `.demo-maker/narration/` to `.gitignore`
- Captures are large (video) and should not be committed

---

## Capture Execution

### Step 1: Verify Configuration

Load `.demo-maker/config.json`:
- Confirm dev server port
- Confirm recording resolution
- Confirm any special capture settings

### Step 2: Initialize Capture

```bash
mkdir -p .demo-maker/captures
```

### Step 3: Run Captures

For web apps:
```bash
node scripts/capture-runner.js --storyboard .demo-maker/storyboard.json
```

For CLI tools:
```bash
node scripts/terminal-recorder.js --storyboard .demo-maker/storyboard.json
```

### Step 4: Monitor Progress

Output should show:
```
🎬 Starting captures...
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ hook-1       (6s)  → scene-hook-1.webm
✓ demo-1       (8s)  → scene-demo-1.webm
✓ demo-2       (7s)  → scene-demo-2.webm
⚠ demo-3       timeout, fallback to static
✓ result-1     (5s)  → scene-result-1.webm
✓ cta-1        (8s)  → scene-cta-1.webm

Total clips: 6 | Total duration: 39s | Fallbacks: 1
```

### Step 5: Verify Outputs

Check that all `.webm` files exist:
```bash
ls -lh .demo-maker/captures/
```

Each file should be:
- Non-zero size (at least a few MB)
- Playable as H.264/WebM video

---

## Redaction Review

If any frames were redacted:

```
⚠️  Credential Scan Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- scene-demo-2.webm: blurred 1 API key at 3:45
- scene-result-1.webm: redacted email in header

Review redacted frames? (Recommend: yes)
```

Allow user to review and approve redactions before proceeding.

---

## Handling Interruptions

If the user needs to re-run captures:
- Ask which scenes to re-capture
- Delete only those scenes from `.demo-maker/captures/`
- Re-run capture-runner with `--scenes scene-id1,scene-id2`

---

## Storage & Documentation

Update context:

```json
{
  "captures": {
    "completed": [
      "scene-hook-1.webm",
      "scene-demo-1.webm",
      "scene-demo-2.webm",
      "scene-result-1.webm",
      "scene-cta-1.webm"
    ],
    "failed": [],
    "fallbacks": ["scene-demo-3.webm"],
    "totalSize": "234 MB",
    "redactions": ["demo-2: 1 API key"]
  }
}
```

---

## Report to User

```
✅ Screen Captures Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location:       .demo-maker/captures/
Total clips:    6
Total size:     234 MB
Fallbacks:      1 (demo-3)
Redactions:     1 (demo-2)

Ready to proceed to narration (Step 6)?
```

---

## Proceed to Next Step

Load and execute: `shared/prompts/06-NARRATE.md`

The narration script will generate voice audio for each scene using ElevenLabs or a fallback TTS service.

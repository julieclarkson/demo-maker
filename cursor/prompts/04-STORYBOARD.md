# Step 4: Storyboard & Visual Planning

Translate the script into a detailed scene-by-scene visual plan. The storyboard defines exactly what appears on screen and when.

---

## Storyboard Structure

Each scene has:
- `id` — unique scene identifier (e.g., "hook-1", "demo-2")
- `segment` — script segment: "hook", "context", "demo", "result", or "cta"
- `narration` — the exact words spoken in this scene
- `duration_ms` — how long the scene lasts (in milliseconds)
- `visual` — what appears on screen
- `transition_in` — how the scene enters (fade, cut, crossfade)
- `transition_out` — how the scene leaves
- `priority` — 1-5, where 1 is critical, 5 is nice-to-have (for platform cutdowns later)

---

## Visual Types

Define what appears on screen:

### 1. `capture` — Interactive Screen Recording
- Used for web apps, CLI tools, dashboards
- Type: `"capture"`
- Fields:
  - `action` — what the user/cursor does (click, type, scroll, navigate)
  - `url` or `command` — target URL (web) or command (CLI)
  - `waitFor` — CSS selector or terminal pattern to wait for (optional)
  - `highlight` — element to visually emphasize (CSS selector or coordinate)

Example:
```json
{
  "type": "capture",
  "action": "navigate",
  "url": "http://localhost:3000/dashboard",
  "waitFor": ".metrics-panel",
  "highlight": "#error-count"
}
```

### 2. `terminal` — CLI Output Recording
- Used for CLI tools
- Type: `"terminal"`
- Fields:
  - `command` — shell command to execute
  - `waitFor` — pattern in output to wait for
  - `highlight` — line or pattern to emphasize

Example:
```json
{
  "type": "terminal",
  "command": "my-cli scan config.yaml",
  "waitFor": "Scan complete",
  "highlight": "found 3 issues"
}
```

### 3. `static` — Fallback Screenshot
- Used if interactive capture fails or for static UI states
- Type: `"static"`
- Fields:
  - `action` — e.g., "screenshot"
  - `url` or `file` — target URL or local image path
  - `effect` — "ken-burns" for subtle zoom/pan

Example:
```json
{
  "type": "static",
  "action": "screenshot",
  "url": "http://localhost:3000/results",
  "effect": "ken-burns"
}
```

### 4. `text_card` — Full-Screen Text Overlay
- Used for hook, CTA, or chapter breaks
- Type: `"text_card"`
- Fields:
  - `text` — main text
  - `subtext` — optional subtitle
  - `style` — "dark" or "light" background
  - `duration_ms` — how long to show

Example:
```json
{
  "type": "text_card",
  "text": "Ever spent 20 minutes hunting for a typo?",
  "style": "dark",
  "duration_ms": 5000
}
```

### 5. `user_clip` — Pre-Recorded User Video
- Used for optional user testimonials or custom clips from `.demo-maker/clips/`
- Type: `"user_clip"`
- Fields:
  - `file` — path to `.mp4` or `.webm`
  - `duration_ms` — clip length

Example:
```json
{
  "type": "user_clip",
  "file": ".demo-maker/clips/testimonial-01.mp4",
  "duration_ms": 8000
}
```

---

## Transitions

Define how scenes connect:

| Transition | Use Case | Effect |
|-----------|----------|--------|
| `cut` | Between any scenes (default) | Hard, instant cut |
| `fade` | Opening/closing scenes, segment breaks | Fade to black |
| `crossfade` | Between related scenes | Fade one out while next fades in |

**Forbidden transitions:**
- Star wipes
- 3D flips
- Explosion effects
- Any effect that screams "2005 PowerPoint"

---

## Storyboard Generation

### 1. Segment Breakdown

For each script segment (hook, context, demo, result, cta), create one or more scenes:

**Hook (5-8s):**
- Typically 1 scene
- Visual: text_card with the problem statement
- Priority: 1 (critical)

**Context (5-8s):**
- 1-2 scenes
- Visual: static screenshot of real use case or text + icon
- Priority: 2-3

**Demo (30-35s):**
- 3-6 scenes (breaking down the workflow)
- Visual: capture interactions (click, type, scroll)
- Priority: 1-3 (keep the "wow" moments, cut supporting interactions if needed)

**Result (5-8s):**
- 1-2 scenes
- Visual: final outcome screenshot or metric display
- Priority: 2 (important but cuttable)

**CTA (5-8s):**
- 1 scene
- Visual: text_card with link + "Made with Demo Maker"
- Priority: 1 (critical)

### 2. Script-to-Visual Mapping

For each narration line, determine:
- What visual best supports the claim?
- Is it demonstrable? (If not, adjust script or use a supporting graphic)
- How long does the visual need to stay on screen? (Aim for 2-3 seconds per concept)

### 3. Interaction Design

For capture scenes, plan the user interaction:
- What does the user click/type?
- In what order?
- What should be highlighted or animated?
- Is there a wait (loading screen)?

### 4. Timing & Duration

Each scene's `duration_ms` should match:
- The narration length for that segment
- Time needed to visually convey the concept
- Natural pacing (not rushed, not dragging)

Sum all durations; should total ~60,000ms for a 60-second demo.

---

## Storyboard JSON Format

Save as `.demo-maker/storyboard.json`:

```json
{
  "projectName": "...",
  "totalDuration": 60000,
  "scenes": [
    {
      "id": "hook-1",
      "segment": "hook",
      "narration": "Ever spent 20 minutes hunting for a typo in your config file?",
      "duration_ms": 6000,
      "visual": {
        "type": "text_card",
        "text": "Ever spent 20 minutes hunting for a typo?",
        "style": "dark"
      },
      "transition_in": "fade",
      "transition_out": "cut",
      "priority": 1
    },
    {
      "id": "demo-1",
      "segment": "demo",
      "narration": "That's where [Project Name] comes in. Watch as we load a config file...",
      "duration_ms": 8000,
      "visual": {
        "type": "capture",
        "action": "navigate",
        "url": "http://localhost:3000/upload",
        "waitFor": ".file-input",
        "highlight": ".file-input"
      },
      "transition_in": "cut",
      "transition_out": "cut",
      "priority": 1
    },
    {
      "id": "demo-2",
      "segment": "demo",
      "narration": "In about 2 seconds, we've found the exact issue on line 47.",
      "duration_ms": 7000,
      "visual": {
        "type": "capture",
        "action": "click",
        "url": "http://localhost:3000/upload",
        "highlight": ".error-line-47"
      },
      "transition_in": "cut",
      "transition_out": "cut",
      "priority": 1
    }
  ]
}
```

---

## Platform-Aware Priorities

Set `priority` based on what's essential to keep for platform cutdowns:

- **Priority 1** (must-keep): Hook, demo climax ("aha" moment), CTA
- **Priority 2** (important): Context, result, intermediate steps
- **Priority 3** (nice-to-have): Supporting graphics, transitions, deep-dive details
- **Priority 4** (decorative): Smooth animations, background pans
- **Priority 5** (unused): If you have extra material

This allows Step 7 (cutdowns) to intelligently trim for 30s Twitter version without losing meaning.

---

## Validation Checklist

Before saving storyboard:
- [ ] Total duration sums to ~60,000ms
- [ ] Each scene has narration that matches script
- [ ] Every visual claim is concrete (no vague descriptions)
- [ ] Transitions are sensible (no star wipes)
- [ ] Priority levels are set
- [ ] For web apps: all URLs are localhost
- [ ] For CLI tools: all commands are valid
- [ ] Text_card type used for hook and CTA

---

## Presentation to User

Show a summary:

```
📋 Storyboard Generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Duration:   60 seconds
Scenes:           8 scenes
Hook:             1 scene (text_card)
Context:          2 scenes (static + capture)
Demo:             3 scenes (capture interactions)
Result:           1 scene (static)
CTA:              1 scene (text_card)

Transitions: 7 cuts, 1 fade

Priority Distribution:
- Must-keep (P1): 5 scenes
- Important (P2):  2 scenes
- Nice-to-have (P3): 1 scene

✅ Storyboard saved to .demo-maker/storyboard.json
Ready to proceed to screen capture (Step 5)?
```

Ask user:
- Does this visual flow match the script?
- Any scenes you'd like to reorder or change?
- Proceed with capture, or refine storyboard first?

---

## Proceed to Next Step

Load and execute: `shared/prompts/05-CAPTURE.md`

The capture script will record all screen interactions via Playwright or terminal recording.

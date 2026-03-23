# Step 2: Demo Strategy & Creative Direction

Ask the user a series of guided questions to shape the demo's voice, visuals, platforms, and storytelling approach. Present each question with numbered options; user responds with the number(s) of their choice.

---

## Presentation Method

Present questions using numbered options. User can respond with the number(s) of their choice. For voice questions, generate audio previews so the user can listen before choosing.

---

## Question 1: Language

The entire demo — script, narration, captions — must be in a single language. No mixing.

Ask:

```
What language should the demo be in?

1. English (default)
2. Other — specify (e.g. French, Spanish, German, Japanese, Portuguese)

Your choice: [1-2]
```

If user picks 2, ask them to specify the language. Store the ISO 639-1 code (e.g. `en`, `fr`, `es`, `de`, `ja`, `pt`).

**Technical impact:**
- English (`en`) uses ElevenLabs `eleven_monolingual_v1` (best English quality)
- Any other language uses `eleven_multilingual_v2` (required for non-English)
- Scene durations may need adjustment — some languages are 20-30% more verbose than English
- The script generator must write the entire script in the chosen language
- Validation will reject any script that mixes languages

Store in context: `strategy.language` (ISO 639-1 code, default `"en"`)

---

## Question 2: Target Platforms (Multi-Select)

Ask:

```
Which platforms will this demo appear on?
(Select one or more by number)

1. Full demo (60s, 1920×1080 — the master cut)
2. GitHub README (60s, 1920×1080)
3. Twitter/X (30s, 1280×720 — hook + snippet + CTA)
4. Product Hunt (45s, 1920×1080 — launch day)
5. Instagram Reels (30s, 1080×1920 — vertical)
6. TikTok (30s, 1080×1920 — vertical)
7. All 6 (generate every version)

Your choice(s): [1-7]
```

Store selected platforms in context: `strategy.platforms`

---

## Question 3: Voice — Listen & Select

This question has two parts: preset preview, then optional custom design.

**Prerequisite:** Step 0 (Preflight) already validated the voice provider. Check `preflight.voice.provider` to determine what's available:
- `elevenlabs` → full voice preview + narration + voice design
- `openai` → preset selection by description only (no audio preview)
- `caption-only` → skip this question entirely; inform user captions will be used

### Bundled Voice (Default)

Demo Maker ships with a default voice sample at `.demo-maker/voice-sample.mp3`. If this file exists and no `voice-lock.json` is present, the narration generator will automatically clone this voice on the first run and lock it — giving every project a consistent narrator out of the box.

If the bundled voice sample exists, present this option first:

```
Demo Maker includes a default narration voice (young female, casual creative).
It will be used automatically unless you choose a different one.

1. Use the default voice (recommended — consistent across all projects)
2. Pick a different preset voice
3. Design a custom voice from a description

Your choice: [1-3]
```

If the user picks **1**, skip the rest of Question 2 entirely. The narration generator will clone from `voice-sample.mp3` automatically.

If the user picks **2** or **3**, proceed to Part A or Part B below.

### Part A: Voice Preset Preview

**If `preflight.voice.provider` is `elevenlabs`:**

Generate audio previews using the validated key. Run `voice-preview.js` with a sample sentence from the project analysis (or a fallback like "Here's what your product does, and why it matters.").

```
Pick a narration voice. I've generated short audio samples for each — listen and choose the one that fits your product.

1. Dev Casual — conversational, slightly fast, like showing a friend what you built
   [Play: .demo-maker/voice-previews/dev-casual.mp3]

2. Tech Explainer — clear, measured, like a senior engineer walking through architecture
   [Play: .demo-maker/voice-previews/tech-explainer.mp3]

3. Storyteller — warm, narrative, slower pace, like a founder at a meetup
   [Play: .demo-maker/voice-previews/storyteller.mp3]

4. Founder — confident, direct, energetic, like a YC demo day pitch
   [Play: .demo-maker/voice-previews/founder.mp3]

Your choice: [1-4]
```

**If `preflight.voice.provider` is `openai`:**

Show descriptions only (OpenAI TTS doesn't support preview generation with the same fidelity):

```
Pick a narration voice (OpenAI TTS — descriptions only):

1. Dev Casual — conversational, slightly fast (voice: Onyx)
2. Tech Explainer — clear, measured, professional (voice: Echo)
3. Storyteller — warm, narrative, slower pace (voice: Fable)
4. Founder — confident, direct, energetic (voice: Alloy)

Your choice: [1-4]
```

**If `preflight.voice.provider` is `caption-only`:**

Skip this question. Inform the user: "Voice was set to caption-only in preflight. Subtitles will be burned into the video. You can re-run preflight to change this."

### Part B: Custom Voice Design (Optional)

Only offer if provider is `elevenlabs`:

```
Want to customize the voice further? You can describe what you're after and I'll generate a custom voice.

1. Use the preset as-is (recommended for most projects)
2. Design a custom voice — describe what you want
   Example: "young female dev, slightly fast, Australian accent"
   Example: "deep calm narrator, like a documentary voiceover"

Your choice: [1-2]
```

If user picks option 2, collect their description and run `voice-preview.js --design "<description>"` to generate a custom voice sample. Let them confirm or iterate.

Store in context: `strategy.voice.preset`, `strategy.voice.customDescription` (if any), `strategy.voice.voiceId`

---

## Visual Rendering (Auto-Set)

Do NOT ask the user about visual tier. Remotion is the rendering engine — it powers all video output. Set automatically:

```json
{
  "strategy.visualTier": "remotion",
  "strategy.aiVideoProvider": null
}
```

<!-- FUTURE DEV: Add AI video clip integration (Google Veo 3, Runway Gen-3) as an
     optional enhancement on top of Remotion. When implemented, add a question here
     that only appears if an AI video API key was validated in preflight (Step 0).
     Tiers would be: Remotion only (default) | Remotion + 1-2 AI hero clips | Full AI.
     See 00-SETUP.md Question: AI Video Setup for the key configuration flow. -->

---

## Question 4: Color Scheme & Visual Style

Ask:

```
What color scheme and visual style fits your product?

1. Dark mode (dark backgrounds, neon/bright accents — good for dev tools, terminals)
2. Light & clean (white/light grey backgrounds, subtle colors — good for SaaS, productivity)
3. Cinematic / moody (deep contrast, film grain, dramatic lighting — good for AI/creative tools)

Your choice: [1-3]
```

Store in context: `strategy.colorScheme`

---

## Animation Style (Auto-Set)

Do NOT ask the user about animation style. Motion graphics is the only implemented rendering mode. Set automatically:

```json
{
  "strategy.animationStyle": "motion-graphics"
}
```

<!-- FUTURE DEV: Add alternative animation styles when scene components support them.
     Planned styles:
     - "motion-graphics-characters": Lottie/Rive animated figures that point, react,
       and interact with UI elements. Requires adding Lottie/Rive assets and integrating
       @remotion/lottie or @rive-app/react-canvas into scene components.
     - "developer-authentic": Raw terminal recordings and browser captures composited
       directly, minimal animation. Requires adding a passthrough/capture overlay mode
       to each scene component that uses Playwright recordings from Step 5.
     When implemented, add a question here with the available styles. -->

---

## Dynamism (Auto-Set)

Do NOT ask the user about dynamism. The spring configs, interpolation ranges, and fade
durations are hardcoded in each scene component. This setting has no effect on rendering.
Set automatically:

```json
{
  "strategy.dynamism": "moderate"
}
```

<!-- FUTURE DEV: Make dynamism configurable by parameterizing spring damping, mass,
     fade duration (FADE_FRAMES), and interpolation ranges in scene components.
     When implemented, expose as a strategy question with options:
     - minimal (high damping, long fades, slow springs)
     - moderate (current defaults)
     - high-energy (low damping, short fades, fast springs)
     - cinematic (variable — slow reveals with quick cuts) -->

---

## Question 5: Demo Focus

Ask:

```
What's the main focus of the demo?

1. The "aha" feature (zoom in on one killer capability)
2. End-to-end workflow (show how someone actually uses it)
3. Before/after comparison (show the problem, then the solution)
4. Speed/efficiency (highlight how much faster or easier it is)

Your choice: [1-4]
```

Store in context: `strategy.demoFocus`

---

## Question 6: Case Study Integration (Conditional)

Only ask if `.case-study/` exists and contains a build narrative:

```
Should the demo include the project's origin story?

1. Weave build story into narration (opening: "I was frustrated...")
2. Product-focused only (skip the backstory, focus on features)
3. Brief "how I built this" epilogue (demo product, then 15s on the journey)

Your choice: [1-3]
```

Store in context: `strategy.caseStudyIntegration`

If user chooses option 1 or 3, extract developer quotes from `.case-study/events.json` to use in narration.

**Important: Collect author backstory.** If the user picks option 1 or 3, you need real details to write an authentic script — not generic placeholder narration. Ask follow-up questions:

```
To write a genuine origin story, I need a few details from you:

1. What specific frustration or moment made you start building this?
2. Who is this for? (yourself, your team, a type of user?)
3. What's the one thing you want viewers to feel or take away?
4. Any memorable moments from the build — breakthroughs, surprises, pivots?

(Short answers are fine — even a sentence each. I'll weave them into the script.)
```

Use the author's actual words and phrasing where possible. The goal is a script that sounds like *them*, not like a template.

---

## Storage

After all questions are answered, store in context:

```json
{
  "strategy": {
    "language": "en",
    "platforms": ["full", "github", "twitter", "producthunt", "instagram", "tiktok"],
    "voice": {
      "preset": "storyteller",
      "customDescription": null,
      "voiceId": "VR6AewLTigWG4xSOukaG"
    },
    "visualTier": "remotion",
    "aiVideoProvider": null,
    "colorScheme": "light",
    "animationStyle": "motion-graphics",
    "dynamism": "moderate",
    "demoFocus": "end-to-end",
    "caseStudyIntegration": "weave-story"
  }
}
```

---

## Confirmation

Present a summary of choices:

```
Strategy Confirmed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Language:       English
Platforms:      All 6 (Full, GitHub, Twitter, PH, Instagram, TikTok)
Voice:          Storyteller (Arnold) — warm, narrative
Rendering:      Remotion (motion graphics)
Color scheme:   Light & clean
Dynamism:       Moderate
Focus:          End-to-end workflow
Case Study:     Weave build story in

Ready to generate script (Step 3).
```

---

## Proceed to Next Step

Load and execute: `shared/prompts/03-SCRIPT.md`

The script prompt will generate narration based on the analysis + strategy answers.

---

## Notes

- If user is unsure about a choice, suggest the most common option for their project type
- Answers are final for this run; user can regenerate with different settings later
- Store all answers; they will be referenced in every subsequent step
- Voice preview files are saved to `.demo-maker/voice-previews/` and can be replayed

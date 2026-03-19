# Step 2: Demo Strategy & Creative Direction

Ask the user a series of guided questions to shape the demo's voice, visuals, platforms, and storytelling approach. Present each question with numbered options; user responds with the number(s) of their choice.

---

## Presentation Method

Present questions using numbered options. User can respond with the number(s) of their choice. For voice questions, generate audio previews so the user can listen before choosing.

---

## Question 1: Target Platforms (Multi-Select)

Ask:

```
Which platforms will this demo appear on?
(Select one or more by number)

1. Full demo (60s, 1920×1080 — the master cut)
2. GitHub README (60s, 1920×1080 + GIF fallback)
3. Twitter/X (30s, 1280×720 — hook + snippet + CTA)
4. Product Hunt (45s, 1920×1080 — launch day)
5. Instagram Reels (30s, 1080×1920 — vertical)
6. TikTok (30s, 1080×1920 — vertical)
7. GIF (15s, 800px wide — silent autoplay for READMEs)
8. All 7 (generate every version)

Your choice(s): [1-8]
```

Store selected platforms in context: `strategy.platforms`

---

## Question 2: Voice — Listen & Select

This question has two parts: preset preview, then optional custom design.

**Prerequisite:** Step 0 (Preflight) already validated the voice provider. Check `preflight.voice.provider` to determine what's available:
- `elevenlabs` → full voice preview + narration + voice design
- `openai` → preset selection by description only (no audio preview)
- `caption-only` → skip this question entirely; inform user captions will be used

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

## Question 3: Color Scheme & Visual Style

Ask:

```
What color scheme and visual style fits your product?

1. Dark mode (dark backgrounds, neon/bright accents — good for dev tools, terminals)
2. Light & clean (white/light grey backgrounds, subtle colors — good for SaaS, productivity)
3. Brand colors — I'll pull your primary colors from the project (if available) and build around those
4. Cinematic / moody (deep contrast, film grain, dramatic lighting — good for AI/creative tools)

Your choice: [1-4]
```

If user picks 3, attempt to detect brand colors from the project's CSS, config, or assets. If none found, ask for hex codes.

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

## Question 3: Scale & Dynamism

Ask:

```
How dynamic should the visuals be?

1. Minimal — mostly static with subtle fade-ins and text animations
2. Moderate — UI elements animate in, smooth transitions between sections
3. High energy — fast cuts, particle effects, camera zooms, constant motion
4. Cinematic pacing — slow dramatic reveals, hold on key moments, breathing room

Your choice: [1-4]
```

Store in context: `strategy.dynamism`

---

## Question 4: Demo Focus

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

## Question 5: Case Study Integration (Conditional)

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

---

## Storage

After all questions are answered, store in context:

```json
{
  "strategy": {
    "platforms": ["full", "github", "twitter", "producthunt", "instagram", "tiktok", "gif"],
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
Platforms:      All 7 (Full, GitHub, Twitter, PH, Instagram, TikTok, GIF)
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

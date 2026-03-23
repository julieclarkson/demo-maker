# Step 3: Generate Narration Script

Generate a narration script that is concise, authentic, and demonstrable on screen. The script is the skeleton of the entire demo.

---

## Script Structure

Target a **60-second demo** as the base. Platform-specific cutdowns happen in Step 7.

| Segment | Duration | Purpose |
|---------|----------|---------|
| Hook | 5-8s | State the problem in one sentence |
| Context | 5-8s | Who has this problem and why it matters |
| Demo | 30-35s | Show the product solving the problem |
| Result | 5-8s | Show the outcome / what changed |
| CTA | 5-8s | Where to get it + attribution |

**Total: ~60 seconds**

---

## Script Generation Rules

### 1. Word Count & Pacing
- Target **~150 words** for 60 seconds (natural speaking pace: ~2.5 words per second)
- Use pauses (written as `[pause]` or `...`) for emphasis
- Vary sentence length to avoid monotone delivery

### 2. Authenticity
- If case-study data exists and user chose "weave story", use developer's own words from reflections
- Attribute quotes: "As the creator put it: '...'"
- Avoid hype language; use genuine language

### 3. Demonstrability
- **Every claim must be shown on screen** in the demo
- If you write "saves 30 minutes per month", the storyboard must show a clock/timer
- If you write "zero setup", the demo must show an easy onboarding flow
- Avoid abstract claims that can't be visualized

### 4. Anti-Slop Validation
- Run: `node scripts/anti-slop.js --validate-script`
- This checks:
  - No banned words (see `anti-slop-rules.json`)
  - Max 2 adjectives per sentence (avoid "revolutionary cutting-edge innovative")
  - No marketing jargon ("synergy", "leverage", "paradigm shift")
  - Natural pacing (no run-on sentences)

### 5. Tone Alignment
Match the script to `strategy.voiceTone`:

**Technical walkthrough:**
- Explain what, how, and why
- Use precise terminology
- Structure: problem → feature → capability → result

**Storytelling:**
- Open with personal frustration or insight
- Show how product solves it
- End with transformation
- Use "I", "you", "we"

**Sales pitch:**
- Lead with benefit, not feature
- Emphasize transformation and outcomes
- Confident, present-tense language
- Clear CTA

**Casual dev:**
- Conversational, as if explaining to a friend
- Relatable humor if appropriate
- Technical but not pedantic
- Authentic voice

---

## Generation Pipeline

### Step 1: Draft Script

Generate 5 versions of the script based on:
- Project metadata (from Step 1)
- Demo focus (from Step 2)
- Voice tone (from Step 2)
- Case study narrative (if exists)

Each version should take a different angle. For example:
- **Version A**: Problem-first (before/after)
- **Version B**: Feature-first (what it does)
- **Version C**: Developer story (personal journey)
- **Version D**: Efficiency-focused (metrics)
- **Version E**: Integration-focused (how it fits your workflow)

### Step 2: Validate Each Version

For each draft:

```bash
node scripts/anti-slop.js --validate-script < draft.txt
```

Keep only versions that pass validation.

### Step 3: Select Best Version

Choose the version that best matches:
1. The user's selected voice tone
2. The demo focus
3. The project's actual capabilities

### Step 4: Display to User

Present the selected script with:
- Segment breakdown (hook, context, demo, result, CTA)
- Word count
- Estimated duration
- Validation status ✓

---

## Example Script (60s, Casual Dev Tone)

```
[HOOK - 5s]
"Ever spent 20 minutes hunting for a typo in your config file?"

[CONTEXT - 6s]
"Yeah, I know. It's one of those tasks that shouldn't take long,
but always does. And if you're managing multiple services..."

[DEMO - 35s]
"That's where [Project Name] comes in.
[Watch as we load a config file] ... [error highlighted]
...in about 2 seconds, we've found the exact issue,
[line number shown] on line 47.
But it goes further. [Show scan of entire project]
You can scan your whole project at once. Catches duplicates,
unused variables, security gaps... all in one shot."

[RESULT - 6s]
"What used to take an hour of manual review? Now happens in seconds.
Your team ships faster. You sleep better."

[CTA - 8s]
"[Project Name] is on GitHub.
Made with Demo Maker. Let's build better."
```

---

## Approval & Refinement

After generating the script, present to user:

**Option 1: Accept**
```
✅ Script looks great! Ready to proceed to storyboarding.
```

**Option 2: Rewrite**
```
I'd like a different tone or angle.
```
Then present the alternative versions (A-E) and let user choose.

**Option 3: Tweak**
```
I like it, but let me adjust a few phrases...
```
User can edit specific segments via chat. No frame-level editing; only full-segment rewrites.

---

## Storage

Save the approved script:

```bash
mkdir -p .demo-maker
echo "[SCRIPT CONTENT]" > .demo-maker/script.md
```

Update context:

```json
{
  "script": {
    "approved": true,
    "content": "...",
    "wordCount": 152,
    "estimatedDuration": 60
  }
}
```

---

## Validation Before Proceeding

Checklist:
- [ ] Script passes `anti-slop.js` validation
- [ ] Word count is ~150 for 60s
- [ ] Every claim is demonstrable
- [ ] Tone matches selected voice
- [ ] Script has been approved by user

---

## Proceed to Next Step

Load and execute: `shared/prompts/04-STORYBOARD.md`

The storyboard will translate this script into a scene-by-scene visual plan.

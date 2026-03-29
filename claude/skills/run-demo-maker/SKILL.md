---
name: run-demo-maker
description: "Generate a narrated MP4 product demo from the current codebase. Analyzes the project, asks creative direction questions, generates script, captures screens, narrates, and renders video. Use when the user says 'run demo maker', 'make a demo', 'generate demo', 'create demo video', or 'demo-maker:demo'."
---

# Run Demo Maker

Generate a complete narrated product demo from the current codebase.

## Prerequisites

- `.demo-maker/` directory must exist (run `/demo-maker:activate` first)
- `.demo-maker/config.json` must have at least one API key (or demo will use caption-only mode)

## Step 0: Locate Demo Maker

Find the demo-maker root directory. Try in order:
1. `.demo-maker-plugin/` in the project root
2. The directory containing this skill file's grandparent (Claude plugin install — navigate from `skills/run-demo-maker/SKILL.md` up to the plugin root)

Store this path as `DM_ROOT` — all scripts and prompts are relative to it.

Verify:
```bash
ls "$DM_ROOT/prompts/00-MAIN.md"
```

## Step 1: Preflight

Run preflight checks:
```bash
node "$DM_ROOT/scripts/preflight.js"
```

If preflight fails, stop and report. Do not proceed.

## Step 2: Analyze Project

Read and execute: `$DM_ROOT/prompts/01-ANALYZE.md`

Store analysis results — every subsequent step uses this data.

## Step 3: Creative Strategy

Read and execute: `$DM_ROOT/prompts/02-STRATEGY.md`

Ask the user 4-5 multiple-choice questions about platform, tone, focus, style, and case study integration. Store answers.

## Step 4: Generate Script

Read and execute: `$DM_ROOT/prompts/03-SCRIPT.md`

Generate narration script, run anti-slop validation, present to user for approval.

## Step 5: Plan Storyboard

Read and execute: `$DM_ROOT/prompts/04-STORYBOARD.md`

Create scene-by-scene plan with visuals, timing, and transitions. Save to `.demo-maker/storyboard.json`.

## Step 6: Capture Screens

Read and execute: `$DM_ROOT/prompts/05-CAPTURE.md`

Record the product in action via Playwright (web apps) or terminal recorder (CLI tools). Output to `.demo-maker/captures/`.

## Step 7: Generate Narration

Read and execute: `$DM_ROOT/prompts/06-NARRATE.md`

Generate voice audio via ElevenLabs (or fallback). Output to `.demo-maker/narration/`.

## Step 8: Render Video

Read and execute: `$DM_ROOT/prompts/07-RENDER.md`

Assemble captures + narration into final MP4 with captions and watermark. Output to `OUTPUTS_DEMO_MAKER/{run-id}/demo-full.mp4`.

## Step 9: Generate Cut-Downs

Read and execute: `$DM_ROOT/prompts/08-CUTDOWNS.md`

Create platform-specific versions (Twitter 30s, Product Hunt 45s, GitHub 60s + GIF). Output to `OUTPUTS_DEMO_MAKER/{run-id}/`.

## Step 10: Integrate

Read and execute: `$DM_ROOT/prompts/09-INTEGRATE.md`

Push demo into Case Study Maker and Git Launcher ecosystems. Offer to apply assets.

## Rules

- Create `OUTPUTS_DEMO_MAKER/{run-id}/` folder at project root for ALL outputs (where run-id is `demo-{YYYYMMDD}-{HHmmss}`)
- NEVER overwrite files outside `OUTPUTS_DEMO_MAKER/` without asking
- If a script/step fails, skip it and continue (note what was skipped)
- Execute steps IN ORDER
- Always present script for user approval before proceeding to capture
- The "Made with Demo Maker" watermark is always included

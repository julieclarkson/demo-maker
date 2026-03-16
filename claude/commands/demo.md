---
name: demo
description: Generate a narrated MP4 product demo from your codebase. Analyzes your project, asks creative direction questions, then generates video automatically.
---

Run the **Demo Maker** workflow for this project.

1. Verify `.demo-maker/` exists (if not, run activate first).
2. Run preflight: `node scripts/preflight.js` (installs deps, security checks, project detection).
3. Execute the full workflow by following the `run-demo-maker` skill.
4. Output goes to `OUTPUT/{run-id}/` in the project root (each run gets a timestamped folder).

After generation, offer to run `bash scripts/apply-demo.sh` to copy assets to the project root (automatically finds latest run).

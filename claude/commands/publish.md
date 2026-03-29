---
name: publish
description: Publish demo videos to GitHub Release and embed in case study pages + launch kit. Fully automated.
---

Publish demo videos and integrate with companion plugins.

1. Locate the Demo Maker root: check `.demo-maker/` in the project, or the plugin directory.
2. Read `$DM_ROOT/prompts/09-INTEGRATE.md` and follow the workflow.
3. Find the most recent demo run in `OUTPUTS_DEMO_MAKER/demo-*/`.
4. Confirm which run to publish with the user.
5. Run: `node "$DM_ROOT/scripts/video-publisher.js" <run-dir> --project "<name>" --repo "owner/repo"`
6. Embed published URLs into Case Study Maker pages (if `.case-study/` exists).
7. Embed published URLs into Git Launcher launch kit posts (if `git-launch/` exists).
8. Display all video URLs to the user.

For YouTube instead: add `--method youtube` (manual upload with metadata package).

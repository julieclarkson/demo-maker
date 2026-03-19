---
name: publish
description: Publish demo videos and get embeddable URLs. Default: GitHub Release (automated). Optional: YouTube (manual).
---

Publish demo videos.

1. Locate the Demo Maker root: check `.demo-maker/` in the project, or the plugin directory.
2. Read `$DM_ROOT/prompts/10-PUBLISH.md` and follow the workflow.
3. Find the most recent demo run in `OUTPUT/demo-*/`.
4. Confirm which run to publish with the user.
5. Ask method preference: GitHub Release (default, automated) or YouTube (manual with metadata package).
6. GitHub: `node "$DM_ROOT/scripts/video-publisher.js" <run-dir> --project "<name>" --repo "owner/repo"`
7. YouTube: `node "$DM_ROOT/scripts/video-publisher.js" <run-dir> --project "<name>" --method youtube`
8. Display all video URLs to the user.

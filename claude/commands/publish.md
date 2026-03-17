---
name: publish
description: Upload demo videos to YouTube and get embeddable URLs. Requires YouTube API credentials in .demo-maker/.env.
---

Publish demo videos to YouTube.

1. Locate the Demo Maker root: check `.demo-maker/` in the project, or the plugin directory.
2. Read `$DM_ROOT/prompts/10-PUBLISH.md` and follow the workflow.
3. Find the most recent demo run in `OUTPUT/demo-*/`.
4. Confirm which run to publish with the user.
5. Run the YouTube uploader script and display all URLs.

# Step 10 — Publish Demos

Upload rendered demo videos to YouTube and return embeddable URLs.

## Prerequisites

- Demo videos rendered (Step 8 complete — `OUTPUT/demo-{timestamp}/` exists)
- YouTube credentials configured in `.demo-maker/.env`:
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`
- If credentials are missing, walk the user through setup:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create a project or select existing
  3. Enable **YouTube Data API v3** (APIs & Services → Library → search "YouTube Data API v3" → Enable)
  4. Create credentials → OAuth 2.0 Client ID → Application type: **Desktop app**
  5. Copy the Client ID and Client Secret into `.demo-maker/.env`

## Workflow

### 1. Identify the demo run

Find the most recent demo run directory:

```
ls -td OUTPUT/demo-* | head -1
```

Confirm with the user which run to publish if multiple exist.

### 2. Check credentials

Verify YouTube credentials exist in `.demo-maker/.env`. If missing, guide the user through the setup above. Do not proceed without valid credentials.

### 3. Upload to YouTube

Run the uploader:

```bash
node "$DM_ROOT/scripts/youtube-uploader.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --privacy unlisted
```

Arguments:
- First argument: path to the demo run directory
- `--project`: display name for the project (used in video titles)
- `--privacy`: `unlisted` (default), `public`, or `private`

The script will:
- Open a browser for YouTube OAuth on first run (one-time authorization)
- Upload each demo video with optimized metadata:
  - **Title**: "{Project} - Full Product Demo", "{Project} - 30s Demo", etc.
  - **Description**: Auto-generated from narration script + repo link
  - **Tags**: Project name, language, framework, "demo", "product demo"
  - **Category**: Science & Technology
- Save all YouTube URLs to `OUTPUT/demo-{timestamp}/youtube-urls.json`

### 4. Display results

After upload completes, present the URLs to the user:

```
✓ Published to YouTube

  Full Demo:      https://youtube.com/watch?v=...
  GitHub Demo:    https://youtube.com/watch?v=...
  Twitter (30s):  https://youtube.com/watch?v=...
  Product Hunt:   https://youtube.com/watch?v=...
  Instagram:      https://youtube.com/watch?v=...
  TikTok:         https://youtube.com/watch?v=...
  GIF Preview:    https://youtube.com/watch?v=...

  URLs saved to: OUTPUT/demo-{timestamp}/youtube-urls.json
```

### 5. Companion plugin integration

After publishing, remind the user:

> These YouTube URLs are now available to companion plugins:
> - **Case Study Maker**: Run `/generate` — marketing and portfolio pages will auto-embed the YouTube video
> - **Git Launcher**: Run `/git-launch` — README and launch kit posts will include YouTube links
>
> The plugins read `youtube-urls.json` automatically. No manual URL copying needed.

## Error handling

- **No credentials**: Guide through setup (step above)
- **OAuth denied**: User must authorize YouTube access; retry with `--privacy unlisted`
- **Upload quota exceeded**: YouTube allows ~6 uploads/day for new API projects. Suggest waiting or uploading remaining videos manually
- **Video too large**: YouTube accepts up to 128GB. Demo videos should be well under this
- **Network error**: Retry the command — uploads already completed will be skipped if youtube-urls.json has their entry

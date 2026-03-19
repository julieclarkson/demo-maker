# Step 10 — Publish Demos

Upload rendered demo videos to YouTube and return embeddable URLs.

## Prerequisites

- Demo videos rendered (Step 8 complete — `OUTPUT/demo-{timestamp}/` exists)
- A YouTube account (any Google account with a YouTube channel)
- No API keys or developer setup needed

### First-time setup

If the user hasn't signed into YouTube for Demo Maker yet, run:

```bash
node "$DM_ROOT/scripts/youtube-setup.js"
```

This opens a browser window where the user signs into their Google account. Their login is saved for future uploads. Takes about 30 seconds.

## Workflow

### 1. Identify the demo run

Find the most recent demo run directory:

```
ls -td OUTPUT/demo-* | head -1
```

Confirm with the user which run to publish if multiple exist.

### 2. Upload to YouTube

Run the uploader:

```bash
node "$DM_ROOT/scripts/youtube-uploader.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --privacy unlisted
```

Arguments:
- First argument: path to the demo run directory
- `--project`: display name for the project (used in video titles)
- `--privacy`: `unlisted` (default), `public`, or `private`

The script will:
- Open a visible browser window (reuses saved YouTube login)
- If not signed in, pause and wait for the user to sign in
- Upload each demo video with optimized metadata:
  - **Title**: "{Project} - Full Product Demo", "{Project} - 30s Demo", etc.
  - **Description**: Auto-generated from narration script + repo link
  - **Tags**: Project name, language, framework, "demo", "product demo"
  - **Visibility**: Unlisted by default
- Save all YouTube URLs to `OUTPUT/demo-{timestamp}/youtube-urls.json`

### 3. Display results

After upload completes, present the URLs to the user:

```
Published to YouTube

  Full Demo:      https://youtube.com/watch?v=...
  GitHub Demo:    https://youtube.com/watch?v=...
  Twitter (30s):  https://youtube.com/watch?v=...
  Product Hunt:   https://youtube.com/watch?v=...
  Instagram:      https://youtube.com/watch?v=...
  TikTok:         https://youtube.com/watch?v=...
  GIF Preview:    https://youtube.com/watch?v=...

  URLs saved to: OUTPUT/demo-{timestamp}/youtube-urls.json
```

### 4. Companion plugin integration

After publishing, remind the user:

> These YouTube URLs are now available to companion plugins:
> - **Case Study Maker**: Run `/generate` — marketing and portfolio pages will auto-embed the YouTube video
> - **Git Launcher**: Run `/git-launch` — README and launch kit posts will include YouTube links
>
> The plugins read `youtube-urls.json` automatically. No manual URL copying needed.

## Error handling

- **Not signed in**: The browser will pause and wait for sign-in. If the user needs to set up fresh, run `node "$DM_ROOT/scripts/youtube-setup.js"`
- **Upload stalls**: YouTube processes videos before allowing publish. Large files may take several minutes. The script waits automatically.
- **Browser closes unexpectedly**: Re-run the command. Videos already uploaded won't be duplicated (check YouTube Studio to confirm).
- **Network error**: Re-run the command. The browser session persists across runs.

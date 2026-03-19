# Step 10 — Publish Demos

Upload demo videos and get embeddable URLs.

## Methods

### GitHub Release (default — fully automated)

- Videos uploaded as release assets via `gh` CLI
- No manual steps, no dragging, no pasting
- URLs returned instantly
- Works great for embedding in pages, READMEs, and launch kits
- Requires: `gh` CLI authenticated (`gh auth login`)

### YouTube (optional — manual upload)

- Script generates a metadata package (thumbnails, titles, descriptions, tags)
- You upload manually in your own browser
- Paste URLs back and the script auto-matches them
- Best when you want videos on YouTube specifically
- Requires: A YouTube account, ffmpeg (for thumbnails)

## Workflow

### 1. Identify the demo run

Find the most recent demo run directory:

```
ls -td OUTPUT/demo-* | head -1
```

Confirm with the user which run to publish if multiple exist.

### 2. Run the publisher

**GitHub Release (default):**

```bash
node "$DM_ROOT/scripts/video-publisher.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --repo "owner/repo"
```

**YouTube (manual):**

```bash
node "$DM_ROOT/scripts/video-publisher.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --method youtube
```

Arguments:
- First argument: path to the demo run directory
- `--project`: display name for the project (used in video titles/release name)
- `--repo`: GitHub repo in `owner/name` format (auto-detected from git remote if omitted)
- `--method`: `github` (default) or `youtube`

### 3. GitHub Release flow

The script:
1. Creates a tagged release on the repo (e.g. `demo-20260316-142115`)
2. Uploads all video files as release assets (one `gh release create` command)
3. Fetches the download URLs for each asset
4. Saves everything to `video-urls.json`

That's it. No manual steps.

### 4. YouTube flow

**Phase 1 — Package generation:**

The script creates `OUTPUT/demo-{timestamp}/youtube-upload/` with numbered subfolders:

```
youtube-upload/
  UPLOAD-GUIDE.txt
  01-demo-full/
    demo-full.mp4           ← Video file (symlink)
    thumbnail.jpg           ← Auto-generated
    metadata.txt            ← All fields
    subtitles.txt           ← From narration script
  02-demo-github/
    ...
```

Each `metadata.txt` includes: Title, Description, Thumbnail, Audience, Language, Subtitles, Tags, End Screen, Cards, Copyright, Visibility.

**Phase 2 — Manual upload:**

Opens the folder and YouTube Studio. Drag each video in, paste metadata.

**Phase 3 — URL collection:**

Paste all YouTube URLs (one per line). The script auto-matches via oEmbed.

### 5. Companion plugin integration

After publishing, remind the user:

> Video URLs are now available to companion plugins:
> - **Case Study Maker**: Run `/generate` — pages auto-embed the video
> - **Git Launcher**: Run `/git-launch` — README and posts include video links
>
> The plugins read `video-urls.json` automatically. No manual URL copying needed.

## Error handling

- **gh not authenticated**: Run `gh auth login` first
- **Release tag already exists**: Script uploads assets to the existing release
- **Thumbnail generation fails**: Replace `thumbnail.jpg` manually (YouTube only)
- **oEmbed matching fails**: Falls back to manual selection (YouTube only)

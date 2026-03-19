# Step 10 — Publish Demos

Upload rendered demo videos to YouTube and save embeddable URLs.

## Prerequisites

- Demo videos rendered (Step 8 complete — `OUTPUT/demo-{timestamp}/` exists)
- A YouTube account (any Google account with a YouTube channel)
- ffmpeg installed (for thumbnail generation)
- No API keys, no developer setup, no browser automation

## How it works

The script creates a complete upload package — organized folders with each video, auto-generated thumbnails, metadata files (title, description, tags, audience, language, subtitles, end screen guidance, cards guidance, copyright, visibility), and a master upload guide. You drag each folder's contents into YouTube Studio in your own browser. After uploading, paste the URLs back and the script auto-matches them to your videos.

Your password and browser session never leave your machine. The AI never sees your login.

## Workflow

### 1. Identify the demo run

Find the most recent demo run directory:

```
ls -td OUTPUT/demo-* | head -1
```

Confirm with the user which run to publish if multiple exist.

### 2. Run the publisher

```bash
node "$DM_ROOT/scripts/youtube-uploader.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --privacy public
```

Arguments:
- First argument: path to the demo run directory
- `--project`: display name for the project (used in video titles)
- `--privacy`: `public` (default), `unlisted`, or `private`

### 3. Phase 1 — Package generation

The script creates `OUTPUT/demo-{timestamp}/youtube-upload/` with:

```
youtube-upload/
  UPLOAD-GUIDE.txt          ← Master reference with all metadata
  01-demo-full/
    demo-full.mp4           ← Video file (symlink)
    thumbnail.jpg           ← Auto-generated (replace with your own if desired)
    metadata.txt            ← All fields: title, description, tags, etc.
    subtitles.txt           ← From narration script (if available)
  02-demo-github/
    ...
  03-demo-twitter/
    ...
```

Each `metadata.txt` includes:
- **Title**: Optimized for the platform
- **Description**: From narration + repo link
- **Thumbnail**: Auto-generated from frame at 2 seconds (replaceable)
- **Audience**: Not made for kids
- **Language**: English
- **Subtitles**: Extracted from narration script
- **Tags**: Project name, framework, language, "demo", "product demo"
- **End Screen**: Guidance to add "Best for viewer" + Subscribe button
- **Cards**: Guidance to link to project repo
- **Copyright**: Original content declaration
- **Visibility**: Public (or as specified)

### 4. Phase 2 — Manual upload

The script opens the `youtube-upload/` folder and YouTube Studio. For each numbered folder, the user:
1. Drags the .mp4 into YouTube Studio
2. Copies metadata from `metadata.txt` (title, description, tags)
3. Uploads `thumbnail.jpg` as custom thumbnail
4. Sets audience, language, visibility per the metadata
5. Clicks Publish

### 5. Phase 3 — URL collection

After all uploads, the user goes to YouTube Studio → Content, copies the shareable link for each video, and pastes them all into the terminal (one per line). The script uses YouTube's public oEmbed API to read each video's title and auto-match it to the correct demo. No authentication needed.

If auto-matching fails, the script asks the user to manually pick which video the URL belongs to.

### 6. Companion plugin integration

After collecting URLs, remind the user:

> These YouTube URLs are now available to companion plugins:
> - **Case Study Maker**: Run `/generate` — marketing and portfolio pages will auto-embed the YouTube video
> - **Git Launcher**: Run `/git-launch` — README and launch kit posts will include YouTube links
>
> The plugins read `youtube-urls.json` automatically. No manual URL copying needed.

## Error handling

- **Thumbnail generation fails**: User can create their own thumbnail and replace `thumbnail.jpg` in the folder
- **oEmbed matching fails**: Script falls back to manual selection (pick from a numbered list)
- **Interrupted mid-upload**: Re-run the command — the package folder persists, just skip to Phase 3

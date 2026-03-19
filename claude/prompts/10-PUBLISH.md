# Step 10 — Publish Demos

Upload rendered demo videos to YouTube and save embeddable URLs.

## Prerequisites

- Demo videos rendered (Step 8 complete — `OUTPUT/demo-{timestamp}/` exists)
- A YouTube account (any Google account with a YouTube channel)
- No API keys, no developer setup, no browser automation

## How it works

The script generates optimized titles, descriptions, and tags for each demo video, copies them to your clipboard one at a time, and opens YouTube Studio in your own browser. You upload each video manually (drag and drop), paste the metadata the script provides, and paste the YouTube URL back into the terminal. The script saves all URLs to `youtube-urls.json`.

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
node "$DM_ROOT/scripts/youtube-uploader.js" OUTPUT/demo-{timestamp} --project "{ProjectName}" --privacy unlisted
```

Arguments:
- First argument: path to the demo run directory
- `--project`: display name for the project (used in video titles)
- `--privacy`: `unlisted` (default), `public`, or `private`

The script will:
- Open YouTube Studio in the user's own browser
- For each video:
  - Show the file path to upload
  - Copy the title to clipboard — user pastes in YouTube
  - Copy the description to clipboard — user pastes in YouTube
  - Copy the tags to clipboard — user pastes in YouTube
  - User sets visibility and clicks Publish
  - User pastes the YouTube URL back into the terminal
- Save all URLs to `OUTPUT/demo-{timestamp}/youtube-urls.json`
- Save metadata reference to `OUTPUT/demo-{timestamp}/youtube-metadata.txt`

### 3. Resuming interrupted uploads

If the user quits partway through, re-running the same command will detect previously uploaded videos and offer to skip them. Progress is saved after each video.

### 4. Display results

After all uploads, present the URLs to the user:

```
Done! 7 uploaded, 0 skipped

  URLs saved to: OUTPUT/demo-{timestamp}/youtube-urls.json

  YouTube URLs:
    demo-full: https://youtube.com/watch?v=...
    demo-github: https://youtube.com/watch?v=...
    ...
```

### 5. Companion plugin integration

After publishing, remind the user:

> These YouTube URLs are now available to companion plugins:
> - **Case Study Maker**: Run `/generate` — marketing and portfolio pages will auto-embed the YouTube video
> - **Git Launcher**: Run `/git-launch` — README and launch kit posts will include YouTube links
>
> The plugins read `youtube-urls.json` automatically. No manual URL copying needed.

## Error handling

- **Not signed into YouTube**: Open youtube.com in your browser and sign in first, or run `node "$DM_ROOT/scripts/youtube-setup.js"`
- **Wrong URL pasted**: Re-run the command — it will skip already-uploaded videos and let you redo the ones that failed
- **Quit mid-upload**: Re-run the command — it resumes where you left off

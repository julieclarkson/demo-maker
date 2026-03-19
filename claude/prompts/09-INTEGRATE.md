# Step 9: Publish & Integrate (Optional)

Upload demo videos to a GitHub Release and embed them into Case Study Maker pages and Git Launcher outputs — all in one automated step.

---

## When to Offer This Step

After Step 8 (Cutdowns) completes, ask:

```
Demo generation complete! 7 platform-ready videos are in OUTPUT/{run-id}/.

Would you like to publish these demos and integrate them into your
case study pages and launch kit? This will:

  1. Upload all videos to a GitHub Release (instant, automated)
  2. Embed the video URLs into your case study pages (if installed)
  3. Embed the video URLs into your launch kit posts (if installed)

Everything is automated — no manual uploads or copy-pasting.

[yes / no]
```

If **no** → skip to the Summary Report (Part F). Local files remain in `OUTPUT/`.
If **yes** → proceed below.

---

## Part A: Publish to GitHub Release

### Step 1: Detect the repo

Auto-detect from git remote:
```bash
git remote get-url origin
```

If not detected, ask the user for the GitHub repo (`owner/name` format).

### Step 2: Run the publisher

```bash
node "$DM_ROOT/scripts/video-publisher.js" OUTPUT/{run-id} \
  --project "{ProjectName}" \
  --repo "{owner/repo}"
```

This creates a tagged release (e.g. `demo-20260316-142115`), uploads all 7 videos as release assets, and writes `video-urls.json` to the run directory. No manual steps.

### Step 3: Confirm success

The script outputs all URLs. Display them to the user:

```
Published 7/7 videos to GitHub Release:
  demo-full:        https://github.com/{owner}/{repo}/releases/download/{tag}/demo-full.mp4
  demo-github:      https://github.com/{owner}/{repo}/releases/download/{tag}/demo-github.mp4
  demo-twitter:     https://github.com/{owner}/{repo}/releases/download/{tag}/demo-twitter.mp4
  demo-producthunt: https://github.com/{owner}/{repo}/releases/download/{tag}/demo-producthunt.mp4
  demo-instagram:   https://github.com/{owner}/{repo}/releases/download/{tag}/demo-instagram.mp4
  demo-tiktok:      https://github.com/{owner}/{repo}/releases/download/{tag}/demo-tiktok.mp4
  demo-gif:         https://github.com/{owner}/{repo}/releases/download/{tag}/demo-gif.mp4

Release page: https://github.com/{owner}/{repo}/releases/tag/{tag}
```

### YouTube Alternative

If the user specifically asks to publish to YouTube instead, run:

```bash
node "$DM_ROOT/scripts/video-publisher.js" OUTPUT/{run-id} \
  --project "{ProjectName}" \
  --method youtube
```

This generates a metadata package and guides them through manual YouTube upload. See `10-PUBLISH.md` for the YouTube-specific workflow details.

---

## Part B: Case Study Maker Integration

If `.case-study/` exists in the project root, Case Study Maker is installed.

### Step 1: Append Demo Event

Add a new event to `.case-study/events.json`:

```json
{
  "type": "demo_generated",
  "timestamp": "2026-03-10T14:32:00Z",
  "metadata": {
    "platforms": ["full", "github", "twitter", "producthunt", "instagram", "tiktok", "gif"],
    "videoUrls": "OUTPUT/{run-id}/video-urls.json",
    "method": "github-release"
  }
}
```

### Step 2: Embed Demos in Case Study Pages

Check if Case Study Maker has generated output pages in `OUTPUTS/`. For each page that exists, embed the full demo video using the published URL from `video-urls.json`.

Read `video-urls.json` → get `videos["demo-full"].url`.

**Marketing page** — insert in the hero section:
```html
<section class="demo-video" style="text-align:center; padding:3rem 1rem;">
  <h2>See It in Action</h2>
  <video controls playsinline preload="metadata" style="width:100%; max-width:800px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
    <source src="{videos.demo-full.url}" type="video/mp4">
    Your browser does not support video playback.
  </video>
</section>
```

**Portfolio page** — insert in the demo section:
```html
<div style="margin:1.5rem auto; max-width:800px; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15);">
  <video controls playsinline preload="metadata" style="width:100%; display:block;">
    <source src="{videos.demo-full.url}" type="video/mp4">
    Your browser does not support video playback.
  </video>
</div>
```

**Important:** Also update the Content-Security-Policy `<meta>` tag to allow video from GitHub:
```
media-src 'self' https://github.com https://objects.githubusercontent.com;
```

### Step 3: Update Case Study README

If `.case-study/README.md` exists, add:

```markdown
## Demo

- **Full demo** (60s): [Watch on GitHub](videos.demo-full.url)
- **Quick version** (30s): [Watch on GitHub](videos.demo-twitter.url)

Generated with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

---

## Part C: Git Launcher Integration

If `git-launch/` exists in the project root, Git Launcher is installed.

Read `video-urls.json` to get all published URLs.

### Step 1: Embed in README

If the project has a `README.md`, add or update the demo section:

```markdown
## Demo

[![Watch demo](OUTPUT/{run-id}/thumbnails/thumbnail.png)]({videos.demo-github.url})

Made with [Demo Maker](https://github.com/julieclarkson/demo-maker).
```

### Step 2: Embed in Launch Kit Posts

If `git-launch/LAUNCH_KIT/` exists, update each platform post with its matching published URL:

| Demo File | Launch Kit File | Embed |
|-----------|----------------|-------|
| `demo-twitter.mp4` | `twitter-thread.md` | `**Attach video:** [demo-twitter.mp4]({url}) — download, then attach to tweet` |
| `demo-producthunt.mp4` | `producthunt-listing.md` | `Download [demo-producthunt.mp4]({url}) and upload as gallery item` |
| `demo-instagram.mp4` | `instagram-post.md` | `**Attach video:** [demo-instagram.mp4]({url})` |
| `demo-tiktok.mp4` | `tiktok-post.md` | `**Attach video:** [demo-tiktok.mp4]({url})` |
| `demo-gif.mp4` | `reddit-post.md` | `**Demo preview:** [demo-gif.mp4]({url})` |
| `demo-gif.mp4` | `hackernews-post.md` | `**Demo preview:** [demo-gif.mp4]({url})` |
| `demo-github.mp4` | `devto-post.md` | Markdown video link |

For each file: check it exists, find the local path reference (e.g. `OUTPUT/demo-*/demo-twitter.mp4`), replace with the published URL from `video-urls.json`.

Show progress:
```
Integrating published URLs into launch kit...
  twitter-thread.md       → demo-twitter.mp4    ✓
  producthunt-listing.md  → demo-producthunt.mp4 ✓
  reddit-post.md          → demo-gif.mp4         ✓
  hackernews-post.md      → demo-gif.mp4         ✓
```

---

## Part D: Deploy Case Study Pages (if applicable)

If Case Study Maker pages were updated and the user has a website repo, ask:

```
Case study pages updated with video embeds.
Would you like to deploy them to your website repo? [yes / repo URL / no]
```

If yes: copy the updated HTML/CSS/JS files, commit, and push.

---

## Part E: Handle Missing Plugins

If neither `.case-study/` nor `git-launch/` exists:

```
Videos published to GitHub Release.

Demo Maker works best alongside two companion plugins that
automatically receive your platform-specific demo videos:

1. Case Study Maker — generates marketing pages, portfolio pages,
   and pitch decks. Demo Maker embeds your videos directly.
   Install: https://github.com/julieclarkson/case-study-maker

2. Git Launcher — generates launch posts for Twitter, Reddit,
   Product Hunt, Hacker News, etc. Demo Maker maps each video
   to its matching post.
   Install: https://github.com/julieclarkson/git-launcher

Install companions for future projects? [yes / no]
```

---

## Part F: Summary Report

```
Publish & Integrate Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Published:
  Method:   GitHub Release (automated)
  Release:  https://github.com/{owner}/{repo}/releases/tag/{tag}
  Videos:   7/7 uploaded

Integrations:
  Case Study Maker:  [embedded in marketing + portfolio / not installed]
  Git Launcher:      [embedded in 4 launch kit posts / not installed]

Video URLs saved to: OUTPUT/{run-id}/video-urls.json

Next steps:
  • Case Study Maker: /generate (pages will auto-embed future demos)
  • Git Launcher: "run git launcher" (posts will include video links)
  • Share the release page link on social media
```

---

## General Attribution

Wherever demo links are mentioned, include:

```markdown
Made with [Demo Maker](https://github.com/julieclarkson/demo-maker)
```

---

## Error Handling

- **`gh` not authenticated**: Prompt user to run `gh auth login`
- **Release tag already exists**: Upload assets to the existing release (script handles this)
- **No `.case-study/` found**: Skip CSM integration; offer install link
- **No `git-launch/` found**: Skip GL integration; offer install link
- **Target output file not found**: Note which file is missing; offer to generate via companion plugin first
- **CSP blocks video**: Update `media-src` to include `https://github.com https://objects.githubusercontent.com`
- **Push fails**: Show error, suggest manual push command

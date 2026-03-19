/**
 * youtube-uploader.js — Prepare YouTube uploads and collect URLs.
 *
 * Generates a complete upload package for each demo video:
 *   - Thumbnail (auto-generated from first frame, replaceable)
 *   - Title, description, tags
 *   - Audience, language, visibility settings
 *   - Subtitles text (from narration scripts)
 *   - End screen and cards guidance
 *   - Copyright declaration
 *
 * Opens YouTube Studio in your own browser. You upload manually.
 * After uploading, paste your channel URL and the script matches
 * the videos automatically.
 *
 * No API keys. No browser automation. No passwords shared with AI.
 *
 * Usage:
 *   node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy public|unlisted|private]
 *
 * Outputs:
 *   <demo-run-dir>/youtube-upload/      — per-video folders with metadata + thumbnails
 *   <demo-run-dir>/youtube-urls.json    — collected YouTube URLs
 */

const { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, symlinkSync, readdirSync } = require('fs');
const { join, basename, resolve } = require('path');
const { createInterface } = require('readline');
const { exec, execSync } = require('child_process');
const https = require('https');

const VIDEO_CONFIGS = {
  'demo-full.mp4':        { suffix: 'Full Product Demo',    key: 'demo-full',        scriptFile: 'script-full.md',        order: 1 },
  'demo-github.mp4':      { suffix: 'GitHub Demo',          key: 'demo-github',      scriptFile: 'script-github.md',      order: 2 },
  'demo-twitter.mp4':     { suffix: '30s Demo',             key: 'demo-twitter',     scriptFile: 'script-twitter.md',     order: 3 },
  'demo-producthunt.mp4': { suffix: 'Product Hunt Demo',    key: 'demo-producthunt', scriptFile: 'script-producthunt.md', order: 4 },
  'demo-instagram.mp4':   { suffix: 'Demo (Vertical)',      key: 'demo-instagram',   scriptFile: 'script-instagram.md',   order: 5 },
  'demo-tiktok.mp4':      { suffix: 'Demo (Short)',         key: 'demo-tiktok',      scriptFile: 'script-tiktok.md',      order: 6 },
  'demo-gif.mp4':         { suffix: 'Quick Preview',        key: 'demo-gif',         scriptFile: 'script-gif.md',         order: 7 },
};

function ask(prompt) {
  return new Promise(resolve => {
    const r = createInterface({ input: process.stdin, output: process.stdout });
    r.question(prompt, answer => { r.close(); resolve(answer.trim()); });
  });
}

function askMultiline(prompt) {
  return new Promise(resolve => {
    const r = createInterface({ input: process.stdin, output: process.stdout });
    console.log(prompt);
    const lines = [];
    r.on('line', line => {
      if (line.trim() === '') {
        r.close();
        resolve(lines);
      } else {
        lines.push(line.trim());
      }
    });
  });
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

function openFolder(path) {
  const cmd = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'explorer' : 'xdg-open';
  exec(`${cmd} "${path}"`);
}

function copyToClipboard(text) {
  try {
    execSync('pbcopy', { input: text });
    return true;
  } catch {
    return false;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { privacy: 'public', project: null, runDir: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) {
      opts.project = args[++i];
    } else if (args[i] === '--privacy' && args[i + 1]) {
      opts.privacy = args[++i];
    } else if (!args[i].startsWith('--')) {
      opts.runDir = args[i];
    }
  }

  return opts;
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(join(dir, '.demo-maker'))) return dir;
    dir = join(dir, '..');
  }
  return process.cwd();
}

function loadProjectInfo(runDir) {
  const scriptsUsed = join(runDir, 'scripts-used');
  let description = '';
  let tags = ['demo', 'product demo', 'developer tools'];

  if (existsSync(scriptsUsed)) {
    const scriptFile = ['script-full.md', 'script-github.md'].find(f =>
      existsSync(join(scriptsUsed, f))
    );
    if (scriptFile) {
      const content = readFileSync(join(scriptsUsed, scriptFile), 'utf-8');
      const narration = extractNarration(content);
      description = narration.slice(0, 4900);
    }
  }

  const projectRoot = findProjectRoot();
  const configPath = join(projectRoot, '.demo-maker', 'config.json');
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.projectName) tags.unshift(config.projectName);
      if (config.language) tags.push(config.language);
      if (config.framework) tags.push(config.framework);
    } catch {}
  }

  return { description, tags };
}

function extractNarration(scriptContent) {
  const lines = scriptContent.split('\n');
  const narration = [];
  for (const line of lines) {
    const match = line.match(/^>\s*(.+)/);
    if (match) narration.push(match[1].trim());
  }
  return narration.join(' ');
}

function generateThumbnail(videoPath, outputPath) {
  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -ss 00:00:02 -vframes 1 -q:v 2 "${outputPath}" 2>/dev/null`,
      { timeout: 15000 }
    );
    return existsSync(outputPath);
  } catch {
    try {
      execSync(
        `ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" 2>/dev/null`,
        { timeout: 15000 }
      );
      return existsSync(outputPath);
    } catch {
      return false;
    }
  }
}

function generateSubtitlesText(scriptPath) {
  if (!existsSync(scriptPath)) return null;
  const content = readFileSync(scriptPath, 'utf-8');
  const lines = content.split('\n');
  const narration = [];

  for (const line of lines) {
    const match = line.match(/^>\s*(.+)/);
    if (match) narration.push(match[1].trim());
  }

  if (narration.length === 0) return null;
  return narration.join('\n\n');
}

function fetchOEmbed(url) {
  return new Promise((resolve, reject) => {
    const reqUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    https.get(reqUrl, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid response')); }
      });
    }).on('error', reject);
  });
}

function extractVideoId(url) {
  const match = url.match(/watch\?v=([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)|shorts\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1] || match[2] || match[3];
  if (url.match(/^[a-zA-Z0-9_-]{11}$/)) return url;
  return null;
}

async function main() {
  const opts = parseArgs();

  if (!opts.runDir) {
    console.error('Usage: node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy public|unlisted|private]');
    process.exit(1);
  }

  const runDir = resolve(opts.runDir);
  if (!existsSync(runDir)) {
    console.error(`Error: Demo run directory not found: ${runDir}`);
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  const projectName = opts.project || basename(projectRoot);
  const { description: baseDescription, tags } = loadProjectInfo(runDir);
  const scriptsUsed = join(runDir, 'scripts-used');

  const repoUrl = `https://github.com/julieclarkson/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  const description = baseDescription
    ? `${baseDescription}\n\n${repoUrl}\n\nMade with Demo Maker — https://github.com/julieclarkson/demo-maker`
    : `Product demo for ${projectName}.\n\n${repoUrl}\n\nMade with Demo Maker — https://github.com/julieclarkson/demo-maker`;

  const tagString = tags.slice(0, 20).join(', ');

  const videosToUpload = Object.entries(VIDEO_CONFIGS)
    .filter(([file]) => existsSync(join(runDir, file)))
    .map(([file, config]) => ({
      file,
      path: join(runDir, file),
      size: statSync(join(runDir, file)).size,
      title: `${projectName} - ${config.suffix}`,
      key: config.key,
      order: config.order,
      scriptFile: config.scriptFile,
    }))
    .sort((a, b) => a.order - b.order);

  if (videosToUpload.length === 0) {
    console.error('Error: No demo videos found in', runDir);
    process.exit(1);
  }

  // ── Phase 1: Generate upload package ──────────────────────────

  console.log('');
  console.log('='.repeat(54));
  console.log('  YouTube Publisher — ' + projectName);
  console.log('='.repeat(54));
  console.log('');
  console.log('  Phase 1: Preparing upload package...');
  console.log('');

  const uploadDir = join(runDir, 'youtube-upload');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  let masterMetadata = '';
  masterMetadata += `YOUTUBE UPLOAD GUIDE — ${projectName}\n`;
  masterMetadata += `${'='.repeat(54)}\n\n`;
  masterMetadata += `Upload each numbered folder below. Every folder contains:\n`;
  masterMetadata += `  - The video file (drag into YouTube)\n`;
  masterMetadata += `  - thumbnail.jpg (upload as custom thumbnail)\n`;
  masterMetadata += `  - metadata.txt (copy-paste each field)\n`;
  masterMetadata += `  - subtitles.txt (paste into subtitles if available)\n\n`;
  masterMetadata += `${'─'.repeat(54)}\n\n`;

  for (const video of videosToUpload) {
    const num = String(video.order).padStart(2, '0');
    const folderName = `${num}-${video.key}`;
    const videoDir = join(uploadDir, folderName);
    if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });

    // Symlink video file
    const linkPath = join(videoDir, video.file);
    if (!existsSync(linkPath)) {
      try { symlinkSync(video.path, linkPath); } catch {}
    }

    // Generate thumbnail
    const thumbPath = join(videoDir, 'thumbnail.jpg');
    const thumbOk = generateThumbnail(video.path, thumbPath);
    console.log(`  ${folderName}/`);
    console.log(`    Video:     ${video.file} (${(video.size / 1_000_000).toFixed(1)} MB)`);
    console.log(`    Thumbnail: ${thumbOk ? 'generated' : 'FAILED — upload manually'}`);

    // Generate subtitles text
    const scriptPath = join(scriptsUsed, video.scriptFile);
    const subtitles = generateSubtitlesText(scriptPath);
    if (subtitles) {
      writeFileSync(join(videoDir, 'subtitles.txt'), subtitles);
      console.log(`    Subtitles: generated from narration script`);
    }

    // Per-video metadata file
    let meta = '';
    meta += `YOUTUBE METADATA — ${video.title}\n`;
    meta += `${'─'.repeat(54)}\n\n`;
    meta += `TITLE:\n${video.title}\n\n`;
    meta += `DESCRIPTION:\n${description}\n\n`;
    meta += `THUMBNAIL:\n→ Upload thumbnail.jpg from this folder\n→ To use your own: replace thumbnail.jpg before uploading\n\n`;
    meta += `AUDIENCE:\n→ Select: "No, it's not made for kids"\n\n`;
    meta += `LANGUAGE:\n→ English\n\n`;
    meta += `SUBTITLES:\n→ If subtitles.txt exists in this folder, add it:\n  YouTube Studio → Subtitles → Add → Upload file → "Without timing"\n  → Select subtitles.txt\n\n`;
    meta += `TAGS:\n${tagString}\n\n`;
    meta += `END SCREEN:\n→ After publishing, go to video → Editor → End screen\n→ Add "Best for viewer" video element\n→ Add "Subscribe" button\n→ Position in last 20 seconds\n\n`;
    meta += `CARDS:\n→ After publishing, go to video → Editor → Cards\n→ Add card linking to: ${repoUrl}\n→ Place at the midpoint of the video\n\n`;
    meta += `COPYRIGHT:\n→ None required — this is original content\n→ If prompted: "This is my original content"\n\n`;
    meta += `VISIBILITY:\n→ ${opts.privacy.charAt(0).toUpperCase() + opts.privacy.slice(1)}\n`;

    writeFileSync(join(videoDir, 'metadata.txt'), meta);

    // Add to master file
    masterMetadata += `${folderName}/\n`;
    masterMetadata += `${'─'.repeat(54)}\n`;
    masterMetadata += `Title:       ${video.title}\n`;
    masterMetadata += `File:        ${video.file} (${(video.size / 1_000_000).toFixed(1)} MB)\n`;
    masterMetadata += `Thumbnail:   thumbnail.jpg ${thumbOk ? '(auto-generated — replace with your own if desired)' : '(FAILED — create manually)'}\n`;
    masterMetadata += `Audience:    Not made for kids\n`;
    masterMetadata += `Language:    English\n`;
    masterMetadata += `Subtitles:   ${subtitles ? 'subtitles.txt (from narration script)' : 'None'}\n`;
    masterMetadata += `Tags:        ${tagString}\n`;
    masterMetadata += `End Screen:  Add "Best for viewer" + Subscribe in last 20s\n`;
    masterMetadata += `Cards:       Link to ${repoUrl}\n`;
    masterMetadata += `Copyright:   Original content\n`;
    masterMetadata += `Visibility:  ${opts.privacy.charAt(0).toUpperCase() + opts.privacy.slice(1)}\n`;
    masterMetadata += `\nDescription:\n${description}\n`;
    masterMetadata += `\n${'─'.repeat(54)}\n\n`;

    console.log('');
  }

  writeFileSync(join(uploadDir, 'UPLOAD-GUIDE.txt'), masterMetadata);

  console.log(`  Upload package ready: ${uploadDir}`);
  console.log('');

  // ── Phase 2: Upload ───────────────────────────────────────────

  console.log('='.repeat(54));
  console.log('  Phase 2: Upload to YouTube');
  console.log('='.repeat(54));
  console.log('');

  openFolder(uploadDir);
  openUrl('https://studio.youtube.com');

  console.log('  Opened the upload folder and YouTube Studio.');
  console.log('');
  console.log('  For each numbered folder:');
  console.log('    1. In YouTube Studio: click CREATE → Upload videos');
  console.log('    2. Drag the .mp4 file from the folder');
  console.log('    3. Open metadata.txt — copy-paste each field');
  console.log('    4. Upload thumbnail.jpg as custom thumbnail');
  console.log('    5. Set audience, language, visibility');
  console.log('    6. Click PUBLISH');
  console.log('    7. Repeat for the next folder');
  console.log('');

  await ask('  Press ENTER when all videos are uploaded...');

  // ── Phase 3: Collect URLs ─────────────────────────────────────

  console.log('');
  console.log('='.repeat(54));
  console.log('  Phase 3: Collect YouTube URLs');
  console.log('='.repeat(54));
  console.log('');
  console.log('  In YouTube Studio, go to Content (left sidebar).');
  console.log('  Your new videos should be at the top.');
  console.log('');
  console.log('  For each video: click the three dots (options) →');
  console.log('  "Get shareable link" → paste below.');
  console.log('');
  console.log('  Paste all YouTube URLs below, one per line.');
  console.log('  Press ENTER on a blank line when done:');
  console.log('');

  const urls = await askMultiline('');

  // Match URLs to videos by fetching titles via oEmbed
  const results = {
    publishedAt: new Date().toISOString(),
    project: projectName,
    privacy: opts.privacy,
    videos: {},
  };

  const unmatched = [];

  for (const url of urls) {
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.log(`  Could not parse: ${url}`);
      unmatched.push(url);
      continue;
    }

    const fullUrl = `https://youtube.com/watch?v=${videoId}`;

    // Try oEmbed to get the title
    let matchedKey = null;
    try {
      const oembed = await fetchOEmbed(fullUrl);
      const title = oembed.title || '';

      for (const video of videosToUpload) {
        if (title === video.title || title.includes(video.title) || video.title.includes(title)) {
          matchedKey = video.key;
          break;
        }
      }

      if (!matchedKey) {
        // Fuzzy match: check if any suffix appears
        for (const video of videosToUpload) {
          const suffix = VIDEO_CONFIGS[video.file].suffix;
          if (title.includes(suffix)) {
            matchedKey = video.key;
            break;
          }
        }
      }

      if (matchedKey) {
        console.log(`  Matched "${title}" → ${matchedKey}`);
      } else {
        console.log(`  Could not auto-match "${title}"`);
      }
    } catch {
      console.log(`  Could not fetch title for ${fullUrl}`);
    }

    if (!matchedKey) {
      // Manual match
      console.log('');
      console.log('  Which video is this? Enter the number:');
      const remaining = videosToUpload.filter(v => !results.videos[v.key]);
      for (let i = 0; i < remaining.length; i++) {
        console.log(`    ${i + 1}. ${remaining[i].title}`);
      }
      const choice = await ask('  Number: ');
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < remaining.length) {
        matchedKey = remaining[idx].key;
      }
    }

    if (matchedKey) {
      results.videos[matchedKey] = {
        youtubeId: videoId,
        url: `https://youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        title: videosToUpload.find(v => v.key === matchedKey)?.title || '',
      };
    } else {
      unmatched.push(url);
    }
  }

  // Save results
  const outputPath = join(runDir, 'youtube-urls.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  const matchedCount = Object.keys(results.videos).length;

  console.log('');
  console.log('='.repeat(54));
  console.log(`  Done! ${matchedCount}/${videosToUpload.length} videos matched`);
  console.log('='.repeat(54));
  console.log('');

  if (unmatched.length > 0) {
    console.log(`  ${unmatched.length} URL(s) could not be matched.`);
    console.log('  You can edit youtube-urls.json manually to add them.');
    console.log('');
  }

  console.log(`  URLs saved to: ${outputPath}`);
  console.log('');

  if (matchedCount > 0) {
    console.log('  YouTube URLs:');
    for (const [key, data] of Object.entries(results.videos)) {
      console.log(`    ${key}: ${data.url}`);
    }
    console.log('');
    console.log('  Companion plugins will auto-embed these URLs:');
    console.log('    Case Study Maker → /generate');
    console.log('    Git Launcher     → /git-launch');
    console.log('');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

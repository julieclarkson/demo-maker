/**
 * video-publisher.js — Publish demo videos and get embeddable URLs.
 *
 * Default method: GitHub Release (fully automated via gh CLI).
 *   - Creates a release on the project's GitHub repo
 *   - Uploads all demo videos as release assets
 *   - Saves the download URLs to video-urls.json
 *   - No manual steps, no dragging, no pasting
 *
 * Alternative: YouTube (manual upload with metadata generation).
 *   - Use --method youtube to generate a metadata package
 *   - You upload manually in your own browser
 *
 * Usage:
 *   node video-publisher.js <demo-run-dir> [--project <name>] [--repo <owner/repo>] [--method github|youtube]
 *
 * Outputs: <demo-run-dir>/video-urls.json
 */

const { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, symlinkSync } = require('fs');
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
  } catch { return false; }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { method: 'github', project: null, repo: null, runDir: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) {
      opts.project = args[++i];
    } else if (args[i] === '--repo' && args[i + 1]) {
      opts.repo = args[++i];
    } else if (args[i] === '--method' && args[i + 1]) {
      opts.method = args[++i];
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

function detectRepo() {
  try {
    const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {}
  return null;
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
    execSync(`ffmpeg -y -i "${videoPath}" -ss 00:00:02 -vframes 1 -q:v 2 "${outputPath}" 2>/dev/null`, { timeout: 15000 });
    return existsSync(outputPath);
  } catch {
    try {
      execSync(`ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" 2>/dev/null`, { timeout: 15000 });
      return existsSync(outputPath);
    } catch { return false; }
  }
}

function generateSubtitlesText(scriptPath) {
  if (!existsSync(scriptPath)) return null;
  const content = readFileSync(scriptPath, 'utf-8');
  const narration = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^>\s*(.+)/);
    if (match) narration.push(match[1].trim());
  }
  return narration.length > 0 ? narration.join('\n\n') : null;
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

// ═══════════════════════════════════════════════════════════════
//  GitHub Release Method (default — fully automated)
// ═══════════════════════════════════════════════════════════════

async function publishGitHub(opts, runDir, videosToUpload, projectName) {
  let repo = opts.repo || detectRepo();

  if (!repo) {
    repo = await ask('  GitHub repo (owner/name): ');
    if (!repo) { console.error('  No repo specified. Aborting.'); process.exit(1); }
  }

  // Verify gh CLI
  try {
    execSync('gh auth status 2>&1', { encoding: 'utf-8' });
  } catch {
    console.error('  Error: gh CLI not authenticated. Run: gh auth login');
    process.exit(1);
  }

  const timestamp = basename(runDir).replace('demo-', '');
  const tag = `demo-${timestamp}`;
  const releaseName = `${projectName} — Demo Videos`;

  let releaseBody = `Demo videos for ${projectName}, generated by [Demo Maker](https://github.com/julieclarkson/demo-maker).\n\n`;
  releaseBody += `| Video | Description |\n|---|---|\n`;
  for (const v of videosToUpload) {
    releaseBody += `| ${v.file} | ${projectName} - ${VIDEO_CONFIGS[v.file].suffix} |\n`;
  }

  console.log(`  Repo:    ${repo}`);
  console.log(`  Tag:     ${tag}`);
  console.log(`  Release: ${releaseName}`);
  console.log('');
  console.log('  Uploading videos to GitHub Release...');
  console.log('');

  // Build the asset list
  const assetArgs = videosToUpload.map(v => `"${v.path}"`).join(' ');

  try {
    const cmd = `gh release create "${tag}" ${assetArgs} --repo "${repo}" --title "${releaseName}" --notes "${releaseBody.replace(/"/g, '\\"')}" --latest=false`;
    execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 300000 });
  } catch (err) {
    // Release tag might already exist
    if (err.stderr && err.stderr.includes('already exists')) {
      console.log(`  Release ${tag} already exists. Uploading assets to it...`);
      for (const v of videosToUpload) {
        try {
          execSync(`gh release upload "${tag}" "${v.path}" --repo "${repo}" --clobber`, { encoding: 'utf-8', stdio: 'pipe', timeout: 120000 });
        } catch (uploadErr) {
          console.error(`  Failed to upload ${v.file}: ${uploadErr.message}`);
        }
      }
    } else {
      throw err;
    }
  }

  // Fetch the release to get asset URLs
  console.log('  Fetching download URLs...');
  const releaseJson = execSync(`gh release view "${tag}" --repo "${repo}" --json assets`, { encoding: 'utf-8', timeout: 15000 });
  const release = JSON.parse(releaseJson);

  const results = {
    publishedAt: new Date().toISOString(),
    project: projectName,
    method: 'github-release',
    repo,
    releaseTag: tag,
    releaseUrl: `https://github.com/${repo}/releases/tag/${tag}`,
    videos: {},
  };

  for (const asset of release.assets) {
    const config = VIDEO_CONFIGS[asset.name];
    if (config) {
      results.videos[config.key] = {
        url: asset.url,
        downloadUrl: asset.url,
        embedUrl: asset.url,
        filename: asset.name,
        title: `${projectName} - ${config.suffix}`,
      };
      console.log(`    ${config.key}: ${asset.url}`);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
//  YouTube Method (manual upload with metadata package)
// ═══════════════════════════════════════════════════════════════

async function publishYouTube(opts, runDir, videosToUpload, projectName) {
  const { description: baseDescription, tags } = loadProjectInfo(runDir);
  const scriptsUsed = join(runDir, 'scripts-used');
  const repoUrl = `https://github.com/julieclarkson/${projectName.toLowerCase().replace(/\s+/g, '-')}`;

  const description = baseDescription
    ? `${baseDescription}\n\n${repoUrl}\n\nMade with Demo Maker — https://github.com/julieclarkson/demo-maker`
    : `Product demo for ${projectName}.\n\n${repoUrl}\n\nMade with Demo Maker — https://github.com/julieclarkson/demo-maker`;

  const tagString = tags.slice(0, 20).join(', ');

  // Generate upload package
  console.log('  Generating upload package...');
  console.log('');

  const uploadDir = join(runDir, 'youtube-upload');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  let guide = `YOUTUBE UPLOAD GUIDE — ${projectName}\n${'='.repeat(54)}\n\n`;

  for (const video of videosToUpload) {
    const num = String(video.order).padStart(2, '0');
    const folderName = `${num}-${video.key}`;
    const videoDir = join(uploadDir, folderName);
    if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });

    const linkPath = join(videoDir, video.file);
    if (!existsSync(linkPath)) {
      try { symlinkSync(video.path, linkPath); } catch {}
    }

    const thumbPath = join(videoDir, 'thumbnail.jpg');
    const thumbOk = generateThumbnail(video.path, thumbPath);

    const scriptPath = join(scriptsUsed, VIDEO_CONFIGS[video.file].scriptFile);
    const subtitles = generateSubtitlesText(scriptPath);
    if (subtitles) writeFileSync(join(videoDir, 'subtitles.txt'), subtitles);

    const title = `${projectName} - ${VIDEO_CONFIGS[video.file].suffix}`;

    let meta = `TITLE:\n${title}\n\nDESCRIPTION:\n${description}\n\n`;
    meta += `THUMBNAIL: thumbnail.jpg (replace with your own if desired)\n`;
    meta += `AUDIENCE: No, it's not made for kids\nLANGUAGE: English\n`;
    meta += `TAGS: ${tagString}\n`;
    meta += `SUBTITLES: ${subtitles ? 'subtitles.txt (upload as "Without timing")' : 'None'}\n`;
    meta += `END SCREEN: Add "Best for viewer" + Subscribe in last 20s\n`;
    meta += `CARDS: Link to ${repoUrl}\nCOPYRIGHT: Original content\nVISIBILITY: Public\n`;
    writeFileSync(join(videoDir, 'metadata.txt'), meta);

    console.log(`    ${folderName}/ — ${thumbOk ? 'thumbnail generated' : 'no thumbnail'}`);
    guide += `${folderName}/\n  Title: ${title}\n  File: ${video.file} (${(video.size / 1_000_000).toFixed(1)} MB)\n\n`;
  }

  writeFileSync(join(uploadDir, 'UPLOAD-GUIDE.txt'), guide);

  console.log('');
  console.log(`  Upload package: ${uploadDir}`);
  console.log('');

  openFolder(uploadDir);
  openUrl('https://studio.youtube.com');

  console.log('  Opened folder and YouTube Studio.');
  console.log('  Upload each video, copy-paste metadata from each folder.');
  console.log('');
  await ask('  Press ENTER when all videos are uploaded...');

  console.log('');
  console.log('  Paste all YouTube URLs below (one per line).');
  console.log('  Press ENTER on a blank line when done:');
  console.log('');

  const urls = await askMultiline('');

  const results = {
    publishedAt: new Date().toISOString(),
    project: projectName,
    method: 'youtube',
    videos: {},
  };

  for (const url of urls) {
    const videoId = extractVideoId(url);
    if (!videoId) { console.log(`  Could not parse: ${url}`); continue; }

    const fullUrl = `https://youtube.com/watch?v=${videoId}`;
    let matchedKey = null;

    try {
      const oembed = await fetchOEmbed(fullUrl);
      const title = oembed.title || '';
      for (const video of videosToUpload) {
        const suffix = VIDEO_CONFIGS[video.file].suffix;
        if (title.includes(suffix) || title.includes(projectName)) {
          if (!results.videos[video.key]) { matchedKey = video.key; break; }
        }
      }
      if (matchedKey) console.log(`  Matched "${title}" → ${matchedKey}`);
    } catch {}

    if (!matchedKey) {
      const remaining = videosToUpload.filter(v => !results.videos[v.key]);
      console.log('  Which video is this URL for?');
      for (let i = 0; i < remaining.length; i++) {
        console.log(`    ${i + 1}. ${remaining[i].file}`);
      }
      const choice = await ask('  Number: ');
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < remaining.length) matchedKey = remaining[idx].key;
    }

    if (matchedKey) {
      results.videos[matchedKey] = {
        youtubeId: videoId,
        url: fullUrl,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        title: `${projectName} - ${VIDEO_CONFIGS[videosToUpload.find(v => v.key === matchedKey).file].suffix}`,
      };
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  const opts = parseArgs();

  if (!opts.runDir) {
    console.error('Usage: node video-publisher.js <demo-run-dir> [--project <name>] [--repo <owner/repo>] [--method github|youtube]');
    console.error('');
    console.error('Methods:');
    console.error('  github   Upload to GitHub Release (default — fully automated)');
    console.error('  youtube  Generate metadata package for manual YouTube upload');
    process.exit(1);
  }

  const runDir = resolve(opts.runDir);
  if (!existsSync(runDir)) {
    console.error(`Error: Demo run directory not found: ${runDir}`);
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  const projectName = opts.project || basename(projectRoot);

  const videosToUpload = Object.entries(VIDEO_CONFIGS)
    .filter(([file]) => existsSync(join(runDir, file)))
    .map(([file, config]) => ({
      file,
      path: join(runDir, file),
      size: statSync(join(runDir, file)).size,
      key: config.key,
      order: config.order,
    }))
    .sort((a, b) => a.order - b.order);

  if (videosToUpload.length === 0) {
    console.error('Error: No demo videos found in', runDir);
    process.exit(1);
  }

  const totalSize = videosToUpload.reduce((sum, v) => sum + v.size, 0);

  console.log('');
  console.log('='.repeat(54));
  console.log(`  Video Publisher — ${projectName}`);
  console.log('='.repeat(54));
  console.log(`  Method:  ${opts.method === 'youtube' ? 'YouTube (manual)' : 'GitHub Release (automated)'}`);
  console.log(`  Videos:  ${videosToUpload.length} (${(totalSize / 1_000_000).toFixed(1)} MB total)`);
  console.log('');

  let results;

  if (opts.method === 'youtube') {
    results = await publishYouTube(opts, runDir, videosToUpload, projectName);
  } else {
    results = await publishGitHub(opts, runDir, videosToUpload, projectName);
  }

  // Save results
  const outputPath = join(runDir, 'video-urls.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Also write youtube-urls.json for backward compatibility
  writeFileSync(join(runDir, 'youtube-urls.json'), JSON.stringify(results, null, 2));

  const count = Object.keys(results.videos).length;

  console.log('');
  console.log('='.repeat(54));
  console.log(`  Published ${count}/${videosToUpload.length} videos`);
  console.log('='.repeat(54));
  console.log('');
  console.log(`  URLs saved to: ${outputPath}`);
  if (results.releaseUrl) {
    console.log(`  Release page:  ${results.releaseUrl}`);
  }
  console.log('');

  if (count > 0) {
    console.log('  Video URLs:');
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

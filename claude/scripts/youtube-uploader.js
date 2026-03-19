/**
 * youtube-uploader.js — Prepare YouTube uploads and collect URLs.
 *
 * Generates optimized metadata (titles, descriptions, tags) for each
 * demo video, opens YouTube Studio in your own browser for manual upload,
 * then prompts you to paste the URLs back.
 *
 * No API keys. No browser automation. No passwords shared with AI.
 * You upload in your own browser — this script handles the tedious
 * metadata and saves the URLs for companion plugins.
 *
 * Usage:
 *   node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy unlisted|public|private]
 *
 * Outputs: <demo-run-dir>/youtube-urls.json
 */

const { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } = require('fs');
const { join, basename, resolve } = require('path');
const { createInterface } = require('readline');
const { exec } = require('child_process');

const VIDEO_CONFIGS = {
  'demo-full.mp4':        { suffix: 'Full Product Demo',    key: 'demo-full',        order: 1 },
  'demo-github.mp4':      { suffix: 'GitHub Demo',          key: 'demo-github',      order: 2 },
  'demo-twitter.mp4':     { suffix: '30s Demo',             key: 'demo-twitter',     order: 3 },
  'demo-producthunt.mp4': { suffix: 'Product Hunt Demo',    key: 'demo-producthunt', order: 4 },
  'demo-instagram.mp4':   { suffix: 'Demo (Vertical)',      key: 'demo-instagram',   order: 5 },
  'demo-tiktok.mp4':      { suffix: 'Demo (Short)',         key: 'demo-tiktok',      order: 6 },
  'demo-gif.mp4':         { suffix: 'Quick Preview',        key: 'demo-gif',         order: 7 },
};

function ask(prompt) {
  return new Promise(resolve => {
    const r = createInterface({ input: process.stdin, output: process.stdout });
    r.question(prompt, answer => { r.close(); resolve(answer.trim()); });
  });
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { privacy: 'unlisted', project: null, runDir: null };

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
      const lines = content.split('\n').filter(l => l.trim()).slice(0, 5);
      description = lines.join(' ').slice(0, 4900);
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

function copyToClipboard(text) {
  const { execSync } = require('child_process');
  try {
    execSync('pbcopy', { input: text });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const opts = parseArgs();

  if (!opts.runDir) {
    console.error('Usage: node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy unlisted|public|private]');
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

  const repoUrl = `https://github.com/julieclarkson/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  const description = baseDescription
    ? `${baseDescription}\n\n${repoUrl}`
    : `Product demo for ${projectName}.\n\n${repoUrl}`;

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
    }))
    .sort((a, b) => a.order - b.order);

  if (videosToUpload.length === 0) {
    console.error('Error: No demo videos found in', runDir);
    process.exit(1);
  }

  // Check for existing youtube-urls.json (partial upload resume)
  const outputPath = join(runDir, 'youtube-urls.json');
  let existingResults = null;
  if (existsSync(outputPath)) {
    try {
      existingResults = JSON.parse(readFileSync(outputPath, 'utf-8'));
      const existingCount = Object.keys(existingResults.videos || {}).length;
      if (existingCount > 0) {
        console.log(`\n  Found ${existingCount} previously uploaded videos in youtube-urls.json`);
        const resume = await ask('  Skip already-uploaded videos? (y/n): ');
        if (resume.toLowerCase() !== 'y') existingResults = null;
      }
    } catch { existingResults = null; }
  }

  console.log('');
  console.log('='.repeat(54));
  console.log('  YouTube Publisher — ' + projectName);
  console.log('='.repeat(54));
  console.log('');
  console.log(`  Videos to upload: ${videosToUpload.length}`);
  console.log(`  Privacy:          ${opts.privacy}`);
  console.log(`  Video folder:     ${runDir}`);
  console.log('');

  // Write metadata file for reference
  const metadataPath = join(runDir, 'youtube-metadata.txt');
  let metadataContent = `YouTube Upload Metadata — ${projectName}\n`;
  metadataContent += `${'='.repeat(50)}\n\n`;
  metadataContent += `Description (same for all videos):\n${description}\n\n`;
  metadataContent += `Tags: ${tagString}\n`;
  metadataContent += `Privacy: ${opts.privacy}\n\n`;
  metadataContent += `${'─'.repeat(50)}\n\n`;

  for (const video of videosToUpload) {
    metadataContent += `File: ${video.file}\n`;
    metadataContent += `Title: ${video.title}\n`;
    metadataContent += `Size: ${(video.size / 1_000_000).toFixed(1)} MB\n\n`;
  }

  writeFileSync(metadataPath, metadataContent);

  // Open YouTube Studio
  console.log('  Opening YouTube Studio in your browser...');
  console.log('');
  openUrl('https://studio.youtube.com');

  console.log('  ┌───────────────────────────────────────────────┐');
  console.log('  │  Upload each video in YOUR browser.           │');
  console.log('  │  For each one, this script will:              │');
  console.log('  │    - Show you the file path                   │');
  console.log('  │    - Copy the title to your clipboard         │');
  console.log('  │    - Copy the description to your clipboard   │');
  console.log('  │    - Tell you the tags to paste               │');
  console.log('  │    - Ask you to paste the YouTube URL back    │');
  console.log('  └───────────────────────────────────────────────┘');
  console.log('');

  const results = {
    publishedAt: new Date().toISOString(),
    project: projectName,
    privacy: opts.privacy,
    videos: existingResults?.videos || {},
  };

  let uploaded = 0;
  let skipped = 0;

  for (let i = 0; i < videosToUpload.length; i++) {
    const video = videosToUpload[i];

    // Skip if already uploaded
    if (existingResults?.videos?.[video.key]) {
      console.log(`  [${i + 1}/${videosToUpload.length}] ${video.file} — already uploaded, skipping`);
      skipped++;
      continue;
    }

    console.log('─'.repeat(54));
    console.log(`  Video ${i + 1} of ${videosToUpload.length}: ${video.file}`);
    console.log(`  Size: ${(video.size / 1_000_000).toFixed(1)} MB`);
    console.log('─'.repeat(54));
    console.log('');
    console.log(`  File to upload:`);
    console.log(`    ${video.path}`);
    console.log('');

    // Copy title
    console.log(`  Title: ${video.title}`);
    copyToClipboard(video.title);
    console.log('    (copied to clipboard)');
    await ask('  Paste the title in YouTube, then press ENTER...');

    // Copy description
    copyToClipboard(description);
    console.log('');
    console.log('  Description copied to clipboard.');
    await ask('  Paste the description in YouTube, then press ENTER...');

    // Tags
    copyToClipboard(tagString);
    console.log('');
    console.log('  Tags copied to clipboard.');
    console.log('  In YouTube: click "Show more" → paste into Tags field.');
    await ask('  Press ENTER when tags are pasted...');

    // Privacy reminder
    console.log('');
    console.log(`  Set visibility to: ${opts.privacy.toUpperCase()}`);
    console.log('  Click through: Next → Next → Next → set visibility → PUBLISH');
    console.log('');

    // Get URL back
    const url = await ask('  Paste the YouTube URL here (or "skip" to skip): ');

    if (url.toLowerCase() === 'skip' || !url) {
      console.log('  Skipped.\n');
      continue;
    }

    // Extract video ID
    let videoId = '';
    const match = url.match(/watch\?v=([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)|shorts\/([a-zA-Z0-9_-]+)/);
    if (match) {
      videoId = match[1] || match[2] || match[3];
    } else if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      videoId = url;
    }

    if (videoId) {
      results.videos[video.key] = {
        youtubeId: videoId,
        url: `https://youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        title: video.title,
      };
      uploaded++;
      console.log(`  Saved: https://youtube.com/watch?v=${videoId}\n`);
    } else {
      results.videos[video.key] = {
        youtubeId: '',
        url: url,
        embedUrl: '',
        title: video.title,
      };
      uploaded++;
      console.log(`  Saved URL (could not extract video ID): ${url}\n`);
    }

    // Save after each video in case user quits mid-way
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
  }

  // Final save
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('');
  console.log('='.repeat(54));
  console.log(`  Done! ${uploaded} uploaded, ${skipped} skipped`);
  console.log('='.repeat(54));
  console.log('');
  console.log(`  URLs saved to: ${outputPath}`);
  console.log(`  Metadata saved to: ${metadataPath}`);
  console.log('');

  if (Object.keys(results.videos).length > 0) {
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

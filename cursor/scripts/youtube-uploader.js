/**
 * youtube-uploader.js — Upload demo videos to YouTube via browser automation.
 *
 * No API keys or Google Cloud setup required. Uses Playwright to automate
 * the standard YouTube Studio upload interface. User just needs to be
 * logged into their YouTube account.
 *
 * Usage:
 *   node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy unlisted|public|private]
 *
 * Example:
 *   node shared/scripts/youtube-uploader.js OUTPUT/demo-20260316-142115 --project "Demo Maker"
 *
 * First run: opens a browser for you to sign into YouTube.
 * Subsequent runs: reuses your saved login session.
 *
 * Outputs: <demo-run-dir>/youtube-urls.json
 */

const { chromium } = require('playwright');
const { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } = require('fs');
const { join, basename, resolve } = require('path');

const YOUTUBE_UPLOAD_URL = 'https://www.youtube.com/upload';
const YOUTUBE_STUDIO_URL = 'https://studio.youtube.com';

const VIDEO_CONFIGS = {
  'demo-full.mp4':        { suffix: 'Full Product Demo',    key: 'demo-full' },
  'demo-github.mp4':      { suffix: 'GitHub Demo',          key: 'demo-github' },
  'demo-twitter.mp4':     { suffix: '30s Demo',             key: 'demo-twitter' },
  'demo-producthunt.mp4': { suffix: 'Product Hunt Demo',    key: 'demo-producthunt' },
  'demo-instagram.mp4':   { suffix: 'Demo (Vertical)',      key: 'demo-instagram' },
  'demo-tiktok.mp4':      { suffix: 'Demo (Short)',         key: 'demo-tiktok' },
  'demo-gif.mp4':         { suffix: 'Quick Preview',        key: 'demo-gif' },
};

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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForLogin(page) {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  Sign into your YouTube account in the       │');
  console.log('  │  browser window that just opened.            │');
  console.log('  │                                              │');
  console.log('  │  Once you\'re signed in, the upload will      │');
  console.log('  │  start automatically.                        │');
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');

  const maxWait = 300_000; // 5 min
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    try {
      await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);

      const avatar = await page.$('button#avatar-btn, img.yt-spec-avatar-shape__avatar');
      if (avatar) {
        console.log('  Signed in to YouTube.');
        return true;
      }
    } catch {}
    await sleep(3000);
  }

  console.error('  Timed out waiting for sign-in.');
  return false;
}

async function isLoggedIn(page) {
  try {
    await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);
    const avatar = await page.$('button#avatar-btn, img.yt-spec-avatar-shape__avatar');
    return !!avatar;
  } catch {
    return false;
  }
}

async function uploadOneVideo(page, context, filePath, title, description, tags, privacy) {
  const fileName = basename(filePath);
  const fileSize = statSync(filePath).size;
  console.log(`  Uploading ${fileName} (${(fileSize / 1_000_000).toFixed(1)} MB)...`);

  await page.goto(YOUTUBE_UPLOAD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);

  // If redirected to studio.youtube.com, look for the upload button there
  if (page.url().includes('studio.youtube.com')) {
    const createBtn = page.locator('#create-icon, [test-id="upload-button"], button:has-text("Create"), #upload-button');
    if (await createBtn.count() > 0) {
      await createBtn.first().click();
      await sleep(1000);
      const uploadItem = page.locator('tp-yt-paper-item:has-text("Upload videos"), #text-item-0');
      if (await uploadItem.count() > 0) {
        await uploadItem.first().click();
        await sleep(2000);
      }
    }
  }

  // Set file via the hidden file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  await sleep(3000);

  // Wait for upload dialog to appear
  await page.waitForSelector('ytcp-uploads-dialog', { timeout: 30000 });
  await sleep(2000);

  // ── Title ──
  // The title textbox is the first #textbox inside the dialog
  const titleBox = page.locator('ytcp-uploads-dialog #textbox').first();
  await titleBox.click({ clickCount: 3 });
  await sleep(300);
  await titleBox.fill(title.slice(0, 100));
  await sleep(500);

  // ── Description ──
  // Description is the second #textbox
  const descBox = page.locator('ytcp-uploads-dialog #textbox').nth(1);
  await descBox.click();
  await sleep(300);
  await descBox.fill(description.slice(0, 5000));
  await sleep(500);

  // ── Not made for kids ──
  const notForKids = page.locator('[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"], #radioLabel:has-text("not made for kids"), tp-yt-paper-radio-button[name="NOT_MADE_FOR_KIDS"]');
  if (await notForKids.count() > 0) {
    await notForKids.first().click();
    await sleep(500);
  }

  // ── Show more / Advanced for tags ──
  const showMore = page.locator('#toggle-button:has-text("Show more"), button:has-text("Show more")');
  if (await showMore.count() > 0) {
    await showMore.first().click();
    await sleep(1000);
  }

  // ── Tags ──
  const tagsInput = page.locator('ytcp-uploads-dialog #tags-container input, ytcp-uploads-dialog [id="tags-container"] #text-input');
  if (await tagsInput.count() > 0) {
    const tagString = tags.slice(0, 20).join(', ');
    await tagsInput.first().click();
    await sleep(300);
    await tagsInput.first().fill(tagString);
    await sleep(500);
  }

  // ── Click NEXT through the steps (Details → Video elements → Checks → Visibility) ──
  for (let step = 0; step < 3; step++) {
    const nextBtn = page.locator('#next-button, ytcp-button#next-button');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await sleep(2000);
    }
  }

  // ── Set visibility ──
  await sleep(1000);
  const privacyMap = {
    'unlisted': 'UNLISTED',
    'public': 'PUBLIC',
    'private': 'PRIVATE',
  };
  const privacyName = privacyMap[privacy] || 'UNLISTED';
  const privacyRadio = page.locator(`tp-yt-paper-radio-button[name="${privacyName}"], #${privacyName.toLowerCase()}-radio-button, [name="${privacyName}"]`);
  if (await privacyRadio.count() > 0) {
    await privacyRadio.first().click();
    await sleep(1000);
  }

  // ── Wait for processing to allow publish ──
  // YouTube needs time to process before the Done button enables
  console.log(`    Waiting for YouTube to process...`);

  const maxProcessWait = 600_000; // 10 min
  const processStart = Date.now();

  while (Date.now() - processStart < maxProcessWait) {
    // Check if there's still an "uploading" status
    const uploading = await page.$('ytcp-video-upload-progress[uploading]');
    if (!uploading) break;
    await sleep(3000);
  }

  // Extra buffer for processing
  await sleep(2000);

  // ── Grab video URL before clicking Done ──
  let videoUrl = '';
  let videoId = '';

  const urlElement = page.locator('a.style-scope.ytcp-video-info, span.video-url-fadeable a');
  if (await urlElement.count() > 0) {
    videoUrl = await urlElement.first().getAttribute('href') || '';
  }

  if (!videoUrl) {
    const urlText = page.locator('.video-url-fadeable');
    if (await urlText.count() > 0) {
      const text = await urlText.first().textContent();
      const match = text.match(/youtu\.be\/([a-zA-Z0-9_-]+)|watch\?v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1] || match[2];
    }
  }

  if (videoUrl && !videoId) {
    const match = videoUrl.match(/watch\?v=([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) videoId = match[1] || match[2];
  }

  // ── Click Done/Publish ──
  const doneBtn = page.locator('#done-button, ytcp-button#done-button');
  if (await doneBtn.count() > 0) {
    await doneBtn.first().click();
    await sleep(3000);
  }

  // Try to get URL from the post-publish dialog if we didn't get it before
  if (!videoId) {
    const postPublishLink = page.locator('a[href*="youtu.be"], a[href*="watch?v="]');
    if (await postPublishLink.count() > 0) {
      videoUrl = await postPublishLink.first().getAttribute('href') || '';
      const match = videoUrl.match(/watch\?v=([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1] || match[2];
    }
  }

  // Close any post-publish dialog
  const closeBtn = page.locator('ytcp-button#close-button, [id="close-button"]');
  if (await closeBtn.count() > 0) {
    await closeBtn.first().click();
    await sleep(1000);
  }

  if (!videoId) {
    // Last resort: check YouTube Studio video list for the most recent upload
    console.log(`    Could not capture URL automatically — check YouTube Studio`);
    return null;
  }

  const result = {
    youtubeId: videoId,
    url: `https://youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    title,
  };

  console.log(`    Published: ${result.url}`);
  return result;
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

  const browserDir = join(projectRoot, '.demo-maker', 'youtube-browser');
  if (!existsSync(browserDir)) mkdirSync(browserDir, { recursive: true });

  const videosToUpload = Object.entries(VIDEO_CONFIGS)
    .filter(([file]) => existsSync(join(runDir, file)))
    .map(([file, config]) => ({
      file,
      path: join(runDir, file),
      title: `${projectName} - ${config.suffix}`,
      key: config.key,
    }));

  if (videosToUpload.length === 0) {
    console.error('Error: No demo videos found in', runDir);
    process.exit(1);
  }

  const repoUrl = `https://github.com/julieclarkson/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  const description = baseDescription
    ? `${baseDescription}\n\n${repoUrl}`
    : `Product demo for ${projectName}.\n\n${repoUrl}`;

  console.log('');
  console.log('='.repeat(50));
  console.log(`  YouTube Publisher — ${projectName}`);
  console.log('='.repeat(50));
  console.log(`  Run directory: ${runDir}`);
  console.log(`  Videos found:  ${videosToUpload.length}`);
  console.log(`  Privacy:       ${opts.privacy}`);

  // Launch persistent browser
  const context = await chromium.launchPersistentContext(browserDir, {
    headless: false,
    channel: 'chromium',
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // Check if already logged in
    const loggedIn = await isLoggedIn(page);
    if (!loggedIn) {
      const signedIn = await waitForLogin(page);
      if (!signedIn) {
        console.error('  Could not confirm YouTube sign-in. Aborting.');
        await context.close();
        process.exit(1);
      }
    } else {
      console.log('  Already signed into YouTube.');
    }

    console.log('');

    const results = {
      publishedAt: new Date().toISOString(),
      project: projectName,
      privacy: opts.privacy,
      videos: {},
    };

    let uploaded = 0;
    let failed = 0;

    for (const video of videosToUpload) {
      try {
        const result = await uploadOneVideo(
          page,
          context,
          video.path,
          video.title,
          description,
          tags,
          opts.privacy
        );

        if (result) {
          results.videos[video.key] = result;
          uploaded++;
        } else {
          failed++;
          console.log(`    Could not capture URL for ${video.file}`);
        }
      } catch (err) {
        failed++;
        console.error(`    Failed: ${video.file} — ${err.message}`);
      }

      // Brief pause between uploads
      await sleep(2000);
    }

    const outputPath = join(runDir, 'youtube-urls.json');
    writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log('');
    console.log('='.repeat(50));
    console.log(`  Published ${uploaded}/${videosToUpload.length} videos`);
    if (failed > 0) console.log(`  ${failed} failed — check YouTube Studio manually`);
    console.log(`  URLs saved to: ${outputPath}`);
    console.log('');

    for (const [key, data] of Object.entries(results.videos)) {
      console.log(`    ${key}: ${data.url}`);
    }

    console.log('');
  } finally {
    await context.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

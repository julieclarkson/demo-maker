/**
 * youtube-uploader.js — Upload demo videos to YouTube with optimized metadata.
 *
 * Usage:
 *   node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy unlisted|public|private]
 *
 * Example:
 *   node shared/scripts/youtube-uploader.js OUTPUT/demo-20260316-142115 --project "Demo Maker"
 *
 * Required env vars in .demo-maker/.env:
 *   YOUTUBE_CLIENT_ID=...
 *   YOUTUBE_CLIENT_SECRET=...
 *
 * On first run, opens a browser for OAuth consent. Stores refresh token
 * in .demo-maker/youtube-token.json for subsequent runs.
 *
 * Outputs: <demo-run-dir>/youtube-urls.json
 */

const { google } = require('googleapis');
const { readFileSync, writeFileSync, existsSync, createReadStream, statSync } = require('fs');
const { join, basename, resolve } = require('path');
const http = require('http');
const { URL } = require('url');
const loadEnv = require('./load-env');

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH_REL = '.demo-maker/youtube-token.json';
const REDIRECT_PORT = 8976;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

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

async function getAuthClient(projectRoot) {
  const env = loadEnv(projectRoot);
  const clientId = env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('\n✗ Missing YouTube credentials in .demo-maker/.env');
    console.error('  Add these lines:');
    console.error('    YOUTUBE_CLIENT_ID=your-client-id');
    console.error('    YOUTUBE_CLIENT_SECRET=your-client-secret');
    console.error('\n  Get credentials: https://console.cloud.google.com/apis/credentials');
    console.error('  Enable: YouTube Data API v3');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const tokenPath = join(projectRoot, TOKEN_PATH_REL);

  if (existsSync(tokenPath)) {
    try {
      const token = JSON.parse(readFileSync(tokenPath, 'utf-8'));
      oauth2.setCredentials(token);

      if (token.expiry_date && token.expiry_date < Date.now() && token.refresh_token) {
        const { credentials } = await oauth2.refreshAccessToken();
        oauth2.setCredentials(credentials);
        writeFileSync(tokenPath, JSON.stringify(credentials, null, 2));
      }

      return oauth2;
    } catch {
      // Token invalid, re-auth below
    }
  }

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n→ Opening browser for YouTube authorization...');
  console.log(`  If it doesn't open, visit: ${authUrl}\n`);

  const { exec } = require('child_process');
  exec(`open "${authUrl}"`);

  const code = await waitForOAuthCode();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  console.log('  ✓ YouTube authorized. Token saved.\n');

  return oauth2;
}

function waitForOAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h2>Authorization denied.</h2><p>You can close this tab.</p>');
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>YouTube authorized!</h2><p>You can close this tab and return to your IDE.</p>');
        server.close();
        resolve(code);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`  Waiting for authorization on port ${REDIRECT_PORT}...`);
    });

    setTimeout(() => {
      server.close();
      reject(new Error('OAuth timeout — no response within 120 seconds'));
    }, 120_000);
  });
}

async function uploadVideo(youtube, filePath, title, description, tags, privacy, categoryId) {
  const fileSize = statSync(filePath).size;
  const fileName = basename(filePath);

  console.log(`  Uploading ${fileName} (${(fileSize / 1_000_000).toFixed(1)} MB)...`);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description: description.slice(0, 5000),
        tags: tags.slice(0, 30),
        categoryId,
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(filePath),
    },
  });

  const videoId = res.data.id;
  return {
    youtubeId: videoId,
    url: `https://youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    title,
  };
}

async function main() {
  const opts = parseArgs();

  if (!opts.runDir) {
    console.error('Usage: node youtube-uploader.js <demo-run-dir> [--project <name>] [--privacy unlisted|public|private]');
    process.exit(1);
  }

  const runDir = resolve(opts.runDir);
  if (!existsSync(runDir)) {
    console.error(`✗ Demo run directory not found: ${runDir}`);
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  const projectName = opts.project || basename(projectRoot);
  const { description: baseDescription, tags } = loadProjectInfo(runDir);

  const videosToUpload = Object.entries(VIDEO_CONFIGS)
    .filter(([file]) => existsSync(join(runDir, file)))
    .map(([file, config]) => ({
      file,
      path: join(runDir, file),
      title: `${projectName} - ${config.suffix}`,
      key: config.key,
    }));

  if (videosToUpload.length === 0) {
    console.error('✗ No demo videos found in', runDir);
    process.exit(1);
  }

  console.log(`\n🎬 YouTube Publisher — ${projectName}`);
  console.log('='.repeat(50));
  console.log(`  Run directory: ${runDir}`);
  console.log(`  Videos found:  ${videosToUpload.length}`);
  console.log(`  Privacy:       ${opts.privacy}`);
  console.log('');

  const auth = await getAuthClient(projectRoot);
  const youtube = google.youtube({ version: 'v3', auth });

  const repoUrl = `https://github.com/julieclarkson/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
  const description = baseDescription
    ? `${baseDescription}\n\n${repoUrl}`
    : `Product demo for ${projectName}.\n\n${repoUrl}`;

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
      const result = await uploadVideo(
        youtube,
        video.path,
        video.title,
        description,
        tags,
        opts.privacy,
        '28' // Science & Technology
      );
      results.videos[video.key] = result;
      uploaded++;
      console.log(`    ✓ ${result.url}`);
    } catch (err) {
      failed++;
      console.error(`    ✗ Failed: ${video.file} — ${err.message}`);
      if (err.errors) {
        err.errors.forEach(e => console.error(`      ${e.reason}: ${e.message}`));
      }
    }
  }

  const outputPath = join(runDir, 'youtube-urls.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`✓ Published ${uploaded}/${videosToUpload.length} videos`);
  if (failed > 0) console.log(`  ⚠ ${failed} failed`);
  console.log(`\n  URLs saved to: ${outputPath}`);
  console.log('\n  YouTube URLs:');

  for (const [key, data] of Object.entries(results.videos)) {
    console.log(`    ${key}: ${data.url}`);
  }

  console.log('');
}

main().catch(err => {
  console.error('✗ Fatal error:', err.message);
  process.exit(1);
});

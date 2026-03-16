#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const detectProject = require('./detect-project');

// Look for .demo-maker/ in the current working directory (project root)
const PROJECT_ROOT = process.argv[2] || process.cwd();
const CONFIG_DIR = path.join(PROJECT_ROOT, '.demo-maker');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Default config skeleton
const DEFAULT_CONFIG = {
  version: '1.0.0',
  narrator: {
    provider: 'elevenlabs', // elevenlabs, openai, or none
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Default: Adam
    voiceRole: 'dev-casual'
  },
  video: {
    resolution: '1920x1080',
    fps: 30,
    bitrate: '5000k'
  },
  output: {
    format: 'mp4',
    includeWatermark: true,
    includeCaptions: true
  },
  elevenlabs: {
    apiKey: null, // User to set
    apiUrl: 'https://api.elevenlabs.io'
  },
  openai: {
    apiKey: null, // Optional fallback
    apiUrl: 'https://api.openai.com/v1'
  }
};

async function checkNodeVersion() {
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0], 10);

    if (major < 18) {
      return {
        ok: false,
        version,
        message: `Node.js ${version} detected, but >= 18 required`
      };
    }

    return {
      ok: true,
      version,
      message: `Node.js ${version} OK`
    };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to check Node.js version: ${err.message}`
    };
  }
}

async function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return {
      ok: true,
      installed: true,
      location: 'system',
      message: 'System FFmpeg detected'
    };
  } catch {
    // Try npm-installed version
    try {
      const ffmpegPath = require.resolve('@ffmpeg-installer/ffmpeg', { paths: [process.cwd()] });
      return {
        ok: true,
        installed: true,
        location: 'npm',
        message: '@ffmpeg-installer/ffmpeg is installed'
      };
    } catch {
      return {
        ok: false,
        installed: false,
        message: 'FFmpeg not found. Install with: ffmpeg (system) or npm install @ffmpeg-installer/ffmpeg',
        instruction: 'install-ffmpeg'
      };
    }
  }
}

async function checkPlaywright() {
  try {
    require('playwright');
    try {
      execSync('npx playwright install chromium --with-deps', { stdio: 'pipe' });
    } catch {
      // Already installed
    }
    return {
      ok: true,
      installed: true,
      message: 'Playwright with Chromium available'
    };
  } catch {
    return {
      ok: false,
      installed: false,
      message: 'Playwright not found. Install with: npm install playwright && npx playwright install chromium',
      instruction: 'install-playwright'
    };
  }
}

async function ensureConfigDir() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    return {
      ok: true,
      path: CONFIG_DIR,
      message: `Config directory ready: ${CONFIG_DIR}`
    };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to create config directory: ${err.message}`
    };
  }
}

async function ensureConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return {
        ok: true,
        created: true,
        path: CONFIG_FILE,
        message: `Config file created: ${CONFIG_FILE}`
      };
    }

    // Validate existing config
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return {
        ok: true,
        created: false,
        path: CONFIG_FILE,
        message: `Config file exists: ${CONFIG_FILE}`
      };
    } catch (err) {
      return {
        ok: false,
        message: `Config file is invalid JSON: ${err.message}`
      };
    }
  } catch (err) {
    return {
      ok: false,
      message: `Failed to ensure config: ${err.message}`
    };
  }
}

async function checkAPIKey() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        ok: false,
        configured: false,
        message: 'Config file not found. Run preflight first.'
      };
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // Check .env file for API keys (preferred, more secure)
    const loadEnv = require('./load-env');
    const env = loadEnv(PROJECT_ROOT);
    const hasElevenLabs = !!(env.ELEVENLABS_API_KEY || config.elevenlabs?.apiKey);
    const hasOpenAI = !!(env.OPENAI_API_KEY || config.openai?.apiKey);

    if (hasElevenLabs) {
      return {
        ok: true,
        configured: true,
        provider: 'elevenlabs',
        message: 'ElevenLabs API key configured'
      };
    }

    if (hasOpenAI) {
      return {
        ok: true,
        configured: true,
        provider: 'openai',
        message: 'OpenAI API key configured (ElevenLabs not available)'
      };
    }

    return {
      ok: true,
      configured: false,
      provider: 'caption-only',
      warning: 'No API key configured. Narration will use caption-only mode. Set ELEVENLABS_API_KEY or OPENAI_API_KEY in ~/.demo-maker/config.json',
      message: 'API keys not configured. Running in caption-only mode.'
    };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to check API keys: ${err.message}`
    };
  }
}

async function detectProjectType() {
  try {
    const projectRoot = process.cwd();
    const result = detectProject(projectRoot);
    return {
      ok: true,
      ...result
    };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to detect project: ${err.message}`
    };
  }
}

async function runPreflight() {
  const startTime = Date.now();
  const warnings = [];
  let allReady = true;

  try {
    // Phase 1: Node.js check
    const nodeCheck = await checkNodeVersion();
    if (!nodeCheck.ok) {
      console.error(`[ERROR] ${nodeCheck.message}`);
      allReady = false;
    }

    // Phase 2: Config directory
    const configDirCheck = await ensureConfigDir();
    if (!configDirCheck.ok) {
      console.error(`[ERROR] ${configDirCheck.message}`);
      allReady = false;
    }

    // Phase 3: Config file
    const configCheck = await ensureConfig();
    if (!configCheck.ok) {
      console.error(`[ERROR] ${configCheck.message}`);
      allReady = false;
    }

    // Phase 4: FFmpeg
    const ffmpegCheck = await checkFFmpeg();
    if (!ffmpegCheck.ok) {
      warnings.push(ffmpegCheck.message);
      allReady = false;
    }

    // Phase 5: Playwright
    const playwrightCheck = await checkPlaywright();
    if (!playwrightCheck.ok) {
      warnings.push(playwrightCheck.message);
      allReady = false;
    }

    // Phase 6: API keys
    const apiCheck = await checkAPIKey();
    if (!apiCheck.configured) {
      warnings.push(apiCheck.message);
    }

    // Phase 7: Project detection
    const projectCheck = await detectProjectType();

    // Output final JSON
    const output = {
      ready: allReady,
      duration_ms: Date.now() - startTime,
      dependencies: {
        node: nodeCheck,
        ffmpeg: ffmpegCheck,
        playwright: playwrightCheck
      },
      config: {
        directory: CONFIG_DIR,
        file: CONFIG_FILE,
        status: configCheck.message
      },
      project: projectCheck.ok ? {
        name: projectCheck.name,
        type: projectCheck.type,
        framework: projectCheck.framework,
        language: projectCheck.language,
        startCommand: projectCheck.startCommand,
        port: projectCheck.port,
        hasCaseStudy: projectCheck.hasCaseStudy,
        hasGitLaunch: projectCheck.hasGitLaunch
      } : null,
      narration: {
        provider: apiCheck.provider,
        configured: apiCheck.configured
      },
      warnings
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(allReady ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({
      ready: false,
      error: err.message,
      stack: process.env.DEBUG ? err.stack : undefined
    }, null, 2));
    process.exit(1);
  }
}

runPreflight();

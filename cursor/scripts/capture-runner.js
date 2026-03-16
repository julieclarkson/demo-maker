#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const VIEWPORT = { width: 1920, height: 1080 };
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'file://'];

/**
 * Validate URL for SSRF prevention
 */
function validateUrl(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    const parsed = new URL(url);
    const isAllowed = ALLOWED_HOSTS.some(host => {
      if (host === 'file://') return parsed.protocol === 'file:';
      return parsed.hostname === host;
    });

    if (!isAllowed) {
      throw new Error(`SSRF prevention: URL ${url} not allowed. Only localhost, 127.0.0.1, and file:// URLs permitted`);
    }

    return true;
  } catch (err) {
    if (err.message.includes('SSRF')) throw err;
    // file:// URLs might not parse with URL API
    if (url.startsWith('file://')) return true;
    throw new Error(`Invalid URL: ${err.message}`);
  }
}

/**
 * Validate selector for injection prevention
 */
function validateSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    throw new Error('Selector must be a non-empty string');
  }

  // Prevent obvious script injection patterns
  if (selector.includes('<') || selector.includes('>') || selector.includes(';')) {
    throw new Error('Selector contains invalid characters');
  }

  return true;
}

/**
 * Execute action on page
 */
async function executeAction(page, action) {
  const { type, selector, text, direction, ms, url } = action;

  switch (type) {
    case 'click':
      validateSelector(selector);
      await page.click(selector, { timeout: 5000 });
      break;

    case 'type':
      validateSelector(selector);
      if (!text) throw new Error('type action requires text');
      await page.fill(selector, '');
      await page.type(selector, text, { delay: 50 });
      break;

    case 'scroll':
      if (!['up', 'down', 'left', 'right'].includes(direction)) {
        throw new Error('scroll direction must be up, down, left, or right');
      }
      const scrollAmount = 300;
      await page.evaluate(async (dir, amount) => {
        if (dir === 'up') window.scrollBy(0, -amount);
        else if (dir === 'down') window.scrollBy(0, amount);
        else if (dir === 'left') window.scrollBy(-amount, 0);
        else if (dir === 'right') window.scrollBy(amount, 0);
      }, direction, scrollAmount);
      break;

    case 'wait':
      if (typeof ms !== 'number' || ms < 0 || ms > 60000) {
        throw new Error('wait duration must be between 0 and 60000ms');
      }
      await page.waitForTimeout(ms);
      break;

    case 'navigate':
      validateUrl(url);
      await page.goto(url, { waitUntil: 'networkidle' });
      break;

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Capture a single scene
 */
async function captureScene(browser, scene, outputDir) {
  const sceneId = scene.id || 'unknown';
  const videoPath = path.join(outputDir, `scene-${sceneId}.webm`);

  try {
    if (!scene.url) {
      throw new Error('Scene must have a url property');
    }

    validateUrl(scene.url);

    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: outputDir }
    });

    const page = await context.newPage();
    let duration = 0;

    try {
      // Navigate to URL
      await page.goto(scene.url, { waitUntil: 'networkidle', timeout: 30000 });

      const startTime = Date.now();

      // Execute actions
      if (Array.isArray(scene.actions)) {
        for (const action of scene.actions) {
          await executeAction(page, action);
        }
      }

      duration = Date.now() - startTime;

      // Keep page open for a bit to capture final state
      await page.waitForTimeout(500);

    } finally {
      await page.close();
    }

    // Get actual video path (Playwright appends timestamp)
    const actualPath = (await context.close()).path;

    if (actualPath && fs.existsSync(actualPath)) {
      fs.renameSync(actualPath, videoPath);
    }

    return {
      sceneId,
      path: videoPath,
      duration_ms: duration,
      success: true
    };
  } catch (err) {
    return {
      sceneId,
      path: null,
      duration_ms: 0,
      success: false,
      error: err.message
    };
  }
}

/**
 * Run capture pipeline
 */
async function runCaptures() {
  const args = parseArgs();

  if (!args.storyboard) {
    console.error(JSON.stringify({
      error: 'Missing required argument: --storyboard <path>'
    }, null, 2));
    process.exit(1);
  }

  const startTime = Date.now();
  const captures = [];
  const errors = [];

  try {
    // Load storyboard
    if (!fs.existsSync(args.storyboard)) {
      throw new Error(`Storyboard not found: ${args.storyboard}`);
    }

    const storyboard = JSON.parse(fs.readFileSync(args.storyboard, 'utf8'));

    if (!Array.isArray(storyboard.scenes)) {
      throw new Error('Storyboard must contain scenes array');
    }

    // Create output directory
    const outputDir = args.outputDir || path.join(process.cwd(), '.demo-maker', 'captures');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch browser
    const browser = await chromium.launch();

    try {
      // Capture each scene with type === 'capture'
      for (const scene of storyboard.scenes) {
        if (scene.visual?.type !== 'capture') {
          continue;
        }

        console.error(`[INFO] Capturing scene: ${scene.id}`);

        const result = await captureScene(browser, scene, outputDir);

        if (result.success) {
          captures.push(result);
        } else {
          errors.push({
            sceneId: result.sceneId,
            message: result.error
          });
        }
      }
    } finally {
      await browser.close();
    }

    // Output results
    console.log(JSON.stringify({
      success: errors.length === 0,
      captures,
      errors,
      duration_ms: Date.now() - startTime
    }, null, 2));

    process.exit(errors.length === 0 ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
      captures: [],
      errors: [],
      stack: process.env.DEBUG ? err.stack : undefined
    }, null, 2));
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        result[key] = value;
        i++;
      } else {
        result[key] = true;
      }
    }
  }

  return result;
}

runCaptures();

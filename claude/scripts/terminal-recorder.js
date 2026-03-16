#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const os = require('os');

const VIEWPORT = { width: 1920, height: 1080 };
const TYPING_DELAY = 50; // milliseconds per character

/**
 * Generate terminal HTML template
 */
function generateTerminalHTML(content = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal Recording</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Menlo, 'Courier New', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
      height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .terminal-header {
      background: #323232;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #2d2d2d;
      user-select: none;
    }

    .terminal-buttons {
      display: flex;
      gap: 8px;
    }

    .terminal-button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .terminal-button.red { background: #ef5753; }
    .terminal-button.yellow { background: #f9a825; }
    .terminal-button.green { background: #61c554; }

    .terminal-title {
      margin-left: 12px;
      font-size: 13px;
      color: #a0a0a0;
      flex: 1;
    }

    .terminal-content {
      flex: 1;
      padding: 16px 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .terminal-line {
      margin: 0;
      color: #d4d4d4;
    }

    .terminal-prompt {
      color: #00d084;
      font-weight: 500;
    }

    .terminal-command {
      color: #d4d4d4;
    }

    .terminal-output {
      color: #d4d4d4;
    }

    .terminal-error {
      color: #ff6b6b;
    }

    .cursor {
      display: inline-block;
      width: 8px;
      height: 1em;
      background: #d4d4d4;
      margin-left: 2px;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    .terminal-content.ready .cursor {
      animation: none;
      opacity: 0;
    }
  </style>
</head>
<body>
  <div class="terminal-header">
    <div class="terminal-buttons">
      <div class="terminal-button red"></div>
      <div class="terminal-button yellow"></div>
      <div class="terminal-button green"></div>
    </div>
    <div class="terminal-title">Terminal</div>
  </div>
  <div class="terminal-content" id="terminal">
    <div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-command" id="command"></span><span class="cursor"></span></div>
  </div>

  <script>
    const terminal = document.getElementById('terminal');
    const commandSpan = document.getElementById('command');
    window._terminalReady = false;

    window._typeCommand = async function(cmd, delayMs = 50) {
      commandSpan.textContent = '';
      for (const char of cmd) {
        commandSpan.textContent += char;
        await new Promise(r => setTimeout(r, delayMs));
      }
    };

    window._addOutput = function(text, isError = false) {
      const cls = isError ? 'terminal-error' : 'terminal-output';
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.innerHTML = '<span class="' + cls + '">' + escapeHtml(text) + '</span>';
      terminal.insertBefore(div, terminal.lastChild);
    };

    window._clearCommand = function() {
      commandSpan.textContent = '';
    };

    window._newPrompt = function() {
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.innerHTML = '<span class="terminal-prompt">$</span> <span class="terminal-command" id="command"></span><span class="cursor"></span>';
      terminal.appendChild(div);
      window._commandElement = div.querySelector('#command');
    };

    window._ready = function() {
      terminal.classList.add('ready');
      window._terminalReady = true;
    };

    function escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }
  </script>
</body>
</html>
  `;
}

/**
 * Execute terminal commands and record
 */
async function recordTerminal(browser, scene, outputDir) {
  const sceneId = scene.id || 'unknown';
  const videoPath = path.join(outputDir, `scene-${sceneId}.webm`);

  try {
    if (!scene.commands || !Array.isArray(scene.commands)) {
      throw new Error('Terminal scene must have commands array');
    }

    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: outputDir }
    });

    const page = await context.newPage();

    try {
      // Load terminal HTML
      const html = generateTerminalHTML();
      await page.setContent(html);

      const startTime = Date.now();

      // Execute commands
      for (const cmd of scene.commands) {
        // Type command
        if (cmd.input) {
          await page.evaluate((text, delay) => {
            return window._typeCommand(text, delay);
          }, cmd.input, TYPING_DELAY);
        }

        // Wait for typing to complete
        await page.waitForTimeout(200);

        // Simulate Enter key
        await page.press('body', 'Enter');
        await page.waitForTimeout(300);

        // Add output
        if (cmd.output) {
          const output = Array.isArray(cmd.output) ? cmd.output.join('\n') : cmd.output;
          await page.evaluate((text) => {
            window._addOutput(text, false);
          }, output);
          await page.waitForTimeout(300);
        }

        // Add error output
        if (cmd.error) {
          const error = Array.isArray(cmd.error) ? cmd.error.join('\n') : cmd.error;
          await page.evaluate((text) => {
            window._addOutput(text, true);
          }, error);
          await page.waitForTimeout(300);
        }

        // Wait between commands
        if (cmd.wait) {
          await page.waitForTimeout(cmd.wait);
        }
      }

      // Mark as ready (remove cursor animation)
      await page.evaluate(() => {
        window._ready();
      });

      // Hold final state
      await page.waitForTimeout(1000);

      const duration = Date.now() - startTime;

      await page.close();
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
      await page.close();
      await context.close();
      throw err;
    }
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
 * Run terminal recording pipeline
 */
async function runRecorder() {
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
      // Record each terminal scene
      for (const scene of storyboard.scenes) {
        if (scene.visual?.type !== 'terminal') {
          continue;
        }

        console.error(`[INFO] Recording terminal scene: ${scene.id}`);

        const result = await recordTerminal(browser, scene, outputDir);

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

runRecorder();

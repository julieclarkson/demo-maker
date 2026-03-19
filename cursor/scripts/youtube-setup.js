#!/usr/bin/env node
/**
 * youtube-setup.js — Sign into YouTube for Demo Maker uploads.
 *
 * Opens a browser window where you sign into your Google/YouTube account.
 * Your login session is saved so you don't need to sign in again.
 *
 * No API keys. No Google Cloud Console. Just sign in.
 *
 * Usage:
 *   node shared/scripts/youtube-setup.js
 */

const { chromium } = require('playwright');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const { createInterface } = require('readline');

function ask(prompt) {
  return new Promise(resolve => {
    const r = createInterface({ input: process.stdin, output: process.stdout });
    r.question(prompt, answer => { r.close(); resolve(answer.trim()); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(join(dir, '.demo-maker')) || existsSync(join(dir, 'shared', 'scripts', 'youtube-setup.js'))) return dir;
    dir = join(dir, '..');
  }
  return process.cwd();
}

async function main() {
  const projectRoot = findProjectRoot();
  const browserDir = join(projectRoot, '.demo-maker', 'youtube-browser');
  if (!existsSync(browserDir)) mkdirSync(browserDir, { recursive: true });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  YouTube Setup — Demo Maker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Opening a browser window. Sign into the Google');
  console.log('  account that owns the YouTube channel you want');
  console.log('  to upload demos to.');
  console.log('');
  console.log('  Your login will be saved so you only do this once.');
  console.log('');

  const context = await chromium.launchPersistentContext(browserDir, {
    headless: false,
    channel: 'chromium',
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  // Check if already logged in
  try {
    await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(3000);

    const avatar = await page.$('button#avatar-btn, img.yt-spec-avatar-shape__avatar');
    if (avatar) {
      console.log('  You\'re already signed into YouTube!');
      console.log('');

      const choice = await ask('  Want to switch accounts? (y/n): ');
      if (choice.toLowerCase() === 'y') {
        await page.goto('https://accounts.google.com/Logout', { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        await page.goto('https://accounts.google.com/signin', { waitUntil: 'domcontentloaded' });
        console.log('');
        console.log('  Sign into your other Google account in the browser.');
        await waitForSignIn(page);
      } else {
        console.log('');
        console.log('  All set! Your session is saved.');
        printDone();
        await context.close();
        return;
      }
    } else {
      // Not logged in — navigate to sign-in
      await page.goto('https://accounts.google.com/signin/v2/identifier?service=youtube', { waitUntil: 'domcontentloaded' });
      console.log('  Sign into your Google account in the browser window.');
      console.log('');
      await waitForSignIn(page);
    }
  } catch (err) {
    await page.goto('https://accounts.google.com/signin/v2/identifier?service=youtube', { waitUntil: 'domcontentloaded' });
    console.log('  Sign into your Google account in the browser window.');
    console.log('');
    await waitForSignIn(page);
  }

  printDone();
  await context.close();
}

async function waitForSignIn(page) {
  const maxWait = 300_000; // 5 min
  const start = Date.now();
  let dotCount = 0;

  while (Date.now() - start < maxWait) {
    try {
      await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);

      const avatar = await page.$('button#avatar-btn, img.yt-spec-avatar-shape__avatar');
      if (avatar) {
        console.log('');
        console.log('  Signed in successfully!');
        return;
      }
    } catch {}

    dotCount++;
    if (dotCount % 5 === 0) {
      process.stdout.write('  Still waiting for sign-in...\n');
    }
    await sleep(5000);
  }

  console.log('');
  console.log('  Timed out. Run this script again to try once more.');
}

function printDone() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  YouTube is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  To upload your demos, run:');
  console.log('    node shared/scripts/youtube-uploader.js OUTPUT/demo-XXXXXXXX-XXXXXX --project "YourProject"');
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

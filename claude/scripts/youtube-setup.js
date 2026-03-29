#!/usr/bin/env node
/**
 * youtube-setup.js — Verify YouTube access for Demo Maker.
 *
 * Opens YouTube Studio in your own browser so you can confirm
 * you're signed in and ready to upload. That's it.
 *
 * Usage:
 *   node shared/scripts/youtube-setup.js
 */

const { execFile } = require('child_process');
const { createInterface } = require('readline');

function ask(prompt) {
  return new Promise(resolve => {
    const r = createInterface({ input: process.stdin, output: process.stdout });
    r.question(prompt, answer => { r.close(); resolve(answer.trim()); });
  });
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url], () => {});
}

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  YouTube Setup — Demo Maker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Opening YouTube Studio in your browser...');
  console.log('');
  console.log('  Make sure you can sign in and see your channel.');
  console.log('  Demo Maker will open this same page when you');
  console.log('  publish demos — you upload manually, the script');
  console.log('  handles all the titles, descriptions, and tags.');
  console.log('');

  openUrl('https://studio.youtube.com');

  const ready = await ask('  Can you see YouTube Studio? (y/n): ');

  if (ready.toLowerCase() === 'y') {
    console.log('');
    console.log('  You\'re all set! To publish demos, run:');
    console.log('    node shared/scripts/youtube-uploader.js OUTPUTS_DEMO_MAKER/demo-XXXXXXXX-XXXXXX --project "YourProject"');
    console.log('');
  } else {
    console.log('');
    console.log('  Make sure you\'re signed into a Google account');
    console.log('  that has a YouTube channel. Go to youtube.com');
    console.log('  and sign in first, then try again.');
    console.log('');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * runway-generator.js — Generate AI video clips using Runway Gen-3 Alpha API.
 *
 * Generates short (5-10 second) creative video clips from text or image prompts.
 * Alternative to Veo 3 for users who prefer Runway's aesthetic.
 *
 * Args:
 *   --prompt "Developer frustrated with screen recording tools"
 *   --duration 10       (seconds, 5 or 10)
 *   --output path/to/output.mp4
 *   --model gen3a_turbo  (gen3a_turbo for faster/cheaper, gen3a for higher quality)
 *   --image path/to/reference.png  (optional: image-to-video mode)
 *
 * Reads RUNWAY_API_KEY from .demo-maker/.env
 *
 * API: https://docs.dev.runwayml.com/
 * Pricing: Gen-3 Alpha Turbo: 5 credits/s, Gen-3 Alpha: 10 credits/s ($0.01/credit)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const loadEnv = require('./load-env');

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt') parsed.prompt = args[++i];
    else if (args[i] === '--duration') parsed.duration = parseInt(args[++i], 10);
    else if (args[i] === '--output') parsed.output = args[++i];
    else if (args[i] === '--model') parsed.model = args[++i];
    else if (args[i] === '--image') parsed.image = args[++i];
    else if (args[i] === '--project-root') parsed.projectRoot = args[++i];
  }
  return parsed;
}

function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode >= 400) {
          reject(new Error(`Runway API ${res.statusCode}: ${body.toString()}`));
          return;
        }
        resolve({ statusCode: res.statusCode, body: body.toString(), headers: res.headers });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, outputPath).then(resolve).catch(reject);
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, data);
        resolve(data.length);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function generateVideo(args) {
  const projectRoot = args.projectRoot || process.cwd();
  const env = loadEnv(projectRoot);
  const apiKey = env.RUNWAY_API_KEY;

  if (!apiKey) {
    console.log(JSON.stringify({
      success: false,
      error: 'No RUNWAY_API_KEY found in .demo-maker/.env',
      hint: 'Add RUNWAY_API_KEY=your-key to .demo-maker/.env. Get one at https://dev.runwayml.com/'
    }));
    process.exit(0);
  }

  const prompt = args.prompt;
  const duration = args.duration === 5 ? 5 : 10; // Runway supports 5 or 10 seconds
  const outputPath = args.output || 'ai-clip.mp4';
  const model = args.model || 'gen3a_turbo';

  if (!prompt) {
    console.log(JSON.stringify({ success: false, error: 'No --prompt provided' }));
    process.exit(1);
  }

  console.error(`Generating Runway ${model} video clip...`);
  console.error(`  Prompt: ${prompt}`);
  console.error(`  Duration: ${duration}s`);
  console.error(`  Model: ${model}`);

  try {
    // Step 1: Create generation task
    const taskPayload = {
      promptText: prompt,
      model: model,
      duration: duration,
      ratio: '1280:768', // 16:9-ish, Runway native
      watermark: false,
    };

    // If image provided, use image-to-video
    if (args.image && fs.existsSync(args.image)) {
      const imageData = fs.readFileSync(args.image);
      const base64Image = imageData.toString('base64');
      const ext = path.extname(args.image).slice(1);
      taskPayload.promptImage = `data:image/${ext};base64,${base64Image}`;
    }

    const createPayload = JSON.stringify(taskPayload);

    const createOptions = {
      hostname: 'api.dev.runwayml.com',
      path: '/v1/image_to_video',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Length': Buffer.byteLength(createPayload),
      }
    };

    const createResponse = await httpsRequest(createOptions, createPayload);
    const task = JSON.parse(createResponse.body);

    if (!task.id) {
      console.log(JSON.stringify({
        success: false,
        error: 'Failed to create generation task',
        response: task,
      }));
      return;
    }

    console.error(`  Task created: ${task.id}`);

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      attempts++;

      const pollOptions = {
        hostname: 'api.dev.runwayml.com',
        path: `/v1/tasks/${task.id}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06',
        }
      };

      const pollResponse = await httpsRequest(pollOptions);
      const pollResult = JSON.parse(pollResponse.body);

      if (pollResult.status === 'SUCCEEDED') {
        const videoUrl = pollResult.output && pollResult.output[0];

        if (videoUrl) {
          console.error(`  Downloading video...`);
          const fileSize = await downloadFile(videoUrl, outputPath);

          console.error(`  ✓ Video saved: ${outputPath} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

          console.log(JSON.stringify({
            success: true,
            provider: 'runway',
            model: model,
            output: outputPath,
            duration_s: duration,
            fileSize: fileSize,
            prompt: prompt,
            taskId: task.id,
          }));
          return;
        }

        console.log(JSON.stringify({
          success: false,
          error: 'Task succeeded but no video URL in output',
          response: pollResult,
        }));
        return;
      }

      if (pollResult.status === 'FAILED') {
        console.log(JSON.stringify({
          success: false,
          error: `Generation failed: ${pollResult.failure || 'Unknown error'}`,
          taskId: task.id,
        }));
        return;
      }

      // THROTTLED, RUNNING, or PENDING
      const elapsed = attempts * 5;
      if (elapsed % 15 === 0) {
        console.error(`  Status: ${pollResult.status} (${elapsed}s elapsed)`);
      }
    }

    console.log(JSON.stringify({
      success: false,
      error: 'Generation timed out after 10 minutes',
      taskId: task.id,
    }));

  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      provider: 'runway',
    }));
  }
}

const args = parseArgs(process.argv.slice(2));
generateVideo(args);

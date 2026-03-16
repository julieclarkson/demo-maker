#!/usr/bin/env node
/**
 * veo3-generator.js — Generate AI video clips using Google Veo 3 API.
 *
 * Args:
 *   --prompt "description"
 *   --duration 8        (seconds, max 8)
 *   --output path/to/output.mp4
 *   --aspect-ratio 16:9
 *   --style cinematic   (cinematic | natural | animated)
 *   --project-root .
 *
 * Reads GOOGLE_API_KEY from .demo-maker/.env
 * API: Gemini API predictLongRunning endpoint (model: veo-3.1-generate-preview)
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
    else if (args[i] === '--aspect-ratio') parsed.aspectRatio = args[++i];
    else if (args[i] === '--style') parsed.style = args[++i];
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
          reject(new Error(`Veo 3 API ${res.statusCode}: ${body.toString().slice(0, 500)}`));
          return;
        }
        resolve({ statusCode: res.statusCode, body, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const STYLE_ENHANCERS = {
  cinematic: 'Cinematic lighting, shallow depth of field, 24fps film grain, professional color grading.',
  natural: 'Natural lighting, documentary style, authentic and unpolished.',
  animated: 'Clean motion graphics, flat design, smooth animations, tech-forward aesthetic.',
};

async function generateVideo(args) {
  const projectRoot = args.projectRoot || process.cwd();
  const env = loadEnv(projectRoot);
  const apiKey = env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'your-key-here') {
    console.log(JSON.stringify({ success: false, error: 'No GOOGLE_API_KEY configured in .demo-maker/.env' }));
    process.exit(0);
  }

  const prompt = args.prompt;
  const duration = Math.min(args.duration || 8, 8);
  const outputPath = args.output || 'ai-clip.mp4';
  const aspectRatio = args.aspectRatio || '16:9';
  const style = args.style || 'cinematic';

  if (!prompt) {
    console.log(JSON.stringify({ success: false, error: 'No --prompt provided' }));
    process.exit(1);
  }

  const enhancedPrompt = `${prompt}. ${STYLE_ENHANCERS[style] || STYLE_ENHANCERS.cinematic}`;

  console.error(`Generating Veo 3 video clip...`);
  console.error(`  Prompt: ${prompt}`);
  console.error(`  Style: ${style}`);
  console.error(`  Duration: ${duration}s`);

  try {
    // Try predictLongRunning endpoint (GA format)
    const payload = JSON.stringify({
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        aspectRatio: aspectRatio,
        durationSeconds: duration,
        sampleCount: 1,
        generateAudio: false,
      }
    });

    // Model candidates: veo-3.1-generate-preview (current), veo-3.0-generate-preview (legacy)
    // Video models only support predictLongRunning, NOT generateContent
    const models = ['veo-3.1-generate-preview', 'veo-3.0-generate-preview'];
    let response, result;
    let lastErr;

    for (const model of models) {
      try {
        console.error(`  Trying model: ${model}`);
        response = await httpsRequest({
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/${model}:predictLongRunning?key=${apiKey}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-goog-api-key': apiKey
          }
        }, payload);
        result = JSON.parse(response.body.toString());
        console.error(`  ✓ Model ${model} accepted the request`);
        break; // success — stop trying models
      } catch (err) {
        console.error(`  Model ${model} failed: ${err.message.slice(0, 120)}`);
        lastErr = err;
        result = null;
      }
    }

    if (!result) {
      throw lastErr || new Error('All Veo model variants failed');
    }

    // Handle immediate inline video response
    if (result.candidates) {
      for (const candidate of result.candidates) {
        if (!candidate.content || !candidate.content.parts) continue;
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('video/')) {
            const videoData = Buffer.from(part.inlineData.data, 'base64');
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, videoData);
            console.error(`  ✓ Video saved: ${outputPath} (${(videoData.length / 1024 / 1024).toFixed(1)}MB)`);
            console.log(JSON.stringify({ success: true, provider: 'veo3', output: outputPath, duration_s: duration, prompt, style }));
            return;
          }
          if (part.fileData && part.fileData.fileUri) {
            return await downloadFromUri(part.fileData.fileUri, outputPath, apiKey, prompt, style, duration);
          }
        }
      }
    }

    // Handle immediate video array response
    if (result.videos && result.videos.length > 0) {
      return await saveVideo(result.videos[0], outputPath, apiKey, prompt, style, duration);
    }

    // Handle long-running operation
    if (result.name) {
      console.error(`  Operation: ${result.name}`);
      console.error(`  Polling for completion...`);

      let attempts = 0;
      const maxAttempts = 120;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;

        try {
          const pollResponse = await httpsRequest({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/${result.name}?key=${apiKey}`,
            method: 'GET',
          });
          const poll = JSON.parse(pollResponse.body.toString());

          if (poll.done) {
            const resp = poll.response || poll.result || poll;
            // Check videos array
            if (resp.videos && resp.videos.length > 0) {
              return await saveVideo(resp.videos[0], outputPath, apiKey, prompt, style, duration);
            }
            // Check generatedSamples
            if (resp.generatedSamples) {
              for (const sample of resp.generatedSamples) {
                if (sample.video) return await saveVideo(sample.video, outputPath, apiKey, prompt, style, duration);
              }
            }
            // Check candidates
            if (resp.candidates) {
              for (const c of resp.candidates) {
                for (const p of (c.content?.parts || [])) {
                  if (p.inlineData?.mimeType?.startsWith('video/')) {
                    const data = Buffer.from(p.inlineData.data, 'base64');
                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                    fs.writeFileSync(outputPath, data);
                    console.error(`  ✓ Saved: ${outputPath}`);
                    console.log(JSON.stringify({ success: true, provider: 'veo3', output: outputPath }));
                    return;
                  }
                  if (p.fileData?.fileUri) return await downloadFromUri(p.fileData.fileUri, outputPath, apiKey, prompt, style, duration);
                }
              }
            }
            console.error(`  ✗ Done but no video in response`);
            console.log(JSON.stringify({ success: false, error: 'No video in completed response', keys: Object.keys(resp) }));
            return;
          }

          if (attempts % 6 === 0) console.error(`  Still generating... (${attempts * 5}s)`);
        } catch (pollErr) {
          if (attempts % 12 === 0) console.error(`  Poll error: ${pollErr.message}`);
        }
      }

      console.log(JSON.stringify({ success: false, error: 'Timed out after 10 minutes' }));
      return;
    }

    console.log(JSON.stringify({ success: false, error: 'Unexpected response', keys: Object.keys(result) }));

  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    console.log(JSON.stringify({ success: false, error: err.message, provider: 'veo3' }));
  }
}

async function saveVideo(video, outputPath, apiKey, prompt, style, duration) {
  const uri = video.gcsUri || video.uri || video.fileUri;
  if (uri) return await downloadFromUri(uri, outputPath, apiKey, prompt, style, duration);
  if (video.bytesBase64Encoded) {
    const data = Buffer.from(video.bytesBase64Encoded, 'base64');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, data);
    console.error(`  ✓ Saved: ${outputPath} (${(data.length / 1024 / 1024).toFixed(1)}MB)`);
    console.log(JSON.stringify({ success: true, provider: 'veo3', output: outputPath, duration_s: duration, prompt, style }));
    return;
  }
  console.log(JSON.stringify({ success: false, error: 'No downloadable data in video object' }));
}

async function downloadFromUri(uri, outputPath, apiKey, prompt, style, duration) {
  console.error(`  Downloading: ${uri.slice(0, 80)}...`);
  const url = new URL(uri.includes('?') ? uri : `${uri}?key=${apiKey}`);
  if (!url.searchParams.has('key')) url.searchParams.set('key', apiKey);
  const res = await httpsRequest({ hostname: url.hostname, path: url.pathname + url.search, method: 'GET' });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, res.body);
  console.error(`  ✓ Saved: ${outputPath} (${(res.body.length / 1024 / 1024).toFixed(1)}MB)`);
  console.log(JSON.stringify({ success: true, provider: 'veo3', output: outputPath, duration_s: duration, prompt, style }));
}

const args = parseArgs(process.argv.slice(2));
generateVideo(args);

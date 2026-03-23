#!/usr/bin/env node
/**
 * voice-preview.js — Generate voice preview samples using ElevenLabs API.
 *
 * Creates 3 short audio clips (~5 seconds each) using the script's hook line,
 * in different voice presets. User listens and picks their favorite.
 *
 * Also supports voice design: describe a custom voice and ElevenLabs generates it.
 *
 * Args:
 *   --text "Your hook line here"
 *   --presets dev-casual,storyteller,founder  (comma-separated preset names)
 *   --output-dir .demo-maker/voice-previews/
 *   --design "young female developer, slightly fast, Australian accent"  (optional)
 *
 * Reads ELEVENLABS_API_KEY from .demo-maker/.env
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const loadEnv = require('./load-env');

const VOICE_PRESETS = {
  'dev-casual': { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35 } },
  'tech-explainer': { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2 } },
  'storyteller': { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', settings: { stability: 0.5, similarity_boost: 0.7, style: 0.45 } },
  'founder': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', settings: { stability: 0.55, similarity_boost: 0.85, style: 0.4 } },
};

function parseArgs(args) {
  const parsed = { presets: 'dev-casual,storyteller,founder' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--text') parsed.text = args[++i];
    else if (args[i] === '--presets') parsed.presets = args[++i];
    else if (args[i] === '--output-dir') parsed.outputDir = args[++i];
    else if (args[i] === '--design') parsed.design = args[++i];
    else if (args[i] === '--project-root') parsed.projectRoot = args[++i];
  }
  return parsed;
}

function elevenLabsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode >= 400) {
          reject(new Error(`ElevenLabs ${res.statusCode}: ${body.toString()}`));
          return;
        }
        resolve({ statusCode: res.statusCode, body, headers: res.headers, contentType: res.headers['content-type'] });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function getElevenLabsModel(language) {
  return (!language || language === 'en') ? 'eleven_monolingual_v1' : 'eleven_multilingual_v2';
}

async function generatePreview(text, voiceId, settings, apiKey, language = 'en') {
  const payload = JSON.stringify({
    text,
    model_id: getElevenLabsModel(language),
    voice_settings: settings,
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Accept': 'audio/mpeg',
      'Content-Length': Buffer.byteLength(payload),
    }
  };

  const response = await elevenLabsRequest(options, payload);

  if (!response.contentType?.includes('audio')) {
    throw new Error('Response is not audio');
  }

  return response.body;
}

async function designVoice(description, sampleText, apiKey) {
  // Use ElevenLabs Voice Design API
  const payload = JSON.stringify({
    voice_description: description,
    text: sampleText,
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/text-to-voice/create-previews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Content-Length': Buffer.byteLength(payload),
    }
  };

  const response = await elevenLabsRequest(options, payload);
  return JSON.parse(response.body.toString());
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = args.projectRoot || process.cwd();
  const env = loadEnv(projectRoot);
  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.log(JSON.stringify({
      success: false,
      error: 'No ELEVENLABS_API_KEY found in .demo-maker/.env',
      hint: 'Add ELEVENLABS_API_KEY=your-key to .demo-maker/.env. Get one at https://elevenlabs.io/'
    }));
    process.exit(0);
  }

  const text = args.text || 'You just shipped your project. The code works. But nobody is going to read a wall of text.';
  const outputDir = args.outputDir || path.join(projectRoot, '.demo-maker', 'voice-previews');
  fs.mkdirSync(outputDir, { recursive: true });

  const results = { previews: [], designed: null, errors: [] };

  // Generate preset previews
  const presetNames = args.presets.split(',').map(s => s.trim());

  for (const preset of presetNames) {
    const voice = VOICE_PRESETS[preset];
    if (!voice) {
      results.errors.push(`Unknown preset: ${preset}`);
      continue;
    }

    console.error(`  Generating preview: ${preset} (${voice.name})...`);

    try {
      const language = args.language || 'en';
      const audio = await generatePreview(text, voice.voiceId, voice.settings, apiKey, language);
      const outputPath = path.join(outputDir, `preview-${preset}.mp3`);
      fs.writeFileSync(outputPath, audio);

      results.previews.push({
        preset,
        voiceName: voice.name,
        path: outputPath,
        size: audio.length,
      });

      console.error(`  ✓ ${preset}: ${outputPath}`);
    } catch (err) {
      console.error(`  ✗ ${preset}: ${err.message}`);
      results.errors.push(`${preset}: ${err.message}`);
    }

    // Rate limit pause
    await new Promise(r => setTimeout(r, 500));
  }

  // Voice design (if requested)
  if (args.design) {
    console.error(`  Designing custom voice: "${args.design}"...`);

    try {
      const designResult = await designVoice(args.design, text, apiKey);

      if (designResult.previews && designResult.previews.length > 0) {
        // Save each design preview
        const designPreviews = [];
        for (let i = 0; i < designResult.previews.length; i++) {
          const preview = designResult.previews[i];
          const audioData = Buffer.from(preview.audio_base_64, 'base64');
          const outputPath = path.join(outputDir, `designed-${i + 1}.mp3`);
          fs.writeFileSync(outputPath, audioData);

          designPreviews.push({
            index: i + 1,
            path: outputPath,
            generatedVoiceId: preview.generated_voice_id,
            size: audioData.length,
          });
        }

        results.designed = {
          description: args.design,
          previews: designPreviews,
        };

        console.error(`  ✓ ${designPreviews.length} custom voice designs generated`);
      }
    } catch (err) {
      console.error(`  ✗ Voice design failed: ${err.message}`);
      results.errors.push(`Voice design: ${err.message}`);
    }
  }

  results.success = results.previews.length > 0 || results.designed !== null;
  results.outputDir = outputDir;
  results.listenInstructions = `Open these files to listen: ${outputDir}/preview-*.mp3`;

  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});

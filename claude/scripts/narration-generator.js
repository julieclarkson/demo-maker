#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFile } = require('child_process');

/**
 * Get the actual duration of an audio file in milliseconds using ffprobe.
 * Returns the real playback duration, not a word-count estimate.
 */
function getAudioDurationMs(filePath) {
  return new Promise((resolve) => {
    execFile('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ], (err, stdout) => {
      if (err) {
        // Fallback to word-count estimate if ffprobe fails
        console.error(`  [ffprobe] Could not read duration for ${path.basename(filePath)}: ${err.message}`);
        resolve(null);
        return;
      }
      const seconds = parseFloat(stdout.trim());
      if (isNaN(seconds)) {
        resolve(null);
        return;
      }
      resolve(Math.round(seconds * 1000));
    });
  });
}

// Default voice IDs from ElevenLabs
const VOICE_TEMPLATES = {
  'dev-casual': 'pNInz6obpgDQGcFmaJgB',      // Adam
  'tech-explainer': 'ErXwobaYiN019PkySvjV', // Antoni
  'storyteller': 'VR6AewLTigWG4xSOukaG',     // Arnold
  'founder': 'TxGEqnHWrfWFTfGW9XjX'          // Josh
};

/**
 * Make HTTPS request
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', chunk => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';

        // For binary responses (audio, video), return the raw Buffer
        if (contentType.includes('audio') || contentType.includes('octet-stream')) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${rawBuffer.toString('utf8').slice(0, 500)}`));
          } else {
            resolve({ status: res.statusCode, body: rawBuffer, headers: res.headers });
          }
          return;
        }

        // For text/JSON responses, parse as string
        const bodyStr = rawBuffer.toString('utf8');
        try {
          const parsed = bodyStr ? JSON.parse(bodyStr) : null;
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed?.message || bodyStr || 'Unknown error'}`));
          } else {
            resolve({ status: res.statusCode, body: parsed, raw: bodyStr, headers: res.headers });
          }
        } catch (err) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${bodyStr}`));
          } else {
            resolve({ status: res.statusCode, body: rawBuffer, headers: res.headers });
          }
        }
      });
    });

    req.on('error', reject);

    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }

    req.end();
  });
}

/**
 * Generate TTS with ElevenLabs standard TTS API
 */
async function generateWithElevenLabs(text, voiceId, apiKey, apiUrl = 'https://api.elevenlabs.io') {
  try {
    const url = new URL(`/v1/text-to-speech/${voiceId}`, apiUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      }
    };

    const payload = {
      text,
      model_id: 'eleven_turbo_v2_5',  // English-only — prevents multilingual model from switching languages
      voice_settings: {
        stability: 0.5,           // Lower = more dynamic, expressive delivery
        similarity_boost: 0.75,   // Keep voice consistent
        style: 0.7,              // HIGH = emotionally expressive, compelling, not flat
        use_speaker_boost: true   // Clearer, more present voice
      }
    };

    const response = await httpsRequest(options, payload);

    if (!response.headers['content-type']?.includes('audio')) {
      throw new Error('Response is not audio data');
    }

    if (!Buffer.isBuffer(response.body)) {
      throw new Error('Expected Buffer for audio response but got ' + typeof response.body);
    }

    return {
      provider: 'elevenlabs',
      audio: response.body,
      contentType: response.headers['content-type']
    };
  } catch (err) {
    throw new Error(`ElevenLabs API error: ${err.message}`);
  }
}

/**
 * Generate audio using ElevenLabs Voice Design API (no voice ID needed).
 * Creates a custom voice from a text description and generates audio in one call.
 */
async function generateWithVoiceDesign(text, voiceDescription, apiKey) {
  try {
    const payload = JSON.stringify({
      voice_description: voiceDescription,
      text: text,
    });

    const response = await httpsRequest({
      hostname: 'api.elevenlabs.io',
      path: '/v1/text-to-voice/create-previews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'xi-api-key': apiKey,
      }
    }, payload);

    // This endpoint returns JSON with previews array
    let data;
    if (Buffer.isBuffer(response.body)) {
      data = JSON.parse(response.body.toString('utf8'));
    } else if (typeof response.body === 'string') {
      data = JSON.parse(response.body);
    } else {
      data = response.body;
    }

    if (!data.previews || data.previews.length === 0) {
      throw new Error('No previews returned from Voice Design API');
    }

    // Pick the first preview and decode the base64 audio
    const preview = data.previews[0];
    const audioBuffer = Buffer.from(preview.audio_base_64, 'base64');

    return {
      provider: 'elevenlabs-voice-design',
      audio: audioBuffer,
      generatedVoiceId: preview.generated_voice_id,
    };
  } catch (err) {
    throw new Error(`Voice Design API error: ${err.message}`);
  }
}

/**
 * Save a Voice Design preview voice to the user's ElevenLabs voice library.
 * The generated_voice_id from create-previews is TEMPORARY and cannot be used
 * with standard TTS. This endpoint saves it permanently and returns a real voice ID.
 */
async function saveVoiceToLibrary(generatedVoiceId, voiceName, voiceDescription, apiKey) {
  try {
    const payload = JSON.stringify({
      voice_name: voiceName,
      voice_description: voiceDescription,
      generated_voice_id: generatedVoiceId,
    });

    const response = await httpsRequest({
      hostname: 'api.elevenlabs.io',
      path: '/v1/text-to-voice/create-voice-from-preview',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'xi-api-key': apiKey,
      }
    }, payload);

    let data;
    if (Buffer.isBuffer(response.body)) {
      data = JSON.parse(response.body.toString('utf8'));
    } else if (typeof response.body === 'string') {
      data = JSON.parse(response.body);
    } else {
      data = response.body;
    }

    if (!data.voice_id) {
      throw new Error('No voice_id returned from create-voice-from-preview');
    }

    return data.voice_id;
  } catch (err) {
    throw new Error(`Save voice to library failed: ${err.message}`);
  }
}

/**
 * Clone a voice from an audio sample file using ElevenLabs Instant Voice Cloning.
 * Returns the permanent voice ID that can be used with standard TTS.
 */
async function cloneVoiceFromSample(samplePath, voiceName, apiKey) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const audioData = fs.readFileSync(samplePath);
    const fileName = path.basename(samplePath);

    // Build multipart form data
    const parts = [];

    // name field
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="name"\r\n\r\n` +
      `${voiceName}\r\n`
    );

    // description field
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="description"\r\n\r\n` +
      `Cloned voice for Demo Maker narration\r\n`
    );

    // audio file
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
      `Content-Type: audio/mpeg\r\n\r\n`
    );

    const header = Buffer.from(parts.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, audioData, footer]);

    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices/add',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'xi-api-key': apiKey,
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        try {
          const data = JSON.parse(responseBody);
          if (res.statusCode >= 400) {
            reject(new Error(`Voice clone API error (${res.statusCode}): ${data.detail?.message || responseBody}`));
            return;
          }
          if (!data.voice_id) {
            reject(new Error('No voice_id returned from voice clone API'));
            return;
          }
          resolve(data.voice_id);
        } catch (e) {
          reject(new Error(`Voice clone parse error: ${responseBody.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Generate TTS with OpenAI
 */
async function generateWithOpenAI(text, voice, apiKey, apiUrl = 'https://api.openai.com/v1') {
  try {
    const url = new URL('/audio/speech', apiUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const payload = {
      model: 'tts-1',
      input: text,
      voice: voice || 'alloy'
    };

    const response = await httpsRequest(options, payload);

    if (!response.headers['content-type']?.includes('audio')) {
      throw new Error('Response is not audio data');
    }

    return {
      provider: 'openai',
      audio: response.body,
      contentType: response.headers['content-type']
    };
  } catch (err) {
    throw new Error(`OpenAI API error: ${err.message}`);
  }
}

/**
 * Generate silence audio file (MP3 format, minimal)
 */
function generateSilenceAudio(durationMs) {
  // MP3 silence frame (simplest possible)
  // This is a minimal valid MP3 file with silence
  const frameSize = 418; // bytes per frame
  const frames = Math.ceil((durationMs / 1000) * 41.666); // 41.666 frames per second at 44.1kHz
  const buffer = Buffer.alloc(frameSize);

  // MP3 frame header for silence (simplified)
  // Frame sync: 0xFFFB, MPEG-1 Layer III, 128kbps
  buffer[0] = 0xFF;
  buffer[1] = 0xFB;
  buffer[2] = 0x10; // MPEG-1, Layer III, 128kbps
  buffer[3] = 0x00; // no padding

  return buffer;
}

/**
 * Parse script into segments
 */
function parseScript(scriptContent) {
  const segments = [];
  const lines = scriptContent.split('\n');
  let currentSegment = null;

  for (const line of lines) {
    // Match multiple scene header formats:
    //   "## Scene: Title (id: X)"
    //   "## Scene 1: Hook (0:00–0:08)"
    //   "### Scene 3: THE TURN"
    // Match scene headers like:
    //   "## Scene 1: Hook (0:00–0:08)"   → sceneNum=1, title="Hook"
    //   "## Scene: Title (id: X)"         → sceneNum=null, title="Title", explicitId="X"
    //   "### Scene 3: THE TURN"           → sceneNum=3, title="THE TURN"
    const sceneMatch = line.match(/^#+\s*Scene(?:\s*(\d+))?[:\s]+(.+?)(?:\s*\((?:id:\s*)([a-zA-Z][\w-]*)\))?(?:\s*\(\d[:–\-].+?\))?$/i);

    if (sceneMatch) {
      if (currentSegment) {
        segments.push(currentSegment);
      }

      const sceneNum = sceneMatch[1] || '';
      const title = sceneMatch[2].trim();
      const explicitId = sceneMatch[3]; // only matches alphabetic IDs like "hook", not timestamps

      currentSegment = {
        id: explicitId || sceneNum || title.toLowerCase().replace(/\s+/g, '-'),
        title: title,
        text: ''
      };
    } else if (currentSegment) {
      const trimmed = line.trim();

      // Skip metadata, visual descriptions, and section dividers
      if (!trimmed) continue;
      if (trimmed === '---') continue;
      if (trimmed.startsWith('**Visual')) continue;
      if (trimmed.startsWith('**[Visual')) continue;
      if (trimmed.startsWith('## Anti-Slop')) { currentSegment = null; continue; }
      if (trimmed.startsWith('## Cut-down')) { currentSegment = null; continue; }

      // Capture narration text (with or without > blockquote prefix)
      if (trimmed.startsWith('>')) {
        const narrationText = trimmed.replace(/^>\s*/, '');
        if (narrationText) currentSegment.text += narrationText + ' ';
      } else if (!trimmed.startsWith('**') && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
        // Also capture plain text lines (for v1 format scripts)
        currentSegment.text += trimmed + ' ';
      }
    }
  }

  if (currentSegment && currentSegment.text.trim()) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Generate narration for all segments
 */
async function generateNarrations(segments, config, outputDir) {
  const results = {
    provider: 'none',
    narrations: [],
    errors: [],
    fallbacks: []
  };

  // Load API keys from .env file (never from config.json, never visible to AI)
  const loadEnv = require('./load-env');
  const env = loadEnv(process.cwd());
  const elevenlabsKey = env.ELEVENLABS_API_KEY || config.elevenlabs?.apiKey || '';
  const openaiKey = env.OPENAI_API_KEY || config.openai?.apiKey || '';

  if (!elevenlabsKey && !openaiKey) {
    results.provider = 'caption-only';
    results.fallbacks.push('No API keys configured. Using caption-only mode.');
  }

  // ── Voice strategy ──────────────────────────────────────────────────
  // 1. Check voice-lock.json for a previously locked voice ID (best — same voice every run)
  // 2. Clone from voice-sample.mp3 if present (exact match to reference audio)
  // 3. Check voices.json for user-configured voice IDs
  // 4. Last resort: fall back to config preset
  let lockedVoiceId = null;
  let voiceIds = [];
  const voiceLockPath = path.join(process.cwd(), '.demo-maker', 'voice-lock.json');
  const voiceSamplePath = path.join(process.cwd(), '.demo-maker', 'voice-sample.mp3');
  const voicesJsonPath = path.join(process.cwd(), '.demo-maker', 'voices.json');

  // Step 1: Check for a locked voice ID (from a previous clone or Voice Design run)
  if (fs.existsSync(voiceLockPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(voiceLockPath, 'utf8'));
      if (lockData.voiceId) {
        lockedVoiceId = lockData.voiceId;
        console.error(`  Using locked voice ID: ${lockedVoiceId} (from voice-lock.json)`);
      }
    } catch (e) {
      console.error(`  Warning: Could not read voice-lock.json: ${e.message}`);
    }
  }

  // Step 2: Clone voice from sample MP3 (highest quality — exact voice match)
  if (!lockedVoiceId && fs.existsSync(voiceSamplePath) && elevenlabsKey) {
    console.error('  No locked voice found. Cloning from voice-sample.mp3...');
    try {
      const clonedVoiceId = await cloneVoiceFromSample(
        voiceSamplePath,
        'Demo Maker Narrator',
        elevenlabsKey
      );
      lockedVoiceId = clonedVoiceId;
      console.error(`  Voice cloned successfully: ${lockedVoiceId}`);

      // Save the voice lock so we don't re-clone on the next platform
      fs.writeFileSync(voiceLockPath, JSON.stringify({
        voiceId: lockedVoiceId,
        source: 'voice-sample.mp3',
        createdAt: new Date().toISOString(),
        note: 'Delete this file to re-clone the voice on next run'
      }, null, 2));
      console.error(`  Voice locked: ${lockedVoiceId} (saved to voice-lock.json)`);
    } catch (err) {
      console.error(`[WARN] Voice cloning failed: ${err.message}. Will try other methods.`);
    }
  }

  // Step 3: Check voices.json for user-configured voice IDs
  if (!lockedVoiceId && fs.existsSync(voicesJsonPath)) {
    try {
      const voicesData = JSON.parse(fs.readFileSync(voicesJsonPath, 'utf8'));
      const primary = voicesData.voices?.[voicesData.primary];
      const secondary = voicesData.voices?.[voicesData.secondary];
      if (primary?.voiceId) voiceIds.push(primary.voiceId);
      if (secondary?.voiceId) voiceIds.push(secondary.voiceId);
      if (voiceIds.length > 0) {
        console.error(`  Using configured voices: ${voiceIds.length} voice(s) from voices.json`);
      }
    } catch (e) {
      console.error(`  Warning: Could not read voices.json: ${e.message}`);
    }
  }

  // Step 4: Build final voice ID list for standard TTS
  if (lockedVoiceId) {
    voiceIds = [lockedVoiceId];
  }

  // Last fallback to config preset
  const voiceRole = config.narrator?.voiceRole || 'dev-casual';
  const fallbackVoiceId = config.narrator?.voiceId || VOICE_TEMPLATES[voiceRole];
  if (voiceIds.length === 0) voiceIds = [fallbackVoiceId];

  const openaiVoice = config.narrator?.openaiVoice || 'alloy';

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segment = segments[segIdx];
    try {
      if (!segment.text.trim()) {
        results.narrations.push({
          sceneId: segment.id,
          path: null,
          duration_ms: 0,
          provider: 'caption-only',
          warning: 'Segment has no text'
        });
        continue;
      }

      const outputPath = path.join(outputDir, `scene-${segment.id}.mp3`);
      let audio = null;
      let provider = 'caption-only';

      // Skip if this scene's audio was already generated during voice locking
      if (segment._audioGenerated && fs.existsSync(segment._audioPath)) {
        audio = fs.readFileSync(segment._audioPath);
        provider = segment._provider;
      }

      // Priority 1: Standard ElevenLabs TTS with locked/cloned voice ID
      if (!audio && voiceIds.length > 0 && elevenlabsKey) {
        const currentVoiceId = voiceIds[0]; // Always use the same voice
        try {
          console.error(`  ElevenLabs TTS for scene ${segment.id} (voice: ${currentVoiceId.slice(0, 8)}...)...`);
          const result = await generateWithElevenLabs(
            segment.text,
            currentVoiceId,
            elevenlabsKey,
            config.elevenlabs?.apiUrl
          );
          audio = result.audio;
          provider = 'elevenlabs';
        } catch (err) {
          console.error(`[WARN] ElevenLabs TTS failed for ${segment.id}: ${err.message}`);
        }
      }

      // Priority 2: OpenAI TTS
      if (!audio && openaiKey) {
        try {
          const result = await generateWithOpenAI(
            segment.text,
            openaiVoice,
            openaiKey,
            config.openai?.apiUrl
          );
          audio = result.audio;
          provider = 'openai';
        } catch (err) {
          console.error(`[WARN] OpenAI failed for ${segment.id}: ${err.message}`);
        }
      }

      // If we got audio, write the file
      if (audio) {
        fs.writeFileSync(outputPath, audio);

        // Measure ACTUAL audio duration with ffprobe (fall back to word estimate)
        let duration_ms = await getAudioDurationMs(outputPath);
        if (!duration_ms) {
          const wordCount = segment.text.split(/\s+/).length;
          duration_ms = Math.max(1000, wordCount * 400);
          console.error(`  Using word-count estimate for scene ${segment.id}: ${duration_ms}ms`);
        } else {
          console.error(`  Actual audio duration for scene ${segment.id}: ${duration_ms}ms`);
        }

        results.narrations.push({
          sceneId: segment.id,
          path: outputPath,
          duration_ms,
          provider,
          text: segment.text.substring(0, 100) + (segment.text.length > 100 ? '...' : '')
        });
      } else {
        // No audio generated — do NOT write an invalid silence file.
        // Remotion will simply skip the Audio component for this scene.
        provider = 'caption-only';
        results.fallbacks.push(`No audio for scene ${segment.id} — will render without narration`);

        const wordCount = segment.text.split(/\s+/).length;
        const estimatedDuration = Math.max(1000, wordCount * 400);

        results.narrations.push({
          sceneId: segment.id,
          path: null,
          duration_ms: estimatedDuration,
          provider,
          text: segment.text.substring(0, 100) + (segment.text.length > 100 ? '...' : '')
        });
      }
    } catch (err) {
      results.errors.push({
        sceneId: segment.id,
        message: err.message
      });
    }
  }

  // Determine final provider
  const providers = new Set(results.narrations.map(n => n.provider));
  if (providers.has('elevenlabs')) {
    results.provider = 'elevenlabs';
  } else if (providers.has('openai')) {
    results.provider = 'openai';
  } else {
    results.provider = 'caption-only';
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();

  if (!args.script || !args.config || !args['output-dir']) {
    console.error(JSON.stringify({
      error: 'Missing required arguments: --script <path> --config <path> --output-dir <path>'
    }, null, 2));
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Load script
    if (!fs.existsSync(args.script)) {
      throw new Error(`Script file not found: ${args.script}`);
    }
    const scriptContent = fs.readFileSync(args.script, 'utf8');

    // Load config
    if (!fs.existsSync(args.config)) {
      throw new Error(`Config file not found: ${args.config}`);
    }
    const config = JSON.parse(fs.readFileSync(args.config, 'utf8'));

    // Create output directory
    const outputDir = args['output-dir'];
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Parse script into segments
    const segments = parseScript(scriptContent);

    if (segments.length === 0) {
      throw new Error('Script contains no scenes');
    }

    // Generate narrations
    const results = await generateNarrations(segments, config, outputDir);

    // Output results
    console.log(JSON.stringify({
      success: results.errors.length === 0,
      ...results,
      duration_ms: Date.now() - startTime
    }, null, 2));

    process.exit(results.errors.length === 0 ? 0 : 1);
  } catch (err) {
    // Must use stdout (console.log) so run-demo.sh captures the JSON
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      narrations: [],
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

main();

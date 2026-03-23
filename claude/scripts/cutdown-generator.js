#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Platform specifications
const PLATFORMS = {
  twitter: {
    maxDuration: 30,
    keepScenes: 3,
    description: '30s - Hook + demo + CTA'
  },
  producthunt: {
    maxDuration: 45,
    keepScenes: 4,
    description: '45s - Hook + 2-3 demos + result + CTA'
  },
  github: {
    maxDuration: 60,
    keepScenes: -1, // Keep all
    description: '60s - Full version',
    formats: ['mp4']
  },
  youtube: {
    maxDuration: -1, // No limit
    keepScenes: -1,
    description: 'Full length'
  }
};

/**
 * Get media duration using FFprobe
 */
async function getMediaDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1:nokey_sep=:',
      filePath
    ]);

    return parseFloat(stdout.trim());
  } catch (err) {
    throw new Error(`Failed to get media duration: ${err.message}`);
  }
}

/**
 * Select scenes based on priority and duration
 */
function selectScenes(scenes, maxDuration) {
  if (maxDuration === -1) {
    return scenes; // Keep all
  }

  // Sort by priority (descending) then by order
  const sorted = [...scenes].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    if (priorityB !== priorityA) return priorityB - priorityA;
    return scenes.indexOf(a) - scenes.indexOf(b);
  });

  const selected = [];
  let totalDuration = 0;

  for (const scene of sorted) {
    const sceneDuration = scene.duration || 5;
    if (totalDuration + sceneDuration <= maxDuration) {
      selected.push(scene);
      totalDuration += sceneDuration;
    }
  }

  // Reorder to match original storyboard order
  return scenes.filter(s => selected.includes(s));
}

/**
 * Extract segment of video using FFmpeg
 */
async function extractSegment(inputVideo, startTime, endTime, outputVideo) {
  const duration = endTime - startTime;

  try {
    await execFileAsync('ffmpeg', [
      '-i', inputVideo,
      '-ss', String(startTime),
      '-t', String(duration),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-y',
      outputVideo
    ]);
  } catch (err) {
    throw new Error(`FFmpeg extraction failed: ${err.message}`);
  }
}

/**
 * Convert video to GIF using FFmpeg with palette
 */
async function convertToGif(inputVideo, outputGif, maxWidth = 800) {
  try {
    // Generate palette
    const paletteFile = outputGif.replace('.gif', '_palette.png');

    await execFileAsync('ffmpeg', [
      '-i', inputVideo,
      '-vf', `fps=15,scale=${maxWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      '-loop', '0',
      '-y',
      outputGif
    ]);

    // Clean up palette file
    try {
      fs.unlinkSync(paletteFile);
    } catch (err) {
      // Ignore
    }
  } catch (err) {
    throw new Error(`GIF conversion failed: ${err.message}`);
  }
}

/**
 * Generate cutdown video for a platform
 */
async function generateCutdown(platform, storyboard, fullVideoPath, outputDir) {
  const platformSpec = PLATFORMS[platform];

  if (!platformSpec) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const result = {
    platform,
    path: null,
    duration_ms: 0,
    fileSize: 0,
    success: false,
    error: null
  };

  try {
    // Select scenes for platform
    const selectedScenes = selectScenes(storyboard.scenes, platformSpec.maxDuration);

    if (selectedScenes.length === 0) {
      throw new Error('No scenes fit within platform duration limit');
    }

    // Calculate total duration and trim points
    let currentTime = 0;
    const trimPoints = [];

    for (const scene of storyboard.scenes) {
      const isSelected = selectedScenes.includes(scene);
      const duration = scene.duration || 5;

      if (isSelected) {
        trimPoints.push({
          sceneId: scene.id,
          startTime: currentTime,
          endTime: currentTime + duration,
          selected: true
        });
      }

      currentTime += duration;
    }

    // Extract cutdown video
    const outputVideo = path.join(outputDir, `cutdown-${platform}.mp4`);

    if (trimPoints.length === 1) {
      // Single scene - simple extract
      const point = trimPoints[0];
      await extractSegment(fullVideoPath, point.startTime, point.endTime, outputVideo);
    } else {
      // Multiple scenes - create concat file and re-render
      // For simplicity, just use the full video if it fits
      const fullDuration = await getMediaDuration(fullVideoPath);

      if (fullDuration <= platformSpec.maxDuration) {
        // Full video fits - use as-is
        fs.copyFileSync(fullVideoPath, outputVideo);
      } else {
        // Need to trim from start and end
        const endTime = Math.min(platformSpec.maxDuration, fullDuration);
        await extractSegment(fullVideoPath, 0, endTime, outputVideo);
      }
    }

    // Get output file stats
    const stats = fs.statSync(outputVideo);
    const duration = await getMediaDuration(outputVideo);

    result.path = outputVideo;
    result.duration_ms = duration * 1000;
    result.fileSize = stats.size;
    result.fileSize_mb = (stats.size / (1024 * 1024)).toFixed(2);
    result.success = true;

    // Generate GIF version for GitHub if requested
    if (platform === 'github' && platformSpec.formats?.includes('gif')) {
      const outputGif = path.join(outputDir, 'cutdown-github.gif');

      try {
        console.error(`[INFO] Converting to GIF for GitHub...`);
        await convertToGif(outputVideo, outputGif, 800);

        const gifStats = fs.statSync(outputGif);
        result.gif = {
          path: outputGif,
          fileSize: gifStats.size,
          fileSize_mb: (gifStats.size / (1024 * 1024)).toFixed(2)
        };
      } catch (err) {
        console.error(`[WARN] GIF conversion failed: ${err.message}`);
      }
    }

    return result;
  } catch (err) {
    result.error = err.message;
    return result;
  }
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();

  if (!args.storyboard || !args['full-video'] || !args['output-dir']) {
    console.error(JSON.stringify({
      error: 'Missing required arguments: --storyboard <path> --full-video <path> --output-dir <path>'
    }, null, 2));
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Load storyboard
    if (!fs.existsSync(args.storyboard)) {
      throw new Error(`Storyboard not found: ${args.storyboard}`);
    }

    const storyboard = JSON.parse(fs.readFileSync(args.storyboard, 'utf8'));

    if (!Array.isArray(storyboard.scenes)) {
      throw new Error('Storyboard must contain scenes array');
    }

    // Verify full video exists
    if (!fs.existsSync(args['full-video'])) {
      throw new Error(`Full video not found: ${args['full-video']}`);
    }

    // Create output directory
    if (!fs.existsSync(args['output-dir'])) {
      fs.mkdirSync(args['output-dir'], { recursive: true });
    }

    // Generate cutdowns for each platform
    const cutdowns = [];
    const errors = [];

    for (const platform of Object.keys(PLATFORMS)) {
      console.error(`[INFO] Generating ${platform} cutdown...`);

      try {
        const result = await generateCutdown(platform, storyboard, args['full-video'], args['output-dir']);

        if (result.success) {
          cutdowns.push(result);
        } else {
          errors.push({
            platform,
            message: result.error
          });
        }
      } catch (err) {
        errors.push({
          platform,
          message: err.message
        });
      }
    }

    console.log(JSON.stringify({
      success: errors.length === 0,
      cutdowns,
      errors,
      duration_ms: Date.now() - startTime
    }, null, 2));

    process.exit(errors.length === 0 ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
      cutdowns: [],
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

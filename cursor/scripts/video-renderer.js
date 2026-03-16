#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Check if FFmpeg is available
 */
async function checkFFmpeg() {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    return true;
  } catch {
    throw new Error('FFmpeg not found. Install FFmpeg or @ffmpeg-installer/ffmpeg');
  }
}

/**
 * Build FFmpeg concat file for scene concatenation
 */
function buildConcatFile(scenes, capturesDir, narrationsDir) {
  let content = '';

  for (const scene of scenes) {
    const videoPath = path.join(capturesDir, `scene-${scene.id}.webm`);
    const audioPath = path.join(narrationsDir, `scene-${scene.id}.mp3`);

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    content += `file '${videoPath}'\n`;
  }

  return content;
}

/**
 * Extract duration from media file using FFprobe
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
    console.error(`[WARN] Could not determine duration for ${filePath}: ${err.message}`);
    return 0;
  }
}

/**
 * Build FFmpeg filter graph for transitions and captions
 */
function buildFilterGraph(scenes, transitionDuration = 0.3) {
  // Simple concat without complex transitions for v1
  // More advanced transitions can be added later
  return null; // Use simple concat demuxer instead
}

/**
 * Generate SRT caption file
 */
function generateCaptionFile(scenes, capturesDir, narrationsDir) {
  const captions = [];
  let currentTime = 0;

  for (const scene of scenes) {
    const audioPath = path.join(narrationsDir, `scene-${scene.id}.mp3`);

    if (!fs.existsSync(audioPath)) {
      continue;
    }

    const duration = 0; // Will be calculated by FFmpeg
    const endTime = currentTime + (scene.duration || 5000);

    const startMs = currentTime;
    const endMs = endTime;

    captions.push({
      index: captions.length + 1,
      startTime: formatTimestamp(startMs),
      endTime: formatTimestamp(endMs),
      text: scene.caption || scene.title || `Scene ${scene.id}`
    });

    currentTime = endMs;
  }

  // Build SRT format
  let srtContent = '';
  for (const caption of captions) {
    srtContent += `${caption.index}\n`;
    srtContent += `${caption.startTime} --> ${caption.endTime}\n`;
    srtContent += `${caption.text}\n\n`;
  }

  return srtContent;
}

/**
 * Format milliseconds to SRT timestamp (HH:MM:SS,mmm)
 */
function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Generate thumbnail by extracting middle frame of first important scene
 */
async function generateThumbnail(videoPath, outputPath) {
  try {
    // Extract frame at 25% through the video
    await execFileAsync('ffmpeg', [
      '-i', videoPath,
      '-vf', 'select=\'eq(n\\,50)\'',
      '-vframes', '1',
      '-y',
      outputPath
    ]);
  } catch (err) {
    console.error(`[WARN] Failed to generate thumbnail: ${err.message}`);
    // Create a blank thumbnail instead
    await execFileAsync('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'color=c=black:s=1920x1080:d=1',
      '-vframes', '1',
      '-y',
      outputPath
    ]);
  }
}

/**
 * Add watermark overlay to video
 */
function buildWatermarkFilter() {
  // Text overlay: "Made with Demo Maker" in bottom-right corner
  // Only visible in last 3 seconds (enable=lt(t\\,3))
  return `drawtext=text='Made with Demo Maker':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=16:fontcolor=white@0.7:x=w-200:y=h-40:enable='lt(t\\,3)'`;
}

/**
 * Render final video with FFmpeg
 */
async function renderVideo(concatFile, narrationsDir, scenes, outputPath, config = {}) {
  const resolution = config.resolution || '1920x1080';
  const [width, height] = resolution.split('x').map(Number);
  const crf = config.crf || 23;

  // Build FFmpeg command
  const ffmpegArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(crf),
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-pix_fmt', 'yuv420p',
    '-y',
    outputPath
  ];

  try {
    await execFileAsync('ffmpeg', ffmpegArgs);
  } catch (err) {
    throw new Error(`FFmpeg rendering failed: ${err.message}`);
  }
}

/**
 * Main render function
 */
async function main() {
  const args = parseArgs();

  if (!args.storyboard || !args['captures-dir'] || !args['narration-dir'] || !args.output) {
    console.error(JSON.stringify({
      error: 'Missing required arguments: --storyboard <path> --captures-dir <path> --narration-dir <path> --output <path>'
    }, null, 2));
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Check FFmpeg
    await checkFFmpeg();

    // Load storyboard
    if (!fs.existsSync(args.storyboard)) {
      throw new Error(`Storyboard not found: ${args.storyboard}`);
    }

    const storyboard = JSON.parse(fs.readFileSync(args.storyboard, 'utf8'));

    if (!Array.isArray(storyboard.scenes)) {
      throw new Error('Storyboard must contain scenes array');
    }

    // Verify directories exist
    if (!fs.existsSync(args['captures-dir'])) {
      throw new Error(`Captures directory not found: ${args['captures-dir']}`);
    }

    if (!fs.existsSync(args['narration-dir'])) {
      throw new Error(`Narration directory not found: ${args['narration-dir']}`);
    }

    // Create output directory
    const outputDir = path.dirname(args.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build concat file
    const concatFile = path.join(outputDir, 'concat.txt');
    const concatContent = buildConcatFile(storyboard.scenes, args['captures-dir'], args['narration-dir']);
    fs.writeFileSync(concatFile, concatContent);

    // Render video
    console.error('[INFO] Rendering video...');
    await renderVideo(concatFile, args['narration-dir'], storyboard.scenes, args.output, storyboard.config?.video);

    // Verify output
    if (!fs.existsSync(args.output)) {
      throw new Error('Video rendering failed - output file not created');
    }

    const stats = fs.statSync(args.output);

    // Generate captions
    const captionsPath = path.join(outputDir, 'captions.srt');
    const captionsContent = generateCaptionFile(storyboard.scenes, args['captures-dir'], args['narration-dir']);
    fs.writeFileSync(captionsPath, captionsContent);

    // Generate thumbnail
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
    await generateThumbnail(args.output, thumbnailPath);

    // Get actual duration
    const videoDuration = await getMediaDuration(args.output);

    // Clean up temp files
    try {
      fs.unlinkSync(concatFile);
    } catch (err) {
      // Ignore
    }

    // Output results
    console.log(JSON.stringify({
      success: true,
      output: {
        video: args.output,
        captions: captionsPath,
        thumbnail: thumbnailPath
      },
      duration_ms: videoDuration * 1000,
      fileSize: stats.size,
      fileSize_mb: (stats.size / (1024 * 1024)).toFixed(2),
      total_time_ms: Date.now() - startTime
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
      output: null,
      duration_ms: 0,
      fileSize: 0,
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

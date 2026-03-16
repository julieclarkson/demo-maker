#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Banned words and suggested replacements
const BANNED_WORDS = {
  'amazing': 'impressive, notable, or describe specifically',
  'awesome': 'excellent, great, or describe specifically',
  'incredible': 'remarkable, noteworthy, or describe specifically',
  'literally': 'actually, or remove',
  'basically': 'essentially, or remove',
  'actually': 'use sparingly',
  'very': 'use a stronger word instead',
  'really': 'use a stronger word instead',
  'just': 'remove or use "only" if needed',
  'like': 'remove filler usage',
  'kind of': 'replace with precise term',
  'sort of': 'replace with precise term',
  'stuff': 'use specific term',
  'thing': 'use specific term',
  'things': 'use specific terms',
  'absolutely': 'remove or use sparingly',
  'completely': 'remove or use sparingly',
  'totally': 'remove or use sparingly',
  'literally': 'remove unless used correctly',
  'obviously': 'don\'t assume - explain',
  'clearly': 'don\'t assume - explain',
  'never before': 'claim should have evidence',
  'game-changing': 'need evidence or data',
  'revolutionary': 'need evidence or data',
  'paradigm shift': 'need evidence or data'
};

// Common adjectives (from linguistic analysis)
const ADJECTIVE_PATTERNS = [
  /ful$/i,      // wonderful, helpful, etc.
  /ous$/i,      // famous, generous, etc.
  /ive$/i,      // creative, productive, etc.
  /able$/i,     // capable, readable, etc.
  /less$/i,     // harmless, limitless, etc.
  /ible$/i      // visible, compatible, etc.
];

const COMMON_ADJECTIVES = new Set([
  'good', 'bad', 'big', 'small', 'new', 'old', 'first', 'last',
  'long', 'short', 'high', 'low', 'true', 'false', 'right', 'wrong',
  'fast', 'slow', 'hot', 'cold', 'heavy', 'light', 'strong', 'weak',
  'beautiful', 'ugly', 'nice', 'mean', 'smart', 'stupid', 'easy', 'hard',
  'simple', 'complex', 'clear', 'dark', 'bright', 'happy', 'sad', 'angry',
  'free', 'expensive', 'cheap', 'rich', 'poor', 'best', 'worst', 'better',
  'worse', 'great', 'terrible', 'wonderful', 'awful', 'excellent', 'poor'
]);

/**
 * Check if word is an adjective
 */
function isAdjective(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');

  if (COMMON_ADJECTIVES.has(clean)) {
    return true;
  }

  return ADJECTIVE_PATTERNS.some(pattern => pattern.test(clean));
}

/**
 * Count adjectives in text
 */
function countAdjectives(text) {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(w => isAdjective(w)).length;
}

/**
 * Validate script content
 */
function validateScript(scriptContent) {
  const violations = [];
  const lines = scriptContent.split('\n');
  let totalWords = 0;
  let exclamationCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Count words
    const words = line.split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;

    // Check for banned words (case-insensitive)
    for (const [banned, suggestion] of Object.entries(BANNED_WORDS)) {
      const regex = new RegExp(`\\b${banned}\\b`, 'gi');
      let match;

      while ((match = regex.exec(line)) !== null) {
        violations.push({
          rule: 'banned-word',
          line: lineNum,
          column: match.index,
          text: match[0],
          suggestion: suggestion,
          severity: 'warning'
        });
      }
    }

    // Count exclamation marks
    exclamationCount += (line.match(/!/g) || []).length;

    // Check for fake metrics
    if (line.match(/\d+x\s+(faster|better|more|improved)/i)) {
      violations.push({
        rule: 'unsubstantiated-claim',
        line: lineNum,
        text: line.match(/\d+x\s+(faster|better|more|improved)/i)[0],
        suggestion: 'Provide evidence or remove the claim',
        severity: 'error'
      });
    }

    if (line.match(/(millions|thousands|billions)\s+of\s+(users|customers)/i)) {
      violations.push({
        rule: 'unsubstantiated-claim',
        line: lineNum,
        text: line.match(/(millions|thousands|billions)\s+of\s+(users|customers)/i)[0],
        suggestion: 'Provide specific data or remove the claim',
        severity: 'error'
      });
    }

    // Count adjectives per sentence
    const sentences = line.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.trim().length === 0) continue;

      const adjCount = countAdjectives(sentence);
      const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);

      if (sentenceWords.length > 0) {
        const adjRatio = adjCount / sentenceWords.length;

        if (adjRatio > 0.3) {
          violations.push({
            rule: 'too-many-adjectives',
            line: lineNum,
            text: sentence.substring(0, 80),
            count: adjCount,
            suggestion: `Reduce adjectives (currently ${adjCount}/${sentenceWords.length} words)`,
            severity: 'warning'
          });
        }
      }
    }
  }

  // Check exclamation mark ratio
  if (exclamationCount > totalWords * 0.05) {
    violations.push({
      rule: 'excessive-exclamation',
      line: 0,
      text: `${exclamationCount} exclamation marks in ${totalWords} words`,
      suggestion: 'Reduce exclamation marks - max 5% of text',
      severity: 'warning'
    });
  }

  // Calculate quality score (0-100)
  const baseScore = 100;
  const errorPenalty = violations.filter(v => v.severity === 'error').length * 10;
  const warningPenalty = violations.filter(v => v.severity === 'warning').length * 2;
  const score = Math.max(0, baseScore - errorPenalty - warningPenalty);

  return {
    violations,
    score,
    metrics: {
      totalWords,
      exclamationCount,
      exclamationRatio: (exclamationCount / totalWords * 100).toFixed(1) + '%'
    }
  };
}

/**
 * Validate storyboard structure
 */
function validateStoryboard(storyboardContent) {
  const violations = [];
  let storyboard;

  try {
    storyboard = JSON.parse(storyboardContent);
  } catch (err) {
    return {
      pass: false,
      violations: [{
        rule: 'invalid-json',
        text: err.message,
        severity: 'error'
      }],
      totalDuration_ms: 0
    };
  }

  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) {
    violations.push({
      rule: 'missing-scenes',
      text: 'Storyboard must have "scenes" array',
      severity: 'error'
    });
  }

  // Validate transitions
  const validTransitions = ['cut', 'fade', 'crossfade', 'dissolve'];
  const sceneIds = new Set();
  let totalDuration = 0;

  if (Array.isArray(storyboard.scenes)) {
    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];

      // Check for duplicate IDs
      if (sceneIds.has(scene.id)) {
        violations.push({
          rule: 'duplicate-scene-id',
          line: i,
          text: `Scene ID "${scene.id}" is duplicated`,
          severity: 'error'
        });
      }
      sceneIds.add(scene.id);

      // Check transition type
      if (scene.transition && !validTransitions.includes(scene.transition)) {
        violations.push({
          rule: 'invalid-transition',
          line: i,
          text: `Invalid transition "${scene.transition}" - must be one of: ${validTransitions.join(', ')}`,
          severity: 'error'
        });
      }

      // Accumulate duration
      totalDuration += scene.duration || 5;

      // Check that visual exists
      if (!scene.visual) {
        violations.push({
          rule: 'missing-visual',
          line: i,
          text: `Scene ${scene.id} missing visual property`,
          severity: 'warning'
        });
      }

      // Check narration matches
      if (scene.narration && !scene.visual) {
        violations.push({
          rule: 'narration-without-visual',
          line: i,
          text: `Scene ${scene.id} has narration but no visual`,
          severity: 'warning'
        });
      }
    }
  }

  return {
    pass: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    totalDuration_ms: totalDuration * 1000,
    sceneCount: storyboard.scenes?.length || 0
  };
}

/**
 * Main validation function
 */
function main() {
  const args = parseArgs();

  if (!args['validate-script'] && !args['validate-storyboard']) {
    console.error(JSON.stringify({
      error: 'Specify either --validate-script <path> or --validate-storyboard <path>'
    }, null, 2));
    process.exit(1);
  }

  try {
    if (args['validate-script']) {
      const filePath = args['validate-script'];

      if (!fs.existsSync(filePath)) {
        throw new Error(`Script file not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const result = validateScript(content);

      console.log(JSON.stringify({
        type: 'script',
        pass: result.violations.filter(v => v.severity === 'error').length === 0,
        violations: result.violations,
        score: result.score,
        metrics: result.metrics
      }, null, 2));

      process.exit(result.violations.filter(v => v.severity === 'error').length === 0 ? 0 : 1);
    }

    if (args['validate-storyboard']) {
      const filePath = args['validate-storyboard'];

      if (!fs.existsSync(filePath)) {
        throw new Error(`Storyboard file not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const result = validateStoryboard(content);

      console.log(JSON.stringify({
        type: 'storyboard',
        pass: result.pass,
        violations: result.violations,
        totalDuration_ms: result.totalDuration_ms,
        sceneCount: result.sceneCount
      }, null, 2));

      process.exit(result.pass ? 0 : 1);
    }
  } catch (err) {
    console.error(JSON.stringify({
      error: err.message,
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

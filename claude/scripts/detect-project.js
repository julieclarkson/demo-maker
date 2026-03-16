#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Detects project type, language, framework, and start command
 * @param {string} projectRoot - Path to project root
 * @returns {object} Detection results
 */
function detectProject(projectRoot = process.cwd()) {
  const results = {
    name: path.basename(projectRoot),
    description: '',
    language: null,
    framework: null,
    type: null,
    startCommand: null,
    port: null,
    hasCaseStudy: false,
    hasGitLaunch: false,
    dependencies: [],
    fileCount: 0,
    mainEntry: null
  };

  try {
    // Check for .case-study/ directory
    results.hasCaseStudy = fs.existsSync(path.join(projectRoot, '.case-study'));

    // Check for git-launch/ directory
    results.hasGitLaunch = fs.existsSync(path.join(projectRoot, 'git-launch'));

    // Detect language by file frequency
    const files = walkDir(projectRoot, { maxDepth: 3, exclude: ['node_modules', '.git', 'dist', 'build'] });
    results.fileCount = files.length;

    const extensions = {};
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      extensions[ext] = (extensions[ext] || 0) + 1;
    });

    results.language = detectLanguage(extensions);

    // Read package.json if exists
    const packageJsonPath = path.join(projectRoot, 'package.json');
    let packageJson = null;
    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      results.name = packageJson.name || results.name;
      results.description = packageJson.description || '';
      results.dependencies = Object.keys(packageJson.dependencies || {});
    }

    // Detect framework
    results.framework = detectFramework(projectRoot, packageJson, extensions);

    // Detect project type
    results.type = detectProjectType(projectRoot, packageJson, results.framework);

    // Detect start command and port
    const startInfo = detectStartCommand(projectRoot, packageJson, results.framework);
    results.startCommand = startInfo.command;
    results.port = startInfo.port;

    // Detect main entry
    results.mainEntry = detectMainEntry(projectRoot, packageJson, results.language, results.framework);

    return results;
  } catch (err) {
    throw new Error(`Failed to detect project: ${err.message}`);
  }
}

/**
 * Recursively walk directory
 */
function walkDir(dir, options = {}) {
  const maxDepth = options.maxDepth || 3;
  const exclude = new Set(options.exclude || []);
  const results = [];

  function walk(currentPath, depth) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(currentPath);

      entries.forEach(entry => {
        if (exclude.has(entry)) return;

        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          results.push(fullPath);
        } else if (stat.isDirectory()) {
          walk(fullPath, depth + 1);
        }
      });
    } catch (err) {
      // Skip permission errors
    }
  }

  walk(dir, 0);
  return results;
}

/**
 * Detect primary language
 */
function detectLanguage(extensions) {
  const languageMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.java': 'java',
    '.cs': 'csharp',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala'
  };

  let maxCount = 0;
  let detected = null;

  Object.entries(extensions).forEach(([ext, count]) => {
    if (languageMap[ext] && count > maxCount) {
      maxCount = count;
      detected = languageMap[ext];
    }
  });

  return detected || 'javascript'; // Default to JS
}

/**
 * Detect framework/library
 */
function detectFramework(projectRoot, packageJson = null, extensions = {}) {
  const frameworkMarkers = {
    'next.config.js': 'next.js',
    'next.config.ts': 'next.js',
    'nuxt.config.js': 'nuxt',
    'nuxt.config.ts': 'nuxt',
    'vite.config.js': 'vite',
    'vite.config.ts': 'vite',
    'angular.json': 'angular',
    'ember-cli-build.js': 'ember',
    'webpack.config.js': 'webpack',
    'gatsby-config.js': 'gatsby',
    'Gemfile': 'rails',
    'go.mod': 'go',
    'Cargo.toml': 'rust',
    'setup.py': 'python',
    'pyproject.toml': 'python',
    'mix.exs': 'elixir'
  };

  // Check marker files
  for (const [marker, framework] of Object.entries(frameworkMarkers)) {
    if (fs.existsSync(path.join(projectRoot, marker))) {
      return framework;
    }
  }

  // Check package.json dependencies
  if (packageJson?.dependencies) {
    const deps = packageJson.dependencies;
    if (deps.next) return 'next.js';
    if (deps.nuxt) return 'nuxt';
    if (deps.react && deps['react-dom']) return 'react';
    if (deps.vue) return 'vue';
    if (deps.svelte) return 'svelte';
    if (deps.angular) return 'angular';
    if (deps.fastify) return 'fastify';
    if (deps.express) return 'express';
    if (deps.nestjs) return 'nestjs';
    if (deps.remix) return 'remix';
    if (deps.astro) return 'astro';
  }

  return null;
}

/**
 * Detect project type
 */
function detectProjectType(projectRoot, packageJson = null, framework = null) {
  // Check for specific markers
  if (fs.existsSync(path.join(projectRoot, 'src/pages')) ||
      fs.existsSync(path.join(projectRoot, 'pages')) ||
      fs.existsSync(path.join(projectRoot, 'app')) ||
      ['next.js', 'nuxt', 'react', 'vue', 'svelte', 'angular', 'gatsby', 'astro'].includes(framework)) {
    return 'web-app';
  }

  if (fs.existsSync(path.join(projectRoot, 'src/cli.js')) ||
      fs.existsSync(path.join(projectRoot, 'bin'))) {
    return 'cli-tool';
  }

  if (fs.existsSync(path.join(projectRoot, 'src/api')) ||
      ['express', 'fastify', 'nestjs'].includes(framework)) {
    return 'api';
  }

  if (fs.existsSync(path.join(projectRoot, 'electron.js')) ||
      fs.existsSync(path.join(projectRoot, 'public/electron.js'))) {
    return 'desktop-app';
  }

  // Check package.json
  if (packageJson?.main || packageJson?.exports) {
    return 'library';
  }

  if (packageJson?.keywords?.includes('plugin') ||
      packageJson?.name?.includes('plugin')) {
    return 'plugin';
  }

  // Default
  return packageJson?.private ? 'web-app' : 'library';
}

/**
 * Detect start command and port
 */
function detectStartCommand(projectRoot, packageJson = null, framework = null) {
  const result = {
    command: null,
    port: 3000
  };

  if (!packageJson?.scripts) {
    return result;
  }

  const scripts = packageJson.scripts;

  // Check for explicit start script
  if (scripts.start) {
    result.command = scripts.start;
  } else if (scripts.dev) {
    result.command = scripts.dev;
  } else if (scripts['dev:server']) {
    result.command = scripts['dev:server'];
  }

  // Detect port from command
  if (result.command) {
    const portMatch = result.command.match(/(?:--port|:|-p)\s*(\d+)/);
    if (portMatch) {
      result.port = parseInt(portMatch[1], 10);
    }
  }

  // Framework-specific defaults
  if (!result.command) {
    if (framework === 'next.js') {
      result.command = 'npm run dev';
      result.port = 3000;
    } else if (framework === 'nuxt') {
      result.command = 'npm run dev';
      result.port = 3000;
    } else if (framework === 'vite') {
      result.command = 'npm run dev';
      result.port = 5173;
    } else if (framework === 'react') {
      result.command = 'npm start';
      result.port = 3000;
    }
  }

  return result;
}

/**
 * Detect main entry point
 */
function detectMainEntry(projectRoot, packageJson = null, language = null, framework = null) {
  // Check package.json main
  if (packageJson?.main) {
    return packageJson.main;
  }

  // Framework-specific defaults
  const candidates = {
    'next.js': 'pages/index.js',
    'nuxt': 'pages/index.vue',
    'react': 'src/App.jsx',
    'vue': 'src/App.vue',
    'svelte': 'src/App.svelte',
    'angular': 'src/app/app.component.ts',
    'gatsby': 'src/pages/index.js',
    'astro': 'src/pages/index.astro'
  };

  if (framework && candidates[framework]) {
    const candidate = path.join(projectRoot, candidates[framework]);
    if (fs.existsSync(candidate)) {
      return candidates[framework];
    }
  }

  // Fallback checks
  const commonNames = ['index.js', 'index.ts', 'index.jsx', 'index.tsx', 'main.js', 'main.ts', 'app.js', 'app.ts'];
  for (const name of commonNames) {
    if (fs.existsSync(path.join(projectRoot, 'src', name))) {
      return path.join('src', name);
    }
    if (fs.existsSync(path.join(projectRoot, name))) {
      return name;
    }
  }

  return null;
}

// Export for use as module or CLI
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  try {
    const result = detectProject(projectRoot);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({
      error: err.message,
      stack: process.env.DEBUG ? err.stack : undefined
    }, null, 2));
    process.exit(1);
  }
}

module.exports = detectProject;

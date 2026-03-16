#!/usr/bin/env bash
# dm-init — Initialize Demo Maker for Cursor
# Usage: bash dm-init.sh [project-root]
#
# This script sets up Demo Maker in a Cursor project.
# It creates the .demo-maker/ directory and copies plugin files.

set -euo pipefail

PROJECT_ROOT="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DM_PLUGIN_DIR="$PROJECT_ROOT/.demo-maker-plugin"

echo "🎬 Demo Maker — Initializing..."
echo ""

# Copy plugin files to project
if [ ! -d "$DM_PLUGIN_DIR" ]; then
  echo "→ Copying Demo Maker plugin files..."
  mkdir -p "$DM_PLUGIN_DIR"
  cp -r "$SCRIPT_DIR/prompts" "$DM_PLUGIN_DIR/"
  cp -r "$SCRIPT_DIR/scripts" "$DM_PLUGIN_DIR/"
  cp -r "$SCRIPT_DIR/templates" "$DM_PLUGIN_DIR/"
  cp -r "$SCRIPT_DIR/config" "$DM_PLUGIN_DIR/"
  echo "  ✓ Plugin files copied to .demo-maker-plugin/"
else
  echo "  ✓ Plugin files already present"
fi

# Create working directories
echo "→ Creating .demo-maker/ directory..."
mkdir -p "$PROJECT_ROOT/.demo-maker/captures"
mkdir -p "$PROJECT_ROOT/.demo-maker/narration"
mkdir -p "$PROJECT_ROOT/.demo-maker/clips"

# Create config if it doesn't exist
CONFIG_FILE="$PROJECT_ROOT/.demo-maker/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'CONFIGEOF'
{
  "version": 1,
  "elevenLabs": {
    "apiKey": ""
  },
  "openai": {
    "apiKey": ""
  },
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "",
    "preset": "dev-casual"
  },
  "defaults": {
    "platform": "all",
    "tone": "storytelling",
    "focus": "end-to-end",
    "style": "developer-authentic",
    "resolution": "1920x1080"
  }
}
CONFIGEOF
  echo "  ✓ Config created at .demo-maker/config.json"
else
  echo "  ✓ Config already exists"
fi

# Update .gitignore
GITIGNORE="$PROJECT_ROOT/.gitignore"
if [ -f "$GITIGNORE" ]; then
  grep -qxF '.demo-maker/' "$GITIGNORE" || echo '.demo-maker/' >> "$GITIGNORE"
  grep -qxF 'demo-output/' "$GITIGNORE" || echo 'demo-output/' >> "$GITIGNORE"
  grep -qxF '.demo-maker-plugin/' "$GITIGNORE" || echo '.demo-maker-plugin/' >> "$GITIGNORE"
else
  printf '.demo-maker/\ndemo-output/\n.demo-maker-plugin/\n' > "$GITIGNORE"
fi
echo "  ✓ .gitignore updated"

# Run preflight
echo ""
echo "→ Running preflight checks..."
if command -v node &> /dev/null; then
  node "$DM_PLUGIN_DIR/scripts/preflight.js" 2>/dev/null || echo "  ⚠ Preflight had warnings (see above)"
else
  echo "  ⚠ Node.js not found. Install Node.js 18+ to use Demo Maker."
fi

echo ""
echo "✓ Demo Maker initialized!"
echo ""
echo "Next steps:"
echo "  1. Add your ElevenLabs API key to .demo-maker/config.json"
echo "  2. Tell Cursor: \"make a demo\" or \"run demo maker\""
echo ""
echo "Or for caption-only mode (no API key needed):"
echo "  Just tell Cursor: \"make a demo\" — it works without voice too."
echo ""

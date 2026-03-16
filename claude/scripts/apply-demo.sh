#!/usr/bin/env bash

# apply-demo.sh - Copy demo assets from OUTPUT/{run-id} to project root
# Usage: ./apply-demo.sh [--force]

set -e

FORCE=false
OUTPUT_BASE="OUTPUT"
PROJECT_ROOT="${PWD}"

# Find the most recent run folder (latest by timestamp)
DEMO_OUTPUT_DIR=$(find "$OUTPUT_BASE" -maxdepth 1 -type d -name "demo-*" -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -z "$DEMO_OUTPUT_DIR" ]; then
  echo "Error: No demo run folder found in $OUTPUT_BASE"
  exit 1
fi

# Parse arguments
for arg in "$@"; do
  case $arg in
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--force]"
      exit 1
      ;;
  esac
done

# Check if demo output directory exists
if [ ! -d "$DEMO_OUTPUT_DIR" ]; then
  echo "Error: Demo output directory not found: $DEMO_OUTPUT_DIR"
  exit 1
fi

# Determine target directories
if [ -d "demo" ]; then
  DEMO_DIR="demo"
else
  DEMO_DIR="."
fi

echo "=== Demo Maker - Apply Demo Assets ==="
echo "Source: $DEMO_OUTPUT_DIR"
echo "Target: $DEMO_DIR"
echo ""

# Function to copy file with overwrite check
copy_file() {
  local src="$1"
  local dst="$2"
  local name="$3"

  if [ ! -f "$src" ]; then
    return 0 # Source doesn't exist, skip
  fi

  if [ -f "$dst" ] && [ "$FORCE" != "true" ]; then
    echo "⊘ Skipped: $name (already exists, use --force to overwrite)"
    return 0
  fi

  # Ensure destination directory exists
  mkdir -p "$(dirname "$dst")"

  cp "$src" "$dst"
  local size=$(du -h "$src" | cut -f1)
  echo "✓ Copied: $name ($size)"
}

# Function to copy directory with overwrite check
copy_directory() {
  local src="$1"
  local dst="$2"
  local name="$3"

  if [ ! -d "$src" ]; then
    return 0 # Source doesn't exist, skip
  fi

  if [ -d "$dst" ] && [ "$FORCE" != "true" ]; then
    echo "⊘ Skipped: $name/ (already exists, use --force to overwrite)"
    return 0
  fi

  mkdir -p "$dst"
  cp -r "$src"/* "$dst/" 2>/dev/null || true

  local count=$(find "$src" -type f | wc -l)
  echo "✓ Copied: $name/ ($count files)"
}

# Copy video files
echo "Video Assets:"
copy_file "$DEMO_OUTPUT_DIR/demo.mp4" "$DEMO_DIR/demo.mp4" "demo.mp4"
copy_file "$DEMO_OUTPUT_DIR/demo.webm" "$DEMO_DIR/demo.webm" "demo.webm"

# Copy GIF files
echo ""
echo "GIF Assets:"
copy_file "$DEMO_OUTPUT_DIR/demo.gif" "$DEMO_DIR/demo.gif" "demo.gif"
copy_file "$DEMO_OUTPUT_DIR/demo-twitter.gif" "$DEMO_DIR/demo-twitter.gif" "demo-twitter.gif"
copy_file "$DEMO_OUTPUT_DIR/demo-github.gif" "$DEMO_DIR/demo-github.gif" "demo-github.gif"

# Copy captions
echo ""
echo "Captions:"
if [ -d "$DEMO_OUTPUT_DIR/captions" ]; then
  copy_directory "$DEMO_OUTPUT_DIR/captions" "$DEMO_DIR/captions" "captions"
else
  copy_file "$DEMO_OUTPUT_DIR/captions.srt" "$DEMO_DIR/captions.srt" "captions.srt"
fi

# Copy thumbnails
echo ""
echo "Thumbnails:"
if [ -d "$DEMO_OUTPUT_DIR/thumbnails" ]; then
  copy_directory "$DEMO_OUTPUT_DIR/thumbnails" "$DEMO_DIR/thumbnails" "thumbnails"
else
  copy_file "$DEMO_OUTPUT_DIR/thumbnail.jpg" "$DEMO_DIR/thumbnail.jpg" "thumbnail.jpg"
fi

# Copy script
echo ""
echo "Documentation:"
copy_file "$DEMO_OUTPUT_DIR/script.md" "$DEMO_DIR/DEMO_SCRIPT.md" "DEMO_SCRIPT.md"
copy_file "$DEMO_OUTPUT_DIR/storyboard.json" "$DEMO_DIR/storyboard.json" "storyboard.json"

# Copy platform-specific versions
echo ""
echo "Platform Versions:"
copy_file "$DEMO_OUTPUT_DIR/demo-twitter.mp4" "$DEMO_DIR/demo-twitter.mp4" "demo-twitter.mp4"
copy_file "$DEMO_OUTPUT_DIR/demo-producthunt.mp4" "$DEMO_DIR/demo-producthunt.mp4" "demo-producthunt.mp4"
copy_file "$DEMO_OUTPUT_DIR/demo-github.mp4" "$DEMO_DIR/demo-github.mp4" "demo-github.mp4"
copy_file "$DEMO_OUTPUT_DIR/demo-youtube.mp4" "$DEMO_DIR/demo-youtube.mp4" "demo-youtube.mp4"

# Summary
echo ""
echo "=== Summary ==="

if [ -d "$DEMO_DIR" ]; then
  VIDEO_COUNT=$(find "$DEMO_DIR" -maxdepth 1 -name "demo*.mp4" 2>/dev/null | wc -l)
  GIF_COUNT=$(find "$DEMO_DIR" -maxdepth 1 -name "demo*.gif" 2>/dev/null | wc -l)
  CAPTION_FILES=$(find "$DEMO_DIR/captions" -type f 2>/dev/null | wc -l)

  echo "✓ Video files: $VIDEO_COUNT"
  echo "✓ GIF files: $GIF_COUNT"
  echo "✓ Caption files: $CAPTION_FILES"

  if [ "$FORCE" == "true" ]; then
    echo "✓ Mode: Force overwrite enabled"
  else
    echo "ℹ Tip: Use --force flag to overwrite existing files"
  fi

  echo ""
  echo "✓ Demo assets ready to commit!"
  echo ""
  echo "Recommended next steps:"
  echo "  git add demo/ || git add demo*.* *.srt"
  echo "  git commit -m \"Add demo video and assets\""
else
  echo "✗ Failed to create demo directory"
  exit 1
fi

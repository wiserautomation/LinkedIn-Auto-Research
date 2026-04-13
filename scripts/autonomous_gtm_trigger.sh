#!/bin/bash
# autonomous_gtm_trigger.sh - Master Orchestrator for LinkedIn-Auto-Research
# =========================================================================
# This script is designed for CRON/LAUNCHD persistence.
# It ensures all paths are absolute and environment is loaded.

# Get current script directory for relative portability
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_DIR" || exit 1

# Environment-aware binaries
if [[ "$GITHUB_ACTIONS" == "true" ]]; then
    echo "☁️ Running in GitHub Cloud environment..." >> logs/cron.log
    NODE_BIN="$(which node)"
    export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome" # Standard GA path
else
    echo "🍎 Running in Local macOS environment..." >> logs/cron.log
    NODE_BIN="/Users/alejandropeghin/node-v22/bin/node"
    export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"
# Force load environment for sub-processes
if [ -f .env ]; then
    echo "⚙️  Loading environment from .env..." >> logs/cron.log
    set -a; source .env; set +a
fi

# Diagnostic: Verify critical keys (obfuscated)
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  WARNING: OPENROUTER_API_KEY is null in orchestrator!" >> logs/cron.log
else
    echo "✅ OPENROUTER_API_KEY detected (Length: ${#OPENROUTER_API_KEY})" >> logs/cron.log
fi

echo "🚀 [$(date)] Starting Autonomous GTM Strike..." >> logs/cron.log

# 1. Generate Lead Magnet Content
# Use a fresh temp log to avoid false positives from previous runs
RUN_LOG="logs/current_run.log"
/usr/bin/python3 scripts/lead_gen_agent.py > "$RUN_LOG" 2>&1
cat "$RUN_LOG" >> logs/cron.log

# --- CRITICAL VALIDATION ---
# Check if the generation actually succeeded in THIS specific run
# We check for the explicit success emoji/string which is only printed on SUCCESS.
if ! grep -q "✅ Lead Magnet generated" "$RUN_LOG"; then
    echo "❌ [$(date)] Content Generation FAILED. Full technical logs below:" >> logs/cron.log
    cat "$RUN_LOG" >> logs/cron.log
    cat "$RUN_LOG"
    "$NODE_BIN" scripts/discord_reporter.js "FAIL" "🔴 **CRITICAL: GTM Automation Blocked**
The Technical Agent failed to generate content. See GitHub Action logs for full traceback. Strike aborted."
    exit 1
fi

# 2. LinkedIn Multimedia Broadcast (with Visual Rotation)
IMG_INDEX=$(( ( $(date +%d) % 3 ) + 1 ))
THUMBNAIL_PATH="$PROJECT_DIR/assets/thumbnails/gallery_${IMG_INDEX}.png"

"$NODE_BIN" scripts/puppeteer_linkedin_post.js "$(cat logs/temp_post.txt)" "$THUMBNAIL_PATH" >> logs/cron.log 2>&1
if [ $? -eq 0 ]; then
    "$NODE_BIN" scripts/discord_reporter.js "LINKEDIN" "🚀 **LinkedIn technical Strike LIVE**
Title: $(head -n 1 logs/temp_post.txt)
SupraWall project presence confirmed on feed." "$THUMBNAIL_PATH"
fi

# 3. Expertise Engagement Loop
"$NODE_BIN" scripts/linkedin_commenter.js >> logs/cron.log 2>&1

# 4. X Strike Repurposing & Queue Filling
/usr/bin/python3 scripts/x_repurposer.py logs/temp_post.txt >> logs/cron.log 2>&1

if [ $? -eq 0 ]; then
    "$NODE_BIN" scripts/discord_reporter.js "X" "📅 **X Daily Queue Populated**
4 High-Magnitude Technical Strikes staged for staggered dispatch. Today's presence is secured."
fi

echo "✅ [$(date)] GTM Strike Cycle Complete." >> logs/cron.log
rm "$RUN_LOG"

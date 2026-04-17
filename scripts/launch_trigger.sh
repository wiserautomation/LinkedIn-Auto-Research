#!/bin/bash
PROJECT_DIR="/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research"
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$PROJECT_DIR" || exit 1
/bin/bash "$PROJECT_DIR/scripts/autonomous_gtm_trigger.sh"

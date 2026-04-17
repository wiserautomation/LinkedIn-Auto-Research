#!/bin/bash
# launchd_dispatcher_wrapper.sh
PROJECT_DIR="/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research"
cd "$PROJECT_DIR" || exit 1

# Explicitly set paths
export PATH="/Users/alejandropeghin/node-v22/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Load environment
if [ -f .env ]; then
    set -a; source .env; set +a
fi

# Execute dispatcher
/Users/alejandropeghin/node-v22/bin/node scripts/x_dispatcher.js >> logs/cron.log 2>&1

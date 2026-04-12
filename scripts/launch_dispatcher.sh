#!/bin/bash
PROJECT_DIR="/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research"
NODE_BIN="/Users/alejandropeghin/node-v22/bin/node"
cd "$PROJECT_DIR" || exit 1
"$NODE_BIN" "$PROJECT_DIR/scripts/x_dispatcher.js"

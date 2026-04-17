const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PROJECT_DIR = path.join(__dirname, '..');
const QUEUE_FILE = path.join(PROJECT_DIR, 'logs/x_queue.json');
const NODE_BIN = process.execPath;

async function dispatch() {
    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 No X queue found.");
        return;
    }

    let queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const now = new Date();
    let updated = false;

    for (let post of queue) {
        if (post.status === "pending" && new Date(post.scheduledTime) <= now) {
            console.log(`🚀 Dispatching X Strike ${post.id}...`);
            
            try {
                // Escape double quotes for shell execution
                const escapedContent = post.content.replace(/"/g, '\\"');
                const cmd = `"${NODE_BIN}" "${path.join(__dirname, 'puppeteer_x_post.js')}" "${escapedContent}"`;
                
                execSync(cmd, { cwd: PROJECT_DIR, stdio: 'inherit' });
                
                post.status = "posted";
                post.postedAt = now.toISOString();
                updated = true;

                // Send Discord Report
                const reportCmd = `"${NODE_BIN}" "${path.join(__dirname, 'discord_reporter.js')}" "X" "🐦 **X Staggered Strike LIVE**\nContent: ${post.content.substring(0, 100)}...\nCadence: Human-Staggered Verified."`;
                execSync(reportCmd, { cwd: PROJECT_DIR, stdio: 'inherit' });

                console.log(`✅ X Strike ${post.id} dispatched successfully.`);
                break; // Only one post per dispatcher run to keep timing natural
            } catch (err) {
                console.error(`❌ Dispatch failed for X Strike ${post.id}:`, err.message);
                // Optionally mark as failed or keep pending for retry
                break;
            }
        }
    }

    if (updated) {
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    } else {
        console.log("⏳ No pending strikes due for dispatch right now.");
    }
}

dispatch().catch(err => {
    console.error("🚨 Dispatcher Error:", err);
    process.exit(1);
});

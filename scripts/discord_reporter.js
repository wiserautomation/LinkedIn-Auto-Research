const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

// Map of channel identifiers to environmental webhook URLs
const WEBHOOK_MAP = {
    "LINKEDIN": process.env.DISCORD_WEBHOOK_LINKEDIN,
    "X": process.env.DISCORD_WEBHOOK_X,
    "SEO": process.env.DISCORD_WEBHOOK_SEO,
    "YOUTUBE": process.env.DISCORD_WEBHOOK_YOUTUBE,
    "ALARM": process.env.DISCORD_WEBHOOK_ALARM || process.env.DISCORD_WEBHOOK_LINKEDIN
};

async function sendReport(channel, message, imagePath = null) {
    let webhookUrl = WEBHOOK_MAP[channel.toUpperCase()];
    
    // Fallback: If specific channel is missing, use LINKEDIN channel for visibility
    if (!webhookUrl && channel.toUpperCase() !== "LINKEDIN") {
        console.warn(`⚠️ No webhook for ${channel}, falling back to LINKEDIN.`);
        webhookUrl = WEBHOOK_MAP["LINKEDIN"];
    }

    if (!webhookUrl) {
        console.error(`❌ No webhook defined for channel: ${channel} (and no LINKEDIN fallback found)`);
        process.exit(1);
    }

    try {
        const form = new FormData();
        form.append('payload_json', JSON.stringify({ content: message }));

        if (imagePath && fs.existsSync(imagePath)) {
            console.log(`📎 Attaching image: ${imagePath}`);
            form.append('file1', fs.createReadStream(imagePath));
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: form
        });

        if (!response.ok) {
            throw new Error(`Discord API returned ${response.status}: ${await response.text()}`);
        }
        
        console.log(`✅ Report sent successfully to ${channel}`);
    } catch (err) {
        console.error(`🚨 DISCORD ALARM: Failed to send report to ${channel}! Error: ${err.message}`);
        // If the primary report fails, try to send an alarm payload to the ALARM channel
        if (channel !== 'ALARM') {
            await sendReport('ALARM', `🚨 **SYSTEM ALARM** 🚨\nFailed to send report to ${channel}.\nError: ${err.message}`);
        }
        process.exit(1); // Force the GitHub Acton to fail
    }
}

if (require.main === module) {
    const channel = process.argv[2] || "LINKEDIN";
    const message = process.argv[3] || "Status Update";
    const imagePath = process.argv[4] || null;

    sendReport(channel, message, imagePath).catch(e => {
        console.error(e);
        process.exit(1);
    });
}

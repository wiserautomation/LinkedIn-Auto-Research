const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GITHUB_PAT = process.env.GITHUB_PAT;
const REPO_OWNER = "wiserautomation";
const REPO_NAME = "LinkedIn-Auto-Research";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`🤖 SupraWall Command Bridge ACTIVE as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const content = message.content.toLowerCase().trim();

    // Command handling
    if (content === '!strike') {
        await message.reply("🚀 **Command Received**: Triggering high-magnitude Technical Strike...");
        await triggerGithubAction('strike');
    } 
    else if (content === '!status') {
        await message.reply("📡 **Checking Cloud Pulse**...");
        await triggerGithubAction('status');
    }
});

async function triggerGithubAction(command) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'discord_cmd',
                client_payload: { command }
            })
        });

        if (response.ok) {
            console.log(`✅ GitHub Dispatch Successful: ${command}`);
        } else {
            const errBody = await response.text();
            console.error(`❌ GitHub Dispatch Failed: ${response.status} - ${errBody}`);
        }
    } catch (err) {
        console.error(`🚨 Fatal Bridge Error: ${err.message}`);
    }
}

client.login(DISCORD_TOKEN);

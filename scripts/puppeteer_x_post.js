const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const AUTH_FILE = path.join(__dirname, '../assets/auth/x_auth.json');

async function postToXStealth(text) {
    console.log("🚀 Initializing Invisible-Strike X-Agent...");
    
    // Create an invisible 'salt' using Zero-Width Space characters (\u200B)
    // This makes the string unique to X's DB but invisible to humans.
    const saltCount = Math.floor(Math.random() * 15) + 1;
    const invisibleSalt = "\u200B".repeat(saltCount);
    const uniqueText = `${text}${invisibleSalt}`;
    const encodedText = encodeURIComponent(uniqueText);

    console.log(`📡 Using Browser: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'SYSTEM_DEFAULT'}`);
    const launchOptions = {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // Set a common desktop user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1440, height: 1200 });

    try {
        // 1. Load Cookies (File or Env)
        let cookies;
        if (process.env.X_AUTH_JSON) {
            console.log("📡 Rehydrating X session from Environment Secrets...");
            cookies = JSON.parse(process.env.X_AUTH_JSON);
        } else if (fs.existsSync(AUTH_FILE)) {
            console.log("📡 Loading X session from Local Auth File...");
            cookies = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
        } else {
            throw new Error("❌ X Auth credentials missing (checked X_AUTH_JSON and auth file).");
        }
        await page.setCookie(...cookies);

        console.log("📡 Navigating to X Intent (Stealth Mode)...");
        await page.goto(`https://x.com/intent/tweet?text=${encodedText}`, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        // Random human-like delay
        await new Promise(r => setTimeout(r, 8000 + Math.random() * 5000));

        console.log("🛠️ Locating Intent Post button...");
        const postBtnSelector = '[data-testid="tweetButton"]';
        await page.waitForSelector(postBtnSelector, { timeout: 20000 });
        
        // Move mouse to button for "human" flavor
        const rect = await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            const { x, y, width, height } = el.getBoundingClientRect();
            return { x: x + width / 2, y: y + height / 2 };
        }, postBtnSelector);
        
        await page.mouse.move(rect.x, rect.y);
        await new Promise(r => setTimeout(r, 500));
        
        console.log("📤 Clicking Intent Post button...");
        await page.click(postBtnSelector);
        
        console.log("🚀 Submission triggered. Waiting for confirmation...");
        await new Promise(r => setTimeout(r, 15000));

        const postScreenshot = path.join(__dirname, '../logs/x_stealth_proof.png');
        await page.screenshot({ path: postScreenshot });
        
        // Final verification check for the "Something went wrong" toast
        const hasError = await page.evaluate(() => {
            return document.body.innerText.includes("Something went wrong") || 
                   document.body.innerText.includes("Wait a minute");
        });

        if (hasError) {
            throw new Error("X rejected the submission even in Stealth mode.");
        }

        // Report to Discord
        try {
            const webhook = process.env.DISCORD_WEBHOOK_X || process.env.DISCORD_WEBHOOK_LINKEDIN;
            if (webhook) {
                // Sanitize message for shell (remove newlines and quotes)
                const sanitizedMsg = `🐦 **X Stealth Strike Verified**\nContent: "${text.substring(0, 150).replace(/\n/g, ' ').replace(/"/g, '')}..."`;
                const reporterPath = path.join(__dirname, 'discord_reporter.js');
                execSync(`"${process.execPath}" "${reporterPath}" "X" "${sanitizedMsg}" "${postScreenshot}"`, { stdio: 'inherit' });
                console.log("✅ Evidence shipped to Discord.");
            }
        } catch (discordErr) {
            console.warn(`⚠️ Discord reporting failed: ${discordErr.message}`);
        }

        await browser.close();
        console.log("🎉 Stealth X Strike Complete.");
    } catch (err) {
        console.error(`❌ Stealth X Posting Error: ${err.message}`);
        const errPath = path.join(__dirname, '../logs/x_stealth_error.png');
        await page.screenshot({ path: errPath });
        await browser.close();
        process.exit(1);
    }
}

if (require.main === module) {
    const text = process.argv[2] || "Establishing agentic security protocols. #AIAgents";
    postToXStealth(text).catch(e => {
        console.error(e);
        process.exit(1);
    });
}

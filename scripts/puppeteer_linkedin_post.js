// puppeteer_linkedin_post.js - Direct LinkedIn Publishing (No-SaaS)
// =============================================================
// Uses local browser automation to post content directly using session cookies.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function publishPost(text, videoPath) {
  console.log("🚀 Starting Native LinkedIn Post...");

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Load Cookies
    if (!fs.existsSync(AUTH_FILE)) throw new Error("Auth file missing.");
    const cookies = JSON.parse(fs.readFileSync(AUTH_FILE));
    await page.setCookie(...cookies);

    // 2. Navigate to Feed
    console.log("📡 Navigating to LinkedIn Feed...");
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });

    // Check if logged in
    const loginCheck = await page.$('.feed-identity-module');
    if (!loginCheck) throw new Error("❌ Session expired or Login required.");

    // 3. Open Post Box
    console.log("📝 Opening post box...");
    await page.click('.share-box-feed-entry__trigger');
    await page.waitForSelector('.ql-editor', { visible: true });

    // 4. Upload Video (if provided)
    if (videoPath && fs.existsSync(videoPath)) {
      console.log(`🎞️ Uploading video: ${videoPath}...`);
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('button[aria-label="Add a video"]')
      ]);
      await fileChooser.accept([videoPath]);
      await page.waitForSelector('button.share-box-video-editor__done-button', { visible: true });
      await page.click('button.share-box-video-editor__done-button');
    }

    // 5. Type Text
    console.log("✍️ Typing content...");
    await page.type('.ql-editor', text);

    // 6. Post
    console.log("📤 Publishing...");
    await page.click('.share-actions__post-button');
    await page.waitForSelector('.artdeco-toast-item', { timeout: 10000 }).catch(() => {});

    console.log("✅ LinkedIn Post Published Successfully.");
    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ Native Posting Error: ${err.message}`);
    await page.screenshot({ path: path.join(__dirname, '../logs/post_fail.png') });
    await browser.close();
    return false;
  }
}

if (require.main === module) {
  const text = process.argv[2] || "SupraWall Native Insight: Deterministic tool-calls are the future.";
  const video = process.argv[3] || "";
  publishPost(text, video).then(console.log).catch(console.error);
}

// puppeteer_linkedin_metrics.js - Direct LinkedIn Scraping (No-SaaS)
// ==============================================================
// Uses local browser automation to extract performance data for LinkedIn posts.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function getPostMetrics(postUrl) {
  console.log(`🚀 Starting Native Metric Collection for: ${postUrl}...`);

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Load Cookies
    if (!fs.existsSync(AUTH_FILE)) throw new Error("Auth file missing.");
    const cookies = JSON.parse(fs.readFileSync(AUTH_FILE));
    await page.setCookie(...cookies);

    // 2. Navigate to Post Analytics
    // Note: append /analytics to the LinkedIn post URL for the detail view
    const analyticsUrl = postUrl.endsWith('/') ? `${postUrl}analytics` : `${postUrl}/analytics`;
    console.log(`📡 Navigating to Analytics: ${analyticsUrl}...`);
    await page.goto(analyticsUrl, { waitUntil: 'networkidle2' });

    // 3. Extract Data
    // Selector for Impressions: .analytics-details-module__stat-count
    // Selector for Reactions: .analytics-details-module__reaction-count
    
    // We'll use a more general approach to find numbers on the page
    const metrics = await page.evaluate(() => {
        const stats = document.querySelectorAll('.analytics-details-module__stat-count');
        const impressionsText = stats[0] ? stats[0].innerText : "0";
        const reactionText = document.querySelector('.analytics-details-module__reaction-count')?.innerText || "0";
        const shareText = document.querySelector('.analytics-details-module__share-count')?.innerText || "0";
        
        return {
            impressions: parseInt(impressionsText.replace(/[^\d]/g, '')) || 0,
            reactions: parseInt(reactionText.replace(/[^\d]/g, '')) || 0,
            shares: parseInt(shareText.replace(/[^\d]/g, '')) || 0
        };
    });

    console.log(`✅ Metrics Extracted: ${JSON.stringify(metrics)}`);
    await browser.close();
    return metrics;
  } catch (err) {
    console.error(`❌ Native Metric Error: ${err.message}`);
    await page.screenshot({ path: path.join(__dirname, '../logs/metrics_fail.png') });
    await browser.close();
    return null;
  }
}

if (require.main === module) {
  const url = process.argv[2] || "https://www.linkedin.com/posts/activity-7187123456789012345";
  getPostMetrics(url).then(console.log).catch(console.error);
}

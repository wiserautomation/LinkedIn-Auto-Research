const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("Connecting to active browser on port 9222...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    const pages = await browser.pages();
    
    // Find a LinkedIn tab or open one
    let page = pages.find(p => p.url().includes('linkedin.com'));
    if (!page) {
        page = await browser.newPage();
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 5000));
    }
    
    // Get cookies for .linkedin.com
    console.log("Extracting cookies...");
    const cookies = await page.cookies('https://www.linkedin.com');
    
    const authPath = path.join(__dirname, '../assets/auth/linkedin_auth.json');
    fs.writeFileSync(authPath, JSON.stringify(cookies, null, 2));
    
    console.log(`✅ Saved ${cookies.length} fresh cookies to ${authPath}`);
    await browser.disconnect();
}

run().catch(console.error);

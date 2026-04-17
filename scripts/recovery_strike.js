const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function recoveryStrike() {
    const textPath = '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/temp_post.txt';
    const text = fs.readFileSync(textPath, 'utf8');

    console.log("🚀 Emergency Recovery: Clicking 'Next' and Typing...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    let page;
    
    try {
        const pages = await browser.pages();
        page = pages.find(p => p.url().includes('linkedin.com/feed')) || pages[0];
        await page.bringToFront();

        // 1. Click "Next" at approximate coordinates (bottom right of modal)
        // From screenshot 1440x900, modal is centered. 
        // Next button is around x=840, y=786.
        console.log("🖱️ Clicking 'Next' via coordinates...");
        await page.mouse.click(840, 786);
        await new Promise(r => setTimeout(r, 3000));

        // 2. Input Text
        console.log("✍️ Typing content...");
        const editorSelector = '.ql-editor, [contenteditable="true"]';
        await page.waitForSelector(editorSelector, { timeout: 10000 });
        await page.focus(editorSelector);
        await page.keyboard.type(text, { delay: 1 });
        
        // 3. Post
        console.log("📤 Publishing via Ctrl+Enter...");
        await new Promise(r => setTimeout(r, 4000));
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');

        console.log("✅ Strike sequence finish.");
        await new Promise(r => setTimeout(r, 10000));
        await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/RECOVERY_STRIKE_CONFIRMED.png' });

    } catch (e) {
        console.error("❌ Recovery Failed:", e.message);
        if (page) await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/RECOVERY_FAIL.png' });
    } finally {
        await browser.disconnect();
    }
}

recoveryStrike();

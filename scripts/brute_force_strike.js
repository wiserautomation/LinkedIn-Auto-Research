const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function finalBruteForce() {
    const textPath = '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/temp_post.txt';
    const text = fs.readFileSync(textPath, 'utf8');

    console.log("🚀 FINAL BRUTE FORCE STRIKE...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    let page;
    
    try {
        const pages = await browser.pages();
        page = pages.find(p => p.url().includes('linkedin.com/feed')) || pages[0];
        await page.bringToFront();

        console.log("🖱️ Clicking 'Next' via focused evaluation...");
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const next = btns.find(b => b.innerText.includes('Next') || b.innerText.includes('Done'));
            if (next) {
                next.focus();
                next.click();
            }
        });
        await new Promise(r => setTimeout(r, 4000));

        console.log("✍️ Typing content...");
        const editorSelector = '.ql-editor, [contenteditable="true"]';
        await page.waitForSelector(editorSelector, { timeout: 10000 });
        await page.focus(editorSelector);
        await page.keyboard.type(text, { delay: 1 });
        
        console.log("📤 Publishing...");
        await new Promise(r => setTimeout(r, 5000));
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
            const post = btns.find(b => b.innerText.trim() === 'Post');
            if (post) post.click();
        });
        
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');

        console.log("✅ Final Strike Sequence complete.");
        await new Promise(r => setTimeout(r, 10000));
        await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/BRUTE_FORCE_FINAL.png' });

    } catch (e) {
        console.error("❌ Brute Force Failed:", e.message);
        if (page) await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/BRUTE_FORCE_FAIL.png' });
    } finally {
        await browser.disconnect();
    }
}

finalBruteForce();

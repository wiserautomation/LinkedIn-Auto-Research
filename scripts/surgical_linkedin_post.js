const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runSurgicalStrike() {
    const textPath = '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/temp_post.txt';
    const mediaPath = '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/assets/thumbnails/deterministic_proof_strike.png';
    const text = fs.readFileSync(textPath, 'utf8');

    console.log("🚀 Starting Coordinate Strike (Final Hardened Method)...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    let page;
    
    try {
        const pages = await browser.pages();
        page = pages.find(p => p.url().includes('linkedin.com/feed')) || pages[0];
        
        console.log("📡 Target Locked:", page.url());
        await page.bringToFront();

        // 1. Reset Modals
        console.log("🔄 Resetting state...");
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 1000));
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 2000));

        // 2. Click "Photo" directly (Coordinate: 536, 164)
        console.log("📸 Clicking 'Photo' icon via coordinates...");
        await page.mouse.click(536, 164);
        
        // 3. Handle File Input (Wait for it to appear in modal)
        console.log("🖼️ Uploading Media...");
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser({ timeout: 15000 }),
            page.evaluate(() => { 
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Upload') || b.ariaLabel && b.ariaLabel.includes('photo'));
                if (btn) btn.click();
                else console.log('Button not found via selector, relying on file input search...');
                return true; 
            })
        ]);
        await fileChooser.accept([mediaPath]);
        
        // 4. Click "Done" (wait for it)
        console.log("⏳ Verification...");
        await new Promise(r => setTimeout(r, 5000));
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const doneBtn = btns.find(b => b.innerText.includes('Done') || b.innerText.includes('Next'));
            if (doneBtn) doneBtn.click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 5. Input Text
        console.log("✍️ Typing Content...");
        const editorSelector = '.ql-editor, [contenteditable="true"]';
        await page.waitForSelector(editorSelector, { timeout: 10000 });
        await page.click(editorSelector);
        await page.keyboard.type(text, { delay: 1 });
        
        // 6. Post
        console.log("📤 Publishing...");
        await new Promise(r => setTimeout(r, 3000));
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
            const postBtn = btns.find(b => b.innerText.trim() === 'Post');
            if (postBtn) postBtn.click();
        });
        
        // Fallback shortcut 
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');

        console.log("✅ Strike Sequence Complete.");
        await new Promise(r => setTimeout(r, 10000));
        await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/COORDINATE_STRIKE_CONFIRMED.png' });

    } catch (e) {
        console.error("❌ Strike Failed:", e.message);
        if (page) await page.screenshot({ path: '/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/COORDINATE_STRIKE_FAIL.png' });
        process.exit(1);
    } finally {
        await browser.disconnect();
    }
}

runSurgicalStrike();

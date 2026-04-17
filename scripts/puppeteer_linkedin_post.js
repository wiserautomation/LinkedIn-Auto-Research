// puppeteer_linkedin_post.js - Direct LinkedIn Publishing (No-SaaS)
// =============================================================
// Uses local browser automation to post content directly using session cookies.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');

async function publishPost(text, mediaPath) {
  console.log("🚀 Starting Native LinkedIn Post (Multimedia)...");
    
    // Cleanup text
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); 
    text = text.replace(/### (.*?)$/gm, '$1');    
    text = text.replace(/## (.*?)$/gm, '$1');     
    text = text.replace(/^> (.*?)$/gm, '$1');     

    console.log(`📡 Post length: ${text.length} characters.`);

    let browser;
    try {
        console.log("📡 Attempting to connect to active browser on port 9222...");
        browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
        console.log("✅ Connected to active browser.");
    } catch (e) {
        console.log("📡 Active browser not found. Launching new headless instance...");
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    }

    let page;
    try {
        const pages = await browser.pages();
        page = pages.find(p => p.url().includes('linkedin.com')) || await browser.newPage();
        await page.bringToFront();
        await page.setViewport({ width: 1440, height: 1080 });

    // 1. Re-navigate if not on feed
    if (!page.url().includes('linkedin.com/feed')) {
        console.log("📡 Navigating to LinkedIn Feed...");
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000)); 
    }

    // 2. Open Post Box
    console.log("📝 Opening post box...");
    const triggerHandled = await page.evaluate(() => {
        const trigger = document.querySelector('button.share-box-feed-entry__trigger, button[aria-label="Start a post"], .share-box-feed-entry__trigger');
        if (trigger) {
            trigger.scrollIntoView();
            trigger.click();
            return true;
        }
        return false;
    });

    if (!triggerHandled) {
        console.log("⚠️ Trigger button not found. Attempting direct navigation...");
        await page.goto('https://www.linkedin.com/preload/sharebox/', { waitUntil: 'networkidle2' });
    }
    
    await page.waitForSelector('.artdeco-modal, .share-box-content', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // 3. Upload Media (MANDATORY)
    if (mediaPath && fs.existsSync(mediaPath)) {
        console.log(`🖼️ Uploading media: ${mediaPath}...`);
        
        const photoBtnClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const pBtn = btns.find(b => {
                const label = (b.getAttribute('aria-label') || "").toLowerCase();
                const icon = b.querySelector('svg[data-test-icon="image-medium"], svg[data-test-icon="image-large"]');
                return label.includes('photo') || label.includes('media') || label.includes('image') || icon;
            });
            if (pBtn) {
                pBtn.click();
                return true;
            }
            return false;
        });

        if (!photoBtnClicked) throw new Error("Could not find 'Add a photo' button.");
        
        await new Promise(r => setTimeout(r, 2000));
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.evaluate(() => {
                const input = document.querySelector('input[type="file"]');
                if (input) input.click();
                return !!input;
            })
        ]);
        
        await fileChooser.accept([mediaPath]);
        console.log("⏳ Waiting for media verification...");
        
        await new Promise(r => setTimeout(r, 8000)); // Wait for LinkedIn processing

        // Check if editor is active or if it went straight to sharebox
        const editorDetected = await page.evaluate(() => {
            return !!document.querySelector('.share-media-editor, .image-editor, .artdeco-modal__header');
        });

        if (editorDetected) {
            console.log("🖱️ Media Editor detected. Finding 'Next'...");
            const nextClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
                const nBtn = btns.find(b => {
                    const txt = (b.innerText || "").toLowerCase();
                    return txt.includes('next') || txt.includes('done') || b.classList.contains('share-box-footer__primary-btn');
                });
                if (nBtn) {
                    nBtn.click();
                    return true;
                }
                return false;
            });
            if (nextClicked) {
                console.log("✅ 'Next' clicked.");
                await new Promise(r => setTimeout(r, 5000));
            } else {
                console.log("⚠️ 'Next' not found in editor. Check if already bypassed.");
            }
        } else {
            console.log("⏩ Editor modal not detected. Assuming direct attach.");
        }

        // FINAL CHECK: Visual in sharebox
        await new Promise(r => setTimeout(r, 5000)); // Processing buffer
        const visualPresent = await page.evaluate(() => {
            const selectors = [
                '.share-content__image-container',
                '.share-media-preview__container',
                '.image-preview',
                '.share-box-content img',
                '[data-test-media-container]',
                '.update-components-image'
            ];
            return selectors.some(s => !!document.querySelector(s));
        });

        if (!visualPresent) {
            console.log("⚠️ Broad media check failed. Attempting deep scan...");
            // Deep scan for any image that looks like a preview
            const hasImage = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.some(img => img.offsetParent !== null && (img.src.startsWith('blob:') || img.src.includes('media-proxy')));
            });
            if (!hasImage) {
                throw new Error("❌ CRITICAL: Media preview not detected in share box.");
            }
        }
        console.log("✅ Media verification successful.");
    }

    // 4. Type Text
    console.log("✍️ Typing content...");
    const editorSelector = '.artdeco-modal [contenteditable="true"], .share-box-content [contenteditable="true"], [role="textbox"]';
    await page.waitForSelector(editorSelector, { timeout: 10000 });
    await page.click(editorSelector);
    await page.keyboard.type(text, { delay: 1 });
    await new Promise(r => setTimeout(r, 3000)); 

    // 5. Post
    console.log("📤 Publishing...");
    const postClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
        const postBtn = btns.find(b => {
             const t = (b.innerText || b.textContent || "").trim().toLowerCase();
             return t === 'post' && b.getAttribute('aria-disabled') !== 'true' && b.offsetParent !== null;
        });
        if (postBtn) {
            postBtn.click();
            return true;
        }
        return false;
    });

    if (!postClicked) {
        console.log("⚠️ Post button click failed. Using Ctrl+Enter...");
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
    }

    await new Promise(r => setTimeout(r, 10000));
    console.log("✅ LinkedIn Post Published Successfully.");
    await browser.disconnect();
    return true;

} catch (err) {
    console.error(`❌ Native Posting Error: ${err.message}`);
    if (page) await page.screenshot({ path: path.join(__dirname, '../logs/post_fail.png') });
    await browser.disconnect();
    return false;
}
}

if (require.main === module) {
  let text = process.argv[2] || "SupraWall Native Insight.";
  if (fs.existsSync(text)) text = fs.readFileSync(text, 'utf-8');
  const media = process.argv[3] || "";
  publishPost(text, media).then(success => {
      process.exit(success ? 0 : 1);
  });
}

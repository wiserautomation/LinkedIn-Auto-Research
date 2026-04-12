// puppeteer_linkedin_post.js - Direct LinkedIn Publishing (No-SaaS)
// =============================================================
// Uses local browser automation to post content directly using session cookies.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

async function publishPost(text, mediaPath) {
  console.log("🚀 Starting Native LinkedIn Post (Multimedia)...");
  const modalEditorSelector = '.artdeco-modal [contenteditable="true"], .share-box-content [contenteditable="true"], [role="textbox"], .ql-editor';

    // 0. Cleanup text (remove raw markdown syntax for LinkedIn art piece)
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold asterisks
    text = text.replace(/### (.*?)$/gm, '$1');    // Remove H3 symbols
    text = text.replace(/## (.*?)$/gm, '$1');     // Remove H2 symbols
    text = text.replace(/^> (.*?)$/gm, '$1');     // Remove blockquote symbols

    console.log(`📡 Post length: ${text.length} characters.`);

    const launchOptions = {
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 3000 }); // ULTRA TALL VIEWPORT

    // 1. Load Cookies (File or Env)
    let cookies;
    if (process.env.LINKEDIN_AUTH_JSON) {
      console.log("📡 Rehydrating session from Environment Secrets...");
      cookies = JSON.parse(process.env.LINKEDIN_AUTH_JSON);
    } else if (fs.existsSync(AUTH_FILE)) {
      console.log("📡 Loading session from Local Auth File...");
      cookies = JSON.parse(fs.readFileSync(AUTH_FILE));
    } else {
      throw new Error("❌ Auth credentials missing (checked LINKEDIN_AUTH_JSON and auth file).");
    }
    await page.setCookie(...cookies);

    // 2. Navigate to Feed
    console.log("📡 Navigating to LinkedIn Feed...");
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000)); 

    // 3. Open Post Box
    console.log("📝 Opening post box...");
    try {
        const triggerSelector = 'a[href*="sharebox"], button.share-box-feed-entry__trigger, [aria-label="Start a post"]';
        const trigger = await page.$(triggerSelector);
        if (trigger) {
            await trigger.click();
        } else {
            await page.goto('https://www.linkedin.com/preload/sharebox/', { waitUntil: 'networkidle2' });
        }
        await new Promise(r => setTimeout(r, 8000));
        
        // Double check: if modal not open, force it
        const modalOpen = await page.evaluate(() => !!document.querySelector('.artdeco-modal'));
        if (!modalOpen) {
            await page.goto('https://www.linkedin.com/preload/sharebox/', { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 8000));
        }
    } catch (e) {
        throw new Error(`❌ Modal did not open: ${e.message}.`);
    }

    // 4. Upload Media (if provided)
    if (mediaPath && fs.existsSync(mediaPath)) {
        console.log(`🖼️ Uploading media: ${mediaPath}...`);
        try {
            // Find the photo button by logic (icon containing 'image' or label 'photo')
            const photoBtn = await page.evaluateHandle(() => {
                const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
                return btns.find(b => {
                    const label = (b.getAttribute('aria-label') || "").toLowerCase();
                    const icon = b.querySelector('li-icon[type="image-icon"], .artdeco-button__icon[type="image-icon"]');
                    return label.includes('photo') || label.includes('media') || icon;
                });
            });

            if (!photoBtn) throw new Error("Could not find 'Add a photo' button.");
            
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                photoBtn.click(),
            ]);
            
            await fileChooser.accept([mediaPath]);
            console.log("⏳ Waiting for media processing...");
            await new Promise(r => setTimeout(r, 10000));
            
            // Confirm/Done in media editor
            const doneBtnSelector = '.share-media-editor__next-button, .artdeco-button--primary, button:not([disabled])';
            await page.waitForSelector(doneBtnSelector, { visible: true, timeout: 15000 });
            
            const doneBtn = await page.evaluateHandle(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                return btns.find(b => {
                    const t = (b.innerText || "").trim().toLowerCase();
                    return (t === 'next' || t === 'done' || t === 'post') && !b.disabled;
                });
            });
            
            if (doneBtn) {
                await doneBtn.click();
            } else {
                await page.click(doneBtnSelector);
            }
            
            console.log("✅ Media attached.");
            await new Promise(r => setTimeout(r, 5000));
        } catch (uploadErr) {
            console.error(`⚠️ Media Upload Failed: ${uploadErr.message}. Continuing with text-only...`);
            await page.screenshot({ path: path.join(__dirname, '../logs/media_upload_fail_v2.png') });
        }
    }

    // 5. Type Text
    console.log("✍️ Typing content...");
    const focused = await page.evaluate((sel) => {
        const el = document.querySelector(sel) || document.activeElement;
        if (el && (el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox' || el.classList.contains('ql-editor'))) {
            el.innerHTML = ''; 
            el.focus();
            return true;
        }
        return false;
    }, modalEditorSelector);
    
    if (!focused) throw new Error("❌ Could not find/focus editor.");
    
    await page.keyboard.type(text, { delay: 1 });
    await new Promise(r => setTimeout(r, 10000)); 
    await page.screenshot({ path: path.join(__dirname, '../logs/debug_post_final_v2.png') });

    // 6. Post
    console.log("📤 Publishing...");
    
    // Universal shortcuts
    await page.keyboard.down('Meta');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Meta');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 2000));

    // Fallback Mouse Click
    const rect = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.artdeco-modal button'));
        const postBtn = btns.find(b => {
             const t = (b.innerText || "").trim().toLowerCase();
             return t === 'post' && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
        });
        if (postBtn) {
            const b = postBtn.getBoundingClientRect();
            return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        }
        return null;
    });

    if (rect) {
        await page.mouse.click(rect.x, rect.y);
    }
    
    console.log("⏳ Finalizing...");
    await new Promise(r => setTimeout(r, 15000)); 
    
    let postUrl = await page.evaluate(() => {
        const toast = document.querySelector('.artdeco-toast-item a[href*="/feed/update/"]');
        return toast ? toast.href : null;
    });
    
    if (!postUrl) {
        console.log("🔍 Toast missed. Falling back to profile activity...");
        try {
            await page.goto('https://www.linkedin.com/in/alejandro-paris-1a4b92399/recent-activity/shares/', { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 5000));
            postUrl = await page.evaluate(() => {
                const firstShare = document.querySelector('.social-details-reactors--is-shared-update a[href*="/feed/update/"], .feed-shared-update-v2 a[href*="/feed/update/"]');
                return firstShare ? firstShare.href : null;
            });
        } catch (err) {
            console.log("⚠️ Activity fallback failed.");
        }
    }
    
    if (postUrl) {
         fs.writeFileSync(path.join(__dirname, '../logs/last_post_url.txt'), postUrl);
         console.log(`🔗 Post URL captured: ${postUrl}`);
    } else {
         fs.writeFileSync(path.join(__dirname, '../logs/last_post_url.txt'), 'https://www.linkedin.com/feed/');
    }

    console.log("✅ LinkedIn Post Published Successfully.");
    await browser.close();
    return true;
} catch (err) {
    console.error(`❌ Native Posting Error: ${err.message}`);
    if (page) await page.screenshot({ path: path.join(__dirname, '../logs/post_fail.png') });
    await browser.close();
    return false;
}
}

if (require.main === module) {
  let text = process.argv[2] || "SupraWall Native Insight: Deterministic tool-calls are the future.";
  if (fs.existsSync(text)) {
    text = fs.readFileSync(text, 'utf-8');
  }
  const media = process.argv[3] || "";
  publishPost(text, media).then(console.log).catch(console.error);
}

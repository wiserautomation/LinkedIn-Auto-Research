const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("Connecting to active browser...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    const pages = await browser.pages();
    
    // Find the LinkedIn activity tab
    let page = pages.find(p => p.url().includes('linkedin.com/in/') || p.url().includes('linkedin.com/feed'));
    if (!page) { page = await browser.newPage(); }
    await page.bringToFront();
    
    // DEL OLD POST
    console.log("Navigating to Activity...");
    await page.goto('https://www.linkedin.com/in/alejandro-paris-1a4b92399/recent-activity/all/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000));
    
    console.log("Looking for post to delete...");
    await page.evaluate(() => {
        const dotsBtn = document.querySelectorAll('.feed-shared-control-menu__trigger')[0];
        if (dotsBtn) dotsBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.feed-shared-control-menu__item span'));
        const delSpan = spans.find(span => span.innerText.includes('Delete post'));
        if(delSpan && delSpan.closest('div[role="button"], li')) {
            delSpan.closest('div[role="button"], li').click();
        }
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.artdeco-modal button'));
        const confirm = btns.find(b => b.innerText.includes('Delete'));
        if(confirm) confirm.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // NEW POST
    console.log("Navigating to Feed to create post...");
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000));
    
    console.log("Opening post box...");
    await page.evaluate(() => {
        const trigger = document.querySelector('a[href*="sharebox"], button.share-box-feed-entry__trigger, [aria-label="Start a post"]');
        if (trigger) trigger.click();
    });
    await new Promise(r => setTimeout(r, 5000));
    
    const mediaPath = path.join(__dirname, '../assets/thumbnails/gallery_3.png');
    console.log(`Uploading media: ${mediaPath}`);
    
    // Upload via input type file
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
        console.log(`Found ${fileInputs.length} file inputs. Uploading to first visible one or just the first one...`);
        let uploaded = false;
        for (const input of fileInputs) {
            try {
                await input.uploadFile(mediaPath);
                uploaded = true;
                break;
            } catch (e) {}
        }
        if (!uploaded) console.log("Failed to upload via input");
    } else {
        console.log("No input type file found.");
    }
    
    console.log("Media submitted...");
    await new Promise(r => setTimeout(r, 8000));
    
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
        const btn = btns.find(b => {
            const t = (b.innerText || "").trim().toLowerCase();
            return t === 'next' || t === 'done';
        });
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Typing text...");
    const textPath = path.join(__dirname, '../logs/temp_post.txt');
    let text = fs.readFileSync(textPath, 'utf-8');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/### (.*?)$/gm, '$1');
    text = text.replace(/## (.*?)$/gm, '$1');
    text = text.replace(/^> (.*?)$/gm, '$1');

    await page.evaluate(() => {
        const el = document.querySelector('.artdeco-modal [contenteditable="true"], .share-box-content [contenteditable="true"], [role="textbox"], .ql-editor');
        if (el) {
            el.innerHTML = '';
            el.focus();
        }
    });
    await page.keyboard.type(text, { delay: 1 });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Clicking Post...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const postBtn = btns.find(b => {
             const t = (b.innerText || b.textContent || "").trim().toLowerCase();
             return t === 'post' && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.offsetParent !== null;
        });
        if (postBtn) postBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 5000));
    console.log("✅ Fix Script Completed.");
    await browser.disconnect();
}

run().catch(console.error);


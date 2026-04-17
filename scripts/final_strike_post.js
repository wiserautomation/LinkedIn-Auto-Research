const puppeteer = require('puppeteer');
const fs = require('fs');

const POST_FILE = "/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/temp_post.txt";

(async () => {
    try {
        const postText = fs.readFileSync(POST_FILE, 'utf8');
        console.log('Post text loaded');

        const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
        const pages = await browser.pages();
        const linkedinPage = pages.find(p => p.url().includes('linkedin.com/feed'));

        if (!linkedinPage) {
            console.error('LinkedIn page not found');
            process.exit(1);
        }

        console.log('Connected to LinkedIn');

        // Step 1: Force focus the editor
        // We'll use a combination of click and evaluate to be 100% sure
        const editorSelector = '.ql-editor';
        await linkedinPage.waitForSelector(editorSelector, { timeout: 5000 }).catch(() => null);
        
        await linkedinPage.evaluate(() => {
            const editor = document.querySelector('.ql-editor');
            if (editor) {
                editor.focus();
                // We'll also try a direct text injection as a second layer
                // but usually typing is better for events
            }
        });

        // Click the editor to be sure
        const editorBox = await linkedinPage.evaluate(() => {
            const editor = document.querySelector('.ql-editor');
            if (editor) {
                const rect = editor.getBoundingClientRect();
                return { x: rect.left + 10, y: rect.top + 10 };
            }
            return null;
        });

        if (editorBox) {
            await linkedinPage.mouse.click(editorBox.x, editorBox.y);
            console.log('Clicked editor at:', editorBox);
        }

        console.log('Typing content...');
        // Clear if not empty
        await linkedinPage.keyboard.down('Meta');
        await linkedinPage.keyboard.press('a');
        await linkedinPage.keyboard.up('Meta');
        await linkedinPage.keyboard.press('Backspace');
        
        // Final Type
        await linkedinPage.keyboard.type(postText, { delay: 5 });

        await new Promise(r => setTimeout(r, 2000));

        // Step 2: Click the Blue 'Post' button
        const clicked = await linkedinPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const postBtn = buttons.find(b => 
                b.innerText.toLowerCase() === 'post' && 
                b.offsetParent !== null &&
                b.classList.contains('share-actions__primary-action')
            ) || buttons.find(b => 
                b.innerText.toLowerCase() === 'post' && 
                b.offsetParent !== null
            );
            
            if (postBtn) {
                postBtn.click();
                return "Post button clicked";
            }
            return "Post button not found";
        });

        console.log('Result:', clicked);
        
        await new Promise(r => setTimeout(r, 3000));
        await linkedinPage.screenshot({ path: 'logs/STRIKE_CONFIRMED_FINAL.png' });
        
        await browser.disconnect();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();

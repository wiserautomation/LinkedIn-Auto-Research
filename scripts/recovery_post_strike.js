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

        // Step 1: Click 'Next' if we are in the media editor
        const nextClicked = await linkedinPage.evaluate(async () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextButton = buttons.find(b => b.innerText.includes('Next') && b.offsetParent !== null);
            if (nextButton) {
                nextButton.click();
                return true;
            }
            return false;
        });

        if (nextClicked) {
            console.log("Next button clicked. Waiting for editor...");
            await new Promise(r => setTimeout(r, 2000));
        }

        // Step 2: Find editor and focus it
        const editorSelector = '.ql-editor';
        await linkedinPage.waitForSelector(editorSelector, { timeout: 10000 }).catch(() => null);
        
        const editorFocused = await linkedinPage.evaluate(() => {
            const editor = document.querySelector('.ql-editor');
            if (editor) {
                editor.focus();
                return true;
            }
            return false;
        });

        if (!editorFocused) {
            console.error('Editor not found/focused');
            await linkedinPage.screenshot({ path: 'logs/RECOVERY_FAIL_EDITOR.png' });
            process.exit(1);
        }

        console.log('Editor focused. Typing...');
        
        // Step 3: Clear any existing text if any
        await linkedinPage.keyboard.down('Meta');
        await linkedinPage.keyboard.press('a');
        await linkedinPage.keyboard.up('Meta');
        await linkedinPage.keyboard.press('Backspace');

        // Step 4: Type text in chunks to be faster/more reliable
        await linkedinPage.keyboard.type(postText, { delay: 10 });

        console.log('Typing complete. Waiting 1s...');
        await new Promise(r => setTimeout(r, 1000));

        // Step 5: Click Post
        const postResult = await linkedinPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const postBtn = buttons.find(b => 
                b.innerText.toLowerCase() === 'post' && 
                !b.innerText.toLowerCase().includes('start') &&
                b.offsetParent !== null
            );
            if (postBtn) {
                postBtn.click();
                return "Post button clicked";
            }
            return "Post button not found";
        });

        console.log('Final result:', postResult);
        await linkedinPage.screenshot({ path: 'logs/RECOVERY_FINAL_VIEW.png' });
        
        await browser.disconnect();
    } catch (e) {
        console.error('Error during recovery strike:', e);
        process.exit(1);
    }
})();

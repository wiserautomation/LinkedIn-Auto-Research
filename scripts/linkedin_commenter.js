// scripts/linkedin_commenter.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');
const LOG_FILE = path.join(__dirname, '../logs/commented_posts.json');
const TRENDS_FILE = path.join(__dirname, '../trends.json');

// Get keyword from trends if possible, else defaults.
let keywords = ["AI Agents", "LLM Security", "Deterministic AI", "Agentic Workflows"];
let keyword = keywords[Math.floor(Math.random() * keywords.length)];

if (fs.existsSync(TRENDS_FILE)) {
    try {
        const trends = JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf-8'));
        if (trends.length > 0 && trends[0].title) {
            // Strip out non-alphanumeric just to be safe for URL
            keyword = trends[0].title.split(" ").slice(0, 3).join(" ").replace(/[^a-zA-Z0-9 ]/g, ""); 
        }
    } catch(e) {}
}

const encodeKeyword = encodeURIComponent(keyword);

function getCommentedPosts() {
    if (fs.existsSync(LOG_FILE)) {
        return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
    return [];
}

function saveCommentedPost(urn) {
    const posts = getCommentedPosts();
    posts.push(urn);
    fs.writeFileSync(LOG_FILE, JSON.stringify(posts, null, 2));
}

async function runCommentEngagement() {
    console.log(`🚀 Starting LinkedIn Expertise Engagement for keyword: "${keyword}"`);
    
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
        await page.setViewport({ width: 1440, height: 3000 });

        if (!fs.existsSync(AUTH_FILE)) throw new Error("Auth file missing.");
        const cookies = JSON.parse(fs.readFileSync(AUTH_FILE));
        await page.setCookie(...cookies);

        // Sort by "date_posted" to engage with fresh conversations
        const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeKeyword}&sortBy=%22date_posted%22`;
        console.log(`📡 Navigating to ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 10000)); // wait for feed to load
        await page.screenshot({ path: path.join(__dirname, '../logs/debug_search.png') });
        const html = await page.evaluate(() => document.body.innerHTML);
        fs.writeFileSync(path.join(__dirname, '../logs/page_dump_search.html'), html);

        let commentsMade = 0;
        const targetComments = 5;

        // Target the comment buttons directly, as their text/ARIA labels are immutable
        const allBtns = await page.$$('button, [role="button"]');
        const postBtns = [];
        
        for (const btn of allBtns) {
            const isComment = await page.evaluate(el => {
                const label = (el.getAttribute('aria-label') || "").toLowerCase();
                const text = (el.innerText || "").toLowerCase().trim();
                return label.includes('comment') || text === 'comment';
            }, btn);
            if (isComment) postBtns.push(btn);
        }

        console.log(`🔍 Found ${postBtns.length} comment buttons.`);

        const commentedHistory = getCommentedPosts();

        for (let i = 0; i < postBtns.length; i++) {
            if (commentsMade >= targetComments) break;

            const commentBtn = postBtns[i];
            
            // Traverse up to find the post container
            const container = await page.evaluateHandle(btn => {
                let current = btn;
                let foundUrn = null;
                for (let j = 0; j < 15; j++) {
                    if (!current) break;
                    if (current.getAttribute && current.getAttribute('data-urn')) {
                        foundUrn = current;
                        break;
                    }
                    current = current.parentElement;
                }
                return foundUrn || btn.parentElement.parentElement.parentElement.parentElement.parentElement;
            }, commentBtn);
            
            // Extract some identifier (urn or snippet)
            const identifier = await page.evaluate(el => {
                const urnElement = el.querySelector('[data-urn]');
                if (urnElement) return urnElement.getAttribute('data-urn');
                return el.innerText.substring(0, 50).replace(/[^a-zA-Z0-9]/g, ""); // Fallback
            }, container);

            if (commentedHistory.includes(identifier)) {
                console.log(`⏭️ Already commented on post: ${identifier}, skipping.`);
                continue;
            }

            // Extract Post Text
            const postText = await page.evaluate(el => {
                const searchSnippet = el.querySelector('.entity-result__summary, .feed-shared-update-v2__description, span.break-words, .update-components-text');
                if (searchSnippet) return searchSnippet.innerText.trim();
                // Last resort: find any paragraph or long span
                const allSpans = Array.from(el.querySelectorAll('span, p'));
                const longest = allSpans.reduce((a, b) => (a.innerText.length > b.innerText.length ? a : b), {innerText: ""});
                return longest.innerText.trim();
            }, container);

            if (!postText || postText.length < 50) {
                console.log(`⏭️ Skipping: Post text too short (${postText.length} chars).`);
                continue;
            }

            console.log(`\n💬 Analyzing post: ${postText.substring(0, 50)}...`);

            // Generate comment
            fs.writeFileSync(path.join(__dirname, '../logs/temp_post.txt'), postText);
            let comment;
            try {
                const output = execSync(`python3 ${path.join(__dirname, 'comment_generator.py')} ${path.join(__dirname, '../logs/temp_post.txt')}`).toString();
                comment = output.trim();
            } catch (err) {
                console.log(`❌ Failed to generate comment: ${err.message}`);
                continue;
            }

            if (!comment || comment.length < 5) {
                console.log("⏭️ Skipping: AI generated empty or invalid comment.");
                continue;
            }

            console.log(`💡 Generated Comment: ${comment}`);

            // Scroll into view and click the button we found earlier
            if (!commentBtn) {
                console.log("⚠️ No comment button handle. Skipping.");
                continue;
            }

            // Scroll into view
            await page.evaluate(el => el.scrollIntoView({behavior: 'smooth', block: 'center'}), commentBtn);
            await new Promise(r => setTimeout(r, 2000));
            
            await commentBtn.click();
            await new Promise(r => setTimeout(r, 3000)); // wait for textbox

            // Wait for textbox and type
            const textboxSelector = '.ql-editor, [role="textbox"], .comments-comment-texteditor [contenteditable="true"]';
            const focused = await page.evaluate((sel, containerEl) => {
                const tb = containerEl.querySelector(sel) || document.activeElement;
                if (tb && (tb.getAttribute('contenteditable') === 'true' || tb.getAttribute('role') === 'textbox' || tb.classList.contains('ql-editor'))) {
                    tb.focus();
                    return true;
                }
                return false;
            }, textboxSelector, container);

            if (!focused) {
                console.log("⚠️ Could not focus comment box.");
                continue;
            }

            await page.keyboard.type(comment, { delay: 5 });
            await new Promise(r => setTimeout(r, 2000));

            // Press 'Post' Comment
            console.log("📤 Submitting comment...");
            
            // Try standard keyboard alternates first
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 2000));

            // More comprehensive submit button search
            const submitBtn = await page.evaluateHandle(() => {
                const selectors = [
                    'button.comments-comment-box__submit-button',
                    'button.artdeco-button--primary.artdeco-button--2.comments-comment-box__submit-button',
                    'button[type="submit"]',
                ];
                for (const sel of selectors) {
                    const btn = document.querySelector(sel);
                    if (btn && !btn.disabled && btn.offsetParent !== null) return btn;
                }
                // Fallback: find any button with "Post" text
                const btns = Array.from(document.querySelectorAll('button'));
                return btns.find(b => b.innerText.trim() === 'Post' && !b.disabled) || null;
            });

            if (submitBtn) {
                 try {
                     await page.evaluate((btn) => {
                         if (btn) {
                             btn.scrollIntoView();
                             btn.click();
                         }
                     }, submitBtn);
                     await new Promise(r => setTimeout(r, 4000));
                     
                     console.log(`✅ Comment submitted! Reporting interaction...`);
                     const screenshotPath = path.join(__dirname, `../logs/engagement_${commentsMade}.png`);
                     try {
                         await page.screenshot({ path: screenshotPath }); 
                         const sanitizedPostText = postText.substring(0, 100).replace(/"/g, "'").replace(/\n/g, ' ');
                         execSync(`node ${path.join(__dirname, 'discord_reporter.js')} "LINKEDIN" "🔥 **Expert Engagement Proof** (#${commentsMade + 1})\nKeyword: ${keyword}\nOn Post: ${sanitizedPostText}..." ${screenshotPath}`);
                     } catch (err) {
                         console.log(`⚠️ Report/Screenshot fail: ${err.message}`);
                     }

                     saveCommentedPost(identifier);
                     commentsMade++;
                 } catch (clickErr) {
                     console.log(`⚠️ Click failed: ${clickErr.message}`);
                 }
            } else {
                 console.log("⚠️ Submit button not found or disabled. Skipping.");
            }
            
            // Pause nicely between actions
            await new Promise(r => setTimeout(r, 8000));
        }

        console.log(`🎉 Finished engagement run. Comments made: ${commentsMade}`);
        await browser.close();
    } catch (err) {
        console.error(`❌ Engagement Error: ${err.message}`);
        if (page) await page.screenshot({ path: path.join(__dirname, '../logs/engagement_fail.png') });
        await browser.close();
    }
}

if (require.main === module) {
    runCommentEngagement().then(() => process.exit(0)).catch(console.error);
}

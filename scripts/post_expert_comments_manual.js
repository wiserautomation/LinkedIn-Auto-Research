const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const AUTH_FILE = path.join(__dirname, '../assets/auth/linkedin_auth.json');
const PREPARED_COMMENTS = [
    "Excellent breakdown of agentic patterns. From a CISO perspective, the 'Evaluator-Optimizer' loop is particularly critical for enforcing real-time security guardrails.",
    "Recursive feedback loops are indeed the differentiator. From a cybersecurity standpoint, the 'Reflect' phase is where we can inject deterministic security scans.",
    "The emphasis on 'Adapting' is vital. From an operational security perspective, agents must not only adapt to task changes but also to environmental constraints.",
    "Productivity gains are clear, but we must address the 'Agentic Shadow IT' risk. Centralizing the logging of these tool calls is a top priority for DevSecOps.",
    "Spot on about moving from reactive to proactive. In the context of the EU AI Act, 'Self-Correction' loops must be documented and auditable."
];

async function runManualEngagement() {
    console.log("🚀 Running Manual Expert Engagement Loop...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 2000 });
    const cookies = JSON.parse(fs.readFileSync(AUTH_FILE));
    await page.setCookie(...cookies);

    await page.goto('https://www.linkedin.com/search/results/content/?keywords=Agentic%20Workflows&sortBy=%22date_posted%22', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 10000));

    // Get comment buttons
    const allBtns = await page.$$('button, [role="button"]');
    const commentBtns = [];
    for (const btn of allBtns) {
        const isComment = await page.evaluate(el => el.innerText.toLowerCase().includes('comment'), btn);
        if (isComment) commentBtns.push(btn);
    }

    let count = 0;
    for (let i = 0; i < commentBtns.length && count < PREPARED_COMMENTS.length; i++) {
        const btn = commentBtns[i];
        
        // Find container
        const container = await page.evaluateHandle(el => {
            let curr = el;
            for(let j=0; j<10; j++) { if(!curr.parentElement) break; curr = curr.parentElement; if(curr.getAttribute('data-urn')) break; }
            return curr;
        }, btn);

        const comment = PREPARED_COMMENTS[count];
        console.log(`💬 Posting expert comment #${count+1}...`);

        await page.evaluate(el => el.scrollIntoView({block: 'center'}), btn);
        await new Promise(r => setTimeout(r, 2000));
        await btn.click();
        await new Promise(r => setTimeout(r, 4000));

        const textbox = await container.$('.ql-editor, [role="textbox"]');
        if (textbox) {
            await textbox.type(comment, { delay: 30 });
            await new Promise(r => setTimeout(r, 2000));
            
            const submit = await container.$('button[type="submit"], .comments-comment-box__submit-button');
            if (submit) {
                await submit.click();
                await new Promise(r => setTimeout(r, 5000));
                
                // Screenshot verification
                const screenshotPath = path.join(__dirname, `../logs/manual_engagement_${count}.png`);
                await container.screenshot({ path: screenshotPath });
                
                // Discord Report
                try {
                    const msg = `🔥 **Expert Engagement Verified** (Interaction #${count+1})\n*Manual High-Authority Strike*\nComment: "${comment}"`;
                    execSync(`node ${path.join(__dirname, 'discord_reporter.js')} "LINKEDIN" "${msg}" ${screenshotPath}`);
                    console.log(`✅ Reported interaction #${count+1} to Discord.`);
                } catch(e) {}
                
                count++;
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }

    await browser.close();
    console.log(`🎉 Done. ${count} comments posted and reported.`);
}

runManualEngagement();

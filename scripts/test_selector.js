const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const launchOptions = { headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const cookies = JSON.parse(fs.readFileSync('assets/auth/linkedin_auth.json'));
    await page.setCookie(...cookies);
    await page.goto('https://www.linkedin.com/search/results/content/?keywords=Agentic%20Workflows&sortBy=%22date_posted%22', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 10000));

    // Try finding the container for elements that have text "Comment"
    const info = await page.evaluate(() => {
        let spans = Array.from(document.querySelectorAll('span')).filter(s => s.innerText && s.innerText.trim().toLowerCase() === 'comment');
        let possiblePostContainers = new Set();
        
        spans.forEach(s => {
            let el = s;
            for(let i=0; i<12; i++) {
                if(!el) break;
                if(el.className && typeof el.className === 'string') {
                    possiblePostContainers.add(el.tagName.toLowerCase() + "." + el.className.split(' ').join('.'));
                }
                el = el.parentElement;
            }
        });

        return Array.from(possiblePostContainers);
    });
    console.log(JSON.stringify(info, null, 2));
    await browser.close();
})();

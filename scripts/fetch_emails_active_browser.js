const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("Connecting to active browser...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    const pages = await browser.pages();
    
    // Find or open Gmail
    let page = pages.find(p => p.url().includes('mail.google.com'));
    if (!page) {
        page = await browser.newPage();
        await page.goto('https://mail.google.com/mail/u/1/#inbox', { waitUntil: 'load' });
    }
    await page.bringToFront();
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Scraping emails from inbox...");
    const emails = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tr.zA'));
        return rows.slice(0, 20).map(row => {
            const subject = row.querySelector('.bog')?.innerText || "";
            const snippet = row.querySelector('.y2')?.innerText || "";
            const from = row.querySelector('.zF')?.innerText || row.querySelector('.bA4')?.innerText || "";
            return { subject, snippet, from };
        });
    });
    
    console.log(`✅ Scraped ${emails.length} emails.`);
    return emails;
}

run().then(emails => {
    process.stdout.write(JSON.stringify(emails));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});

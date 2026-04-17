const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlPath = 'file://' + path.resolve(__dirname, '../assets/visual_gen.html');
    await page.goto(htmlPath);
    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
    const el = await page.$('.window');
    await el.screenshot({ path: path.resolve(__dirname, '../assets/thumbnails/deterministic_proof_strike.png') });
    await browser.close();
    console.log("✅ Visual Proof generated.");
}

run().catch(console.error);

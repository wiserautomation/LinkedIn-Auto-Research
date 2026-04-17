const puppeteer = require('puppeteer');

async function run() {
    console.log("Connecting to active browser...");
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('linkedin.com')) || await browser.newPage();
    
    console.log("Navigating to recent activity...");
    await page.goto('https://www.linkedin.com/in/alejandro-paris-1a4b92399/recent-activity/shares/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Locating latest post options...");
    const deleted = await page.evaluate(async () => {
        // Find the first post container
        const post = document.querySelector('.feed-shared-update-v2');
        if (!post) return "No post found.";
        
        // Find control menu button
        const controlBtn = post.querySelector('button[aria-label="Control menu"]');
        if (!controlBtn) return "No control menu found.";
        controlBtn.click();
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Find delete option
        const options = Array.from(document.querySelectorAll('.artdeco-dropdown__item'));
        const deleteBtn = options.find(o => o.innerText.toLowerCase().includes('delete'));
        if (!deleteBtn) return "No delete button found.";
        deleteBtn.click();
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Confirm delete
        const confirmBtn = document.querySelector('.artdeco-modal__confirm-dialog-btn--positive');
        if (confirmBtn) {
            confirmBtn.click();
            return "Post deleted successfully.";
        }
        return "Could not find confirm button.";
    });
    
    console.log(`Result: ${deleted}`);
    await browser.disconnect();
}

run().catch(console.error);

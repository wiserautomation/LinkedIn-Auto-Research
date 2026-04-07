// notion_video_gen.js - Automated Notion Scroll & Branded Overlay
// =============================================================
// Records a 6-7s scroll and adds the "Karpathy Neon Green" branded overlay.

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const LOGS_DIR = path.join(__dirname, '../logs');
const ASSETS_DIR = path.join(__dirname, '../assets');

async function recordNotionScroll(pageUrl, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`📡 Navigating to Notion: ${pageUrl}...`);
  await page.goto(pageUrl, { waitUntil: 'networkidle2' });

  // Optional: Wait for Notion content to load (headers, etc.)
  await page.waitForSelector('.notion-body', { timeout: 10000 }).catch(() => {});

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 30,
    ffmpeg_Path: require('ffmpeg-static'),
    videoFrame: {
      width: 1280,
      height: 720,
    },
    aspectRatio: '16:9',
  });

  const rawVideoPath = path.join(LOGS_DIR, 'raw_scroll.mp4');
  await recorder.start(rawVideoPath);

  console.log("⏺️ Recording 7s scroll...");
  
  // Smooth scroll logic
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  await new Promise(r => setTimeout(r, 7000)); // Ensure we hit 7s
  await recorder.stop();
  await browser.close();

  console.log("🎞️ raw_scroll.mp4 captured. Starting overlay process...");
  return addBrandedOverlay(rawVideoPath, outputPath);
}

function addBrandedOverlay(inputPath, outputPath) {
  // Branded Overlay: Neon Green Box (#39FF14) with Black Stroke
  // Text: "SUPRAWALL LEAD MAGNET - [Title]"
  // Font: Gotham Ultra (if available), fallback to Bold Sans
  
  return new Promise((resolve, reject) => {
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Gotham Ultra font path
    const fontPath = path.join(ASSETS_DIR, 'fonts', 'GothamUltra.ttf');
    const existingFont = fs.existsSync(fontPath) ? fontPath : '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

    ffmpeg(inputPath)
      .videoFilters([
        // Draw the neon green box (neon green background)
        {
          filter: 'drawbox',
          options: {
            x: 50, y: 50, w: 600, h: 120,
            color: '#39FF14',
            t: 'fill'
          }
        },
        // Draw the black border around the box
        {
          filter: 'drawbox',
          options: {
            x: 50, y: 50, w: 600, h: 120,
            color: 'black',
            t: 5
          }
        },
        // Draw the text inside the box
        {
          filter: 'drawtext',
          options: {
            text: 'SUPRAWALL INTELLIGENCE',
            fontfile: existingFont,
            fontsize: 40,
            color: 'black',
            x: 80, y: 80
          }
        }
      ])
      .on('end', () => {
        console.log(`✅ Branded video created at: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ Video Processing Error: ${err.message}`);
        reject(err);
      })
      .save(outputPath);
  });
}

if (require.main === module) {
  const testUrl = process.argv[2] || "https://www.notion.so/blog";
  const output = path.join(ASSETS_DIR, 'samples', 'daily_lead_gen.mp4');
  recordNotionScroll(testUrl, output).catch(console.error);
}

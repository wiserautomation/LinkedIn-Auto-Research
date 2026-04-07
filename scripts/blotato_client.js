// blotato_client.js - LinkedIn Handoff via Blotato REST API
// ========================================================
// Publishes the generated copy and video to LinkedIn without manual intervention.

const axios = require('axios');
require('dotenv').config();

const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY;
const ACCOUNT_ID = process.env.BLOTATO_ACCOUNT_ID; // Your LinkedIn account ID in Blotato

async function publishToLinkedIn(text, videoUrl) {
  if (!BLOTATO_API_KEY || !ACCOUNT_ID) {
    console.error("❌ Blotato credentials missing.");
    return null;
  }

  const url = "https://backend.blotato.com/v2/posts";
  
  const payload = {
    targetType: "linkedin",
    accountId: ACCOUNT_ID,
    text: text,
    media: [
      {
        type: "video",
        url: videoUrl,
        title: "Daily Lead Gen Insight"
      }
    ],
    publishType: "instant" // and immediately publish
  };

  const headers = {
    "Authorization": `Bearer ${BLOTATO_API_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    const resp = await axios.post(url, payload, { headers });
    console.log(`✅ LinkedIn Post Published (Blotato ID: ${resp.data.id})`);
    return resp.data.id;
  } catch (err) {
    console.error(`❌ Blotato Publishing Error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    return null;
  }
}

if (require.main === module) {
  // Test stub
  const sampleCopy = "SupraWall brand intel: Autonomous agents require deterministic security. #AISecurity";
  const sampleVideo = "https://your-public-storage.com/lead_gen.mp4"; // Blotato needs a publicly accessible URL
  publishToLinkedIn(sampleCopy, sampleVideo).catch(console.error);
}

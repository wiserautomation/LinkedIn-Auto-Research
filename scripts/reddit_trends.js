// reddit_trends.js - Scrape Subreddits for Engagement Patterns
// ========================================================
// Finds high-performing keywords and pain points to seed the Lead Gen Agent.

const snoowrap = require('snoowrap');
require('dotenv').config();

// Default target communities (AI, Solopreneurship, Automation)
const TARGET_SUBREDDITS = ['AI_Agents', 'MachineLearning', 'Solopreneur', 'SaaS', 'Automation'];

async function getRedditTrends() {
  // If no Redditor credentials, we can fallback to a public JSON fetch
  // though snoowrap is preferred for detailed stats.
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.error("⚠️ Reddit API credentials missing. Falling back to public JSON fetch...");
    return await fetchPublicRedditTrends();
  }

  const r = new snoowrap({
    userAgent: 'LinkedIn-Auto-Research/1.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
  });

  const trends = [];

  for (const sub of TARGET_SUBREDDITS) {
    console.error(`🔍 Scraping r/${sub}...`);
    const posts = await r.getSubreddit(sub).getHot({ limit: 5 });
    
    posts.forEach(post => {
      trends.push({
        subreddit: sub,
        title: post.title,
        content: post.selftext.substring(0, 500), // snippet
        score: post.score,
        comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`
      });
    });
  }

  return trends;
}

async function fetchPublicRedditTrends() {
  const axios = require('axios');
  const trends = [];
  
  for (const sub of TARGET_SUBREDDITS) {
    try {
      const resp = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=5`);
      const children = resp.data.data.children;
      
      children.forEach(child => {
        const post = child.data;
        trends.push({
          subreddit: sub,
          title: post.title,
          content: post.selftext.substring(0, 500),
          score: post.score,
          comments: post.num_comments,
          url: `https://reddit.com${post.permalink}`
        });
      });
    } catch (e) {
      console.error(`❌ Failed to scrape r/${sub}: ${e.message}`);
    }
  }
  
  return trends;
}

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const outFile = process.argv[2] || 'trends.json';

  getRedditTrends().then(trends => {
    const outPath = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
    fs.writeFileSync(outPath, JSON.stringify(trends, null, 2));
    console.error(`✅ Reddit trends saved to ${outPath}`);
    process.exit(0);
  }).catch(err => {
    console.error(`❌ Reddit scraping failed: ${err.message}`);
    process.exit(1);
  });
}

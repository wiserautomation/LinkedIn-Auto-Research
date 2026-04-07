# lead_gen_agent_v2.py - Claude Designer + Google Brain Sync
# ========================================================
# Generates the lead magnet and logs it to Google Sheets + Drive.

import os
import json
import sys
from lead_gen_agent import generate_lead_magnet, LEAD_GEN_SOP
from google_sheets_client import GoogleBrain
from dotenv import load_dotenv

load_dotenv()

def run_daily_generation(trends_file):
    """Orchestrate the daily generation and logging process."""
    print("🚀 Starting Daily Lead Gen & Google Sync...")
    
    # 1. Load Trends
    if not os.path.exists(trends_file):
        print(f"⚠️ Trends file {trends_file} not found.")
        return

    with open(trends_file, 'r') as f:
        trends = json.load(f)

    # 2. Generate Magnet via Claude
    magnet_content = generate_lead_magnet(trends)
    if not magnet_content:
        print("❌ Failed to generate magnet.")
        return

    # Extract title from first line of markdown
    title = magnet_content.split('\n')[0].replace('#', '').strip()

    # 3. Save to Google Workspace (Native Brain)
    brain = GoogleBrain()
    doc_id, doc_link = brain.create_lead_magnet_doc(title, magnet_content)
    
    if doc_id and doc_link:
        subreddit = trends[0].get('subreddit', 'General')
        success = brain.log_lead_magnet(title, subreddit, doc_link)
        if success:
            print(f"✅ Lead Magnet Logged: {title}")
            print(f"🔗 Doc: {doc_link}")
            # Output the doc link for the next stage (video gen)
            print(f"::set-output name=doc_url::{doc_link}")

if __name__ == "__main__":
    trends_path = sys.argv[1] if len(sys.argv) > 1 else "trends.json"
    run_daily_generation(trends_path)

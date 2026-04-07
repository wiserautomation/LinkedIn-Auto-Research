# auto_researcher_google.py - Weekly Google Brain Optimization
# ==============================================================
# Analyzes the LinkedIn performance data in Google Sheets and 
# evolves the Lead Gen SOPs.

import os
import json
import requests
from google_sheets_client import GoogleBrain
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

RESEARCH_PROMPT_TEMPLATE = """
You are the "Chief Auto-Research Agent" for the SupraWall brand.
Your task is to analyze the performance of our last 30 LinkedIn posts and 
identify high-signal patterns from our Google Sheet.

### GOOGLE SHEET DATA (IMPRESSIONS, REACTIONS, COMMENTS, HOOKS):
{sheet_data}

### RESEARCH GOALS:
1. **Winning Hooks**: Which hook types drive the most engagement?
2. **Strategy Evolution**: Draft a revised "LEAD_GEN_SOP" to double down 
   on what works.

### OUTPUT:
Provide a 2-paragraph analysis and the UPDATED LEAD_GEN_SOP code block.
"""

def perform_google_research():
    """Retrieve data from Google Sheets and run AI analysis."""
    brain = GoogleBrain()
    spreadsheet_id = os.getenv("GOOGLE_SHEET_ID")
    
    if not spreadsheet_id:
        print("❌ GOOGLE_SHEET_ID missing.")
        return None

    try:
        print("📡 Fetching data from Social_Metrics tab...")
        # Get the top 31 rows (1 header + 30 data)
        range_name = "Social_Metrics!A1:H31"
        result = brain.sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range=range_name
        ).execute()
        
        rows = result.get('values', [])
        if not rows:
            print("⚠️ No data found in Sheet.")
            return None

        # Convert rows to a list of dicts for Claude
        headers = rows[0]
        data_rows = rows[1:]
        notion_items = [dict(zip(headers, row)) for row in data_rows]

        print(f"📊 Analyzing {len(notion_items)} posts...")
        prompt = RESEARCH_PROMPT_TEMPLATE.format(sheet_data=json.dumps(notion_items, indent=2))

        headers_api = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are an expert at LinkedIn conversion pattern analysis."},
                {"role": "user", "content": prompt}
            ]
        }

        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers_api)
        resp.raise_for_status()
        analysis = resp.json()['choices'][0]['message']['content']
        return analysis

    except Exception as e:
        print(f"❌ Auto-Research Error: {str(e)}")
        return None

if __name__ == "__main__":
    result = perform_google_research()
    if result:
        print("🔍 WEEKLY RESEARCH COMPLETE:")
        print(result)
        # Log the updated strategy somewhere?

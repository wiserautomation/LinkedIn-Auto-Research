# auto_researcher.py - The Sunday "Bio-mimetic" Pattern Loop
# ==============================================================
# Analyzes Notion metrics to identify winning hooks and angles.
# Self-modifies the Lead Gen SOPs to optimize future performance.

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

RESEARCH_PROMPT_TEMPLATE = """
You are the "Chief Auto-Research Agent" for the SupraWall brand.
Your task is to analyze the performance of our last 30 LinkedIn posts and 
identify high-signal patterns.

### DATA INPUT (IMPRESSIONS, LIKES, COMMENTS, HOOKS):
{notion_data}

### RESEARCH GOALS:
1. **Hook Analysis**: Which "Hook" types (e.g., Transformation, Fear, Question, Logic) 
   drive the most comments?
2. **Angle Analysis**: Do technical deep-dives perform better than high-level frameworks?
3. **Draft Updated SOP**: Based on these insights, rewrite the "LEAD_GEN_SOP" to double 
   down on what works.

### OUTPUT:
Provide a 2-paragraph summary of your findings and the FULL updated LEAD_GEN_SOP 
as code block.
"""

def perform_weekly_research(notion_items):
    """Analyze Notion data and return updated SOPs."""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY missing.")
        return None

    prompt = RESEARCH_PROMPT_TEMPLATE.format(notion_data=json.dumps(notion_items, indent=2))

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert at LinkedIn pattern analysis and conversion optimization."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        analysis = resp.json()['choices'][0]['message']['content']
        return analysis
    except Exception as e:
        print(f"❌ Auto-Research Error: {str(e)}")
        return None

if __name__ == "__main__":
    # Test with mockup data
    mock_stats = [
        {"title": "The Ghost in the Machine", "hook": "Transformation", "impressions": 54000, "likes": 230},
        {"title": "How to secure agents", "hook": "Logic", "impressions": 1200, "likes": 12}
    ]
    research = perform_weekly_research(mock_stats)
    if research:
        print("🔍 RESEARCH COMPLETE:")
        print(research)
        # In production, we would save the new SOP to a file or Notion.

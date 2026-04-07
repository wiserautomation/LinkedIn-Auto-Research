# lead_gen_agent.py - Claude-powered Lead Magnet Designer
# ======================================================
# Uses the "Lead Gen SKILL" SOPs to transform Reddit trends into Notion magnets.

import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# ─── LEAD GEN SKILL (SYSTEM PROMPT) ───────────────────────────────────────────
# This is the "secret sauce" SOP for generating high-conversion magnets.
LEAD_GEN_SOP = """
You are the "Lead Gen Specialist" for a high-performance LinkedIn brand.
Your goal is to design "Lead Magnets" that solve specific pain points for AI Builders, 
SaaS Founders, and Solopreneurs.

### SOP GUIDELINES:
1. **Identify the Core Problem**: Based on the provided Reddit trends, find one single, 
   urgent problem (e.g., "AI agents are too expensive to run," or "Prompt injection").
2. **Design the Solution**: 
   - Not a vague post. Create a structured Framework, a Playbook, or a Prompt Pack.
   - Use the "Transformation" angle: From [Struggling State] to [Successful State].
3. **Format**: Your output must be a Markdown-ready document that looks AMAZING in Notion.
   - Use H1, H2, checklists, and callout boxes.
4. **Style**: Direct, punchy, and technical but accessible. Minimal fluff.

### OUTPUT STRUCTURE:
1. **Title**: Catchy but result-oriented.
2. **The Hook**: Why this matters RIGHT NOW.
3. **The Framework**: Steps, prompts, or code snippets.
4. **The CTA**: How the reader can implement this today.
"""

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

def generate_lead_magnet(reddit_data):
    """Call Claude to generate the magnet based on trends."""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY missing.")
        return None

    prompt = f"Reddit Trends Context:\n{json.dumps(reddit_data, indent=2)}\n\n"
    prompt += "Generate a Lead Magnet following the SOP guidelines."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": LEAD_GEN_SOP},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        content = resp.json()['choices'][0]['message']['content']
        return content
    except Exception as e:
        print(f"❌ Lead Gen Error: {str(e)}")
        return None

if __name__ == "__main__":
    # Test with sample data
    sample_trends = [{"title": "Agentic workflows failing on long contexts", "subreddit": "AI_Agents"}]
    magnet = generate_lead_magnet(sample_trends)
    if magnet:
        print(magnet)
        # In production, this would return the markdown for the next step.

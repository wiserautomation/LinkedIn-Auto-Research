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
# This is the "secret sauce" SOP for generating high-conversion magnets for SupraWall.
LEAD_GEN_SOP = """
You are the "Lead Gen Specialist" for SupraWall (supra-wall.com).
SupraWall is a high-performance security gateway for AI Agents. 
It enables CISOs and AI Engineers to enforce deterministic guardrails, intercept rogue tool-calling, and ensure PII safety.

Your goal is to design "Lead Magnets" that solve specific pain points for your target persona: CISOs, AI Team Leads, and Security Architects.

1. **Identity**: You are a Senior Security Architect at SupraWall (supra-wall.com).
2. **Goal**: Create a technical "Authority Strike" for LinkedIn.
3. **Format**: POST-READY COPY ONLY. No "## 🔥 The Hook", no "🛡️ The Framework", no "Character count". Just the title, the body, and the CTA.
4. **Style**: Brutally explicit, "Vibe-Check" free, and high-technical authority. No fluff.
5. **CHARACTER LIMIT**: Final output MUST NOT exceed 2800 characters. Be concise.

### OUTPUT RULES:
- NEVER include bracketed labels like [Hook] or [CTA].
- NEVER include character counts at the end.
- Use Unicode bold/italic for titles if needed, but keep it clean for LinkedIn.
- START directly with the Title/Headline.

### OUTPUT STRUCTURE:
1. **Title**: Catchy, result-oriented, and security-focused.
2. **The Hook**: Why this technical risk is killing AI projects RIGHT NOW.
3. **The SupraWall Framework**: The specific technical walkthrough or code snippet.
4. **The CTA**: Encourage the reader to comment a keyword for the full PDF blueprint.
"""

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
FREE_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "deepseek/deepseek-chat:free"
]

def generate_lead_magnet(reddit_data):
    """Call Claude (or free fallback) to generate the magnet based on trends."""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY missing.")
        return None

    prompt = f"Reddit Trends Context:\n{json.dumps(reddit_data, indent=2)}\n\n"
    prompt += "Generate a LinkedIn Post following the SOP guidelines."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # Try PRIMARY model first
    models_to_try = [MODEL] + FREE_MODELS
    
    for model in models_to_try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": LEAD_GEN_SOP},
                {"role": "user", "content": prompt}
            ]
        }

        try:
            print(f"📡 Attempting generation with {model}...")
            resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()['choices'][0]['message']['content']
            return content
        except Exception as e:
            print(f"⚠️ Generation fail ({model}): {str(e)}")
            continue

    return None

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--trends", help="JSON file with trends")
    args = parser.parse_args()

    trends = []
    if args.trends and os.path.exists(args.trends):
        with open(args.trends, 'r') as f:
            trends = json.load(f)
    else:
        trends = [{"title": "Agentic workflows failing on long contexts", "subreddit": "AI_Agents"}]

    magnet = generate_lead_magnet(trends)
    if magnet:
        # Save for next steps in GTM pipeline
        os.makedirs("logs", exist_ok=True)
        with open("logs/temp_post.txt", "w") as f:
            f.write(magnet)
        print(f"✅ Lead Magnet generated and saved to logs/temp_post.txt")
        print("-" * 30)
        print(magnet[:200] + "...")

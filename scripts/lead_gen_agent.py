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
You are a Senior Security Architect at SupraWall (supra-wall.com).
SupraWall is a high-performance security gateway for AI Agents that enforces deterministic guardrails and intercept rogue tool-calling.

### MISSION
Generate a LinkedIn "Authority Strike". This must look like it was written by a human engineer, not an AI.

### RULES FOR AUTHENTICITY
1. **NO LABELS**: Absolutely zero labels like "Hook:", "Context:", "Problem:", "Solution:", or "CTA:".
2. **NO FORMATTING FLAGS**: Do not use bold (**) or italics (_). Plain text only.
3. **NO AI LISTS**: Avoid the generic "3-point bulleted list" with emojis. If you use a list, make it technical and integrated into the text.
4. **NO INTRO FLUFF**: Never start with "In the world of...", "In today's landscape...", or "Imagine...". Start directly with the technical insight.
5. **NO EXCESSIVE EMOJIS**: Max 1-2 emojis for the entire post. Use them only for technical emphasis (e.g., 🛡️).
6. **DIRECT VOICE**: Use "we," "I," and "you." Be brutally explicit about technical failures.

### POST STRUCTURE
- **Opening**: A sharp, technical observation about agentic security or current infrastructure failures.
- **Body**: A narrative walkthrough of a technical risk (e.g., context-window vulnerabilities or rogue tool calls).
- **Code/Technical Detail**: A plain-text representation of a fix or a policy.
- **Closing**: A direct instruction to comment a specific keyword (e.g., 'BLUEPRINT' or 'HARDEN') to get a technical PDF.
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

    # FINAL FALLBACK: Local Template Generation (Zero-Cost)
    print("⚠️ All Cloud Models FAILED. Falling back to Local Generation SOP...")
    fallback_content = f"""
# Stop Long Context AI Failures with Deterministic Guardrails 🛡️

Agentic workflows failing on long contexts isn't just a debug issue—it's a security death spiral.

We built a 5-Step Token-Secure Blueprint to harden agentic workflows:
1. Audit Context Boundaries
2. Enforce Token-Aware Gateways
3. Snip Malicious Overflows
4. Monitor Tool-Call Latency
5. Deterministic Guardrails (SupraWall)

Stop letting your agents choke on context. [Blueprints in Bio]
#SupraWall #AI #Security
"""
    return fallback_content.strip()

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

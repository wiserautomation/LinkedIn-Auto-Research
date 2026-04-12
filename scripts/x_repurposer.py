import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
FREE_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "deepseek/deepseek-chat:free"
]

REPURPOSE_PROMPT = """
You are a "Senior Security Architect & Viral X Strategist" for SupraWall (supra-wall.com).
Your goal is to transform technical LinkedIn content into 4 High-Magnitude X technical strikes.

### X PERSONALITY:
* **Opinionated & Controversial**: Call out the "Security Theatre" in current AI agent implementations.
* **Deterministic Authority**: Hammer the point that "Probabilistic Security is a Failure". 
* **Zero Fluff**: No "I'm excited to share" or "Check this out". Just cold, hard technical critique.

### STRIKE TYPES:
1. **The Lead Magnet**: A high-friction hook (e.g., "99% of AI Agents are a backdoor"). Explain the SupraWall Blueprint. END with "Comment [GATE] for the .pdf".
2. **The "Gateway" Revelation**: Contrast "Cloud WAFs" (failing) vs "Deterministic Local Gateways" (SupraWall).
3. **CISO Technical Friction**: A brutal truth about the "Recursive Loop" or "Unauthorized Tool Access" risks.
4. **Architect's Vision**: Why the "Agentic Edge" needs SupraWall's immutable policy layer.

### RULES:
* Maximum 240 characters (leave space for markers).
* NO Markdown. NO Emojis (except maybe ONE 🚨 or 🔒 if it adds technical urgency).
* Reference 'SupraWall' or 'OpenClaw' explicitly in 3 of 4 posts.
* Include 1 technical hashtag (e.g., #AIAgents, #CISO, #AgentSecurity).

OUTPUT FORMAT: JSON array of 4 objects:
[
  { "content": "The tweet string...", "type": "STRIKE_TYPE" }
]
"""

def repurpose_content(linked_text):
    if not OPENROUTER_API_KEY:
        return ["Exploring AI Agent security. #AIAgents", "Deterministic AI is the future. #XAgent", "Warning: Don't ignore agent security.", "Building SupraWall for agents."]

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    for model in FREE_MODELS:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": REPURPOSE_PROMPT},
                {"role": "user", "content": f"LinkedIn Post:\n{linked_text}"}
            ]
        }
        try:
            resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()['choices'][0]['message']['content'].strip()
            # Extract JSON array
            start = content.find("[")
            end = content.rfind("]") + 1
            raw_posts = json.loads(content[start:end])
            
            from datetime import datetime, timedelta
            now = datetime.now()
            
            staggered_posts = []
            for i, p in enumerate(raw_posts):
                # Spread posts across 16 hours (+1h, +5h, +9h, +13h)
                scheduled_time = now + timedelta(hours=(1 + i*4))
                
                # Zero-Width Injection (\u200B) for uniqueness
                content_text = p['content'] if isinstance(p, dict) else p
                # Inject 1-3 markers at the end
                markers = "\u200B" * (i + 1)
                final_text = f"{content_text}{markers}"
                
                staggered_posts.append({
                    "id": i + 1,
                    "content": final_text,
                    "scheduledTime": scheduled_time.isoformat(),
                    "status": "pending"
                })
            return staggered_posts
        except Exception as e:
            print(f"⚠️ Repurpose fail ({model}): {str(e)}", file=sys.stderr)
            continue
    
    return []

if __name__ == "__main__":
    input_file = sys.argv[1] if len(sys.argv) > 1 else None
    input_text = ""
    if input_file and os.path.exists(input_file):
        with open(input_file, 'r') as f:
            input_text = f.read()
    else:
        input_text = "The Rise of Local MCP: Why the Edge is the new AI Frontier. Deterministic AI agents need local guardrails."

    posts = repurpose_content(input_text)
    if posts:
        with open(os.path.join(os.path.dirname(__file__), '../logs/x_queue.json'), 'w') as f:
            json.dump(posts, f, indent=2)
        print(f"✅ Generated {len(posts)} X posts to logs/x_queue.json")

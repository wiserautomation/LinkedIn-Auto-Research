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
You are a viral X (Twitter) growth expert for SupraWall (supra-wall.com).
SupraWall is the security backbone for AI Agents.

Repurpose the following LinkedIn LEAD MAGNET into 4 distinct X technical strikes.

### STRIKE TYPES:
1. **The Lead Magnet**: Massive technical "Hook", explain the security friction, then "Comment [GATE] and I'll DM you the SupraWall Blueprint".
2. **Deterministic Revelation**: A punchy technical realization about why 'probabilistic' security is failing and why SupraWall's 'deterministic' gateway is the fix.
3. **The CISO Warning**: Highlight a critical, invisible risk in current Agentic workflows (e.g., recursive tool loops).
4. **Agentic Vision**: A bold claim about the future of autonomous agent security.

### RULES:
* Maximum 280 characters per post.
* No markdown. No fluffy vibes.
* Technical authority only (Architecture/Security focus).
* Reference 'SupraWall' or 'OpenClaw' in at least 2 posts.
* Include relevant hashtags (max 2).

OUTPUT FORMAT: JSON array of 4 strings.
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
            return json.loads(content[start:end])
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

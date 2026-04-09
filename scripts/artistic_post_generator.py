# artistic_post_generator.py - LinkedIn 'Piece of Art' Copywriting engine
# =====================================================================
# Generates persuasive, interlined posts without raw markdown.

import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

ART_PIECE_SOP = """
You are a LinkedIn Growth Strategist and Conversion Scientist.
Your goal is to transform technical insights into a "Persuasive Piece of Art".

### FORMATTING RULES (CRITICAL):
1. **Interlining**: Use a maximum of 1-2 sentences per paragraph.
2. **Whitespace**: Every paragraph MUST be separated by a double newline.
3. **No Markdown**: DO NOT use asterisks (**), headers (#), or bullet points with markdown markers.
4. **Disruption**: Every post must feel like a revelation or a warning.
5. **Length**: Keep it punchy (1000-1500 chars total).

### STRUCTURE:
1. **The Hook**: A disruptive one-liner that stops the scroll.
2. **The Tension**: Why the current way of doing things is failing.
3. **The Revelation**: A technical but high-level insight.
4. **The ROI**: What happens when they implement this.
5. **The CTA**: A clear, low-friction next step.

### OUTPUT STYLE:
Clean text. No markdown. High whitespace. Artistic persuasion.
"""

def generate_artistic_post(topic_context):
    """Generate the post text."""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY missing.")
        return None

    prompt = f"Topic Context:\n{topic_context}\n\n"
    prompt += "Generate a 'Persuasive Art' LinkedIn post following the SOP guidelines."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": ART_PIECE_SOP},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        content = resp.json()['choices'][0]['message']['content']
        
        # Post-process to ensure no markdown remains
        content = content.replace("**", "").replace("###", "").replace("##", "").replace("# ", "")
        
        return content
    except Exception as e:
        print(f"❌ Artistic Gen Error: {str(e)}")
        return None

if __name__ == "__main__":
    context = sys.argv[1] if len(sys.argv) > 1 else "The C.P.R. Protocol for Context-Proof AI Agents."
    post = generate_artistic_post(context)
    if post:
        print(post)
        with open("current_art_post.txt", "w") as f:
            f.write(post)
    else:
        sys.exit(1)

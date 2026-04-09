# scripts/comment_generator.py
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

COMMENT_SOP = """
You are an expert Software Engineer and CISO specializing in AI Agents, Security, and Deterministic AI.
Your goal is to write a highly insightful, valuable comment on a LinkedIn post.

### RULES:
1. Identify the core argument of the post.
2. Add a technical 'Yes, and...' or a constructive 'Have you considered X?' perspective.
3. DO NOT just say 'Great post!', 'I agree', or use emoji spam. Add real technical depth.
4. Keep it strictly between 1 to 3 sentences maximum. Keep it punchy.
5. Tone: Confident authority, professional, technically precise.
6. NO MARKDOWN (no bold, italics, headers). Plain text only.
"""

FREE_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "deepseek/deepseek-chat:free"
]

def generate_expert_comment(post_text):
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY missing.", file=sys.stderr)
        return None

    prompt = f"LinkedIn Post Text:\n{post_text}\n\nGenerate an expert comment following the SOP guidelines."
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # Resilient Rotation Strategy
    for model in FREE_MODELS:
        # Log to stderr to avoid polluting stdout
        print(f"📡 Attempting generation with: {model}...", file=sys.stderr)
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": COMMENT_SOP},
                {"role": "user", "content": prompt}
            ]
        }

        try:
            resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()['choices'][0]['message']['content'].strip()
            # Clean markdown leftovers
            content = content.replace("**", "").replace("_", "").replace("`", "")
            return content
        except Exception as e:
            print(f"⚠️ Rotation fail ({model}): {str(e)}", file=sys.stderr)
            continue
    
    return None

if __name__ == "__main__":
    # If a file is passed or text directly
    input_text = sys.argv[1] if len(sys.argv) > 1 else "AI agents are going to replace standard UI in the next 5 years."
    if os.path.exists(input_text):
        with open(input_text, 'r') as f:
            input_text = f.read()

    comment = generate_expert_comment(input_text)
    if comment:
        print(comment) # stdout is read by the puppeteer script
    else:
        sys.exit(1)

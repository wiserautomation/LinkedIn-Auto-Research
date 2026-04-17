import websocket
import json
import requests
import time
import os

POST_FILE = "/Users/alejandropeghin/Desktop/OpenClaw/LinkedIn-auto-research/logs/temp_post.txt"

def get_linkedin_ws_url():
    try:
        resp = requests.get("http://localhost:9222/json")
        pages = resp.json()
        for page in pages:
            if "linkedin.com/feed" in page.get("url", ""):
                return page.get("webSocketDebuggerUrl")
        return None
    except Exception as e:
        print(f"Error getting pages: {e}")
        return None

def send_command(ws, method, params):
    cmd = {"id": 1, "method": method, "params": params}
    ws.send(json.dumps(cmd))
    return ws.recv()

def finish_post():
    if not os.path.exists(POST_FILE):
        print(f"Post file {POST_FILE} not found")
        return

    with open(POST_FILE, "r") as f:
        content = f.read()

    ws_url = get_linkedin_ws_url()
    if not ws_url:
        print("LinkedIn feed page not found")
        return

    print(f"Connecting to {ws_url}")
    ws = websocket.create_connection(ws_url, origin="http://localhost:9222")

    # 1. Try to find the editor and focus it
    script = """
    (() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            editor.focus();
            // Clear if needed
            editor.innerHTML = '';
            return true;
        }
        return false;
    })()
    """
    resp = send_command(ws, "Runtime.evaluate", {"expression": script})
    print(f"Focus editor result: {resp}")

    # 2. Type the text
    print("Typing content...")
    for char in content:
        send_command(ws, "Input.dispatchKeyEvent", {
            "type": "char",
            "text": char,
            "unmodifiedText": char
        })
    
    print("Content typed.")

    # 3. Wait a bit for the UI to catch up
    time.sleep(1)

    # 4. Click the 'Post' button
    # The 'Post' button usually has a specific class or text
    script = """
    (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const postButton = buttons.find(b => 
            b.innerText.toLowerCase().includes('post') && 
            !b.innerText.toLowerCase().includes('start') &&
            b.offsetParent !== null
        );
        if (postButton) {
            postButton.click();
            return "Post button clicked";
        }
        return "Post button not found";
    })()
    """
    resp = send_command(ws, "Runtime.evaluate", {"expression": script})
    print(f"Post click result: {resp}")

    ws.close()

if __name__ == "__main__":
    finish_post()

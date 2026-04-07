# notion_client.py - Syncing Lead Magnets and Metrics
# ===================================================
# Handles the "Notion OS" operations for storing content and tracking performance.

import os
import json
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

class NotionOS:
    def __init__(self):
        self.notion = Client(auth=NOTION_TOKEN)

    def create_lead_magnet_page(self, title, content, subreddit_source="General"):
        """Create a new page in the Notion DB for the daily lead magnet."""
        if not DATABASE_ID:
            print("❌ NOTION_DATABASE_ID missing.")
            return None

        # Content is markdown. Simplest to just save as text block.
        properties = {
            "Name": {"title": [{"text": {"content": title}}]},
            "Source": {"select": {"name": subreddit_source}},
            "Status": {"status": {"name": "Draft"}},
            "Created Date": {"date": {"start": os.popen("date +%Y-%m-%d").read().strip()}}
        }

        try:
            page = self.notion.pages.create(
                parent={"database_id": DATABASE_ID},
                properties=properties,
                children=[
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": content[:1500]}}] # Notion block limit
                        }
                    }
                ]
            )
            return page['id'], page['url']
        except Exception as e:
            print(f"❌ Notion Create Error: {str(e)}")
            return None, None

    def update_metrics(self, page_id, metrics):
        """Update metrics for a published post in Notion."""
        properties = {
            "Impressions": {"number": metrics.get("impressions", 0)},
            "Likes": {"number": metrics.get("likes", 0)},
            "Comments": {"number": metrics.get("comments", 0)},
            "Shares": {"number": metrics.get("shares", 0)},
            "Status": {"status": {"name": "Published"}}
        }

        try:
            self.notion.pages.update(page_id=page_id, properties=properties)
            return True
        except Exception as e:
            print(f"❌ Notion Metrics Sync Error: {str(e)}")
            return False

if __name__ == "__main__":
    # Test stub
    client = NotionOS()
    # (Testing omitted to avoid live API calls without keys)
    print("Notion Client initialized (ready for auth).")

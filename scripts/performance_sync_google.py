# performance_sync_google.py - Google Brain Metrics Ingestion
# ========================================================
# Periodic sync of LinkedIn performance data into the Master Google Sheet.

import os
import sys
from google_sheets_client import GoogleBrain
from dotenv import load_dotenv

load_dotenv()

def sync_metrics_to_sheets(results_json):
    """Update rows in Google Sheets with fresh performance data."""
    brain = GoogleBrain()
    spreadsheet_id = os.getenv("GOOGLE_SHEET_ID")
    
    # metrics format: [{"post_id": "...", "impressions": 500, "likes": 20}]
    try:
        # 1. Fetch current Sheet Data (Social_Metrics tab)
        # 2. Match post_id
        # 3. Update or Append row
        # Simplified: Appending a new log of the current snapshot
        for item in results_json:
            values = [[
                os.popen("date +%Y-%m-%d").read().strip(),
                item.get("post_id"),
                item.get("impressions", 0),
                item.get("likes", 0),
                item.get("comments", 0),
                item.get("shares", 0),
                "Transformation", # Placeholder for AI classification
                "Technical"       # Placeholder
            ]]
            body = {'values': values}
            brain.sheets_service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range="Social_Metrics!A:H",
                valueInputOption="RAW",
                body=body
            ).execute()
        
        print(f"📊 {len(results_json)} metric snapshots logged to Google Sheets.")
        
    except Exception as e:
        print(f"❌ Metrics Sync Failed: {str(e)}")

if __name__ == "__main__":
    # Test mock data
    mock_results = [{"post_id": "718712345", "impressions": 1200, "likes": 45}]
    sync_metrics_to_sheets(mock_results)
    print("Metrics Sync loop complete.")

# initialize_google_brain.py - Setup the Google Sheet Schema
# ========================================================
# Run this once after setting up your Google Spreadsheet ID.

import os
from google_sheets_client import GoogleBrain

def main():
    brain = GoogleBrain()
    spreadsheet_id = os.getenv("GOOGLE_SHEET_ID")
    
    if not spreadsheet_id:
        print("❌ GOOGLE_SHEET_ID missing in .env")
        return

    print(f"🛠️  Initializing Spreadsheet Structure for {spreadsheet_id}...")

    # Define the required tabs and their headers
    SHEET_SETUP = {
        "Lead_Magnets": ["Date", "Title", "Subreddit", "DraftDocsLink", "PostID", "Status"],
        "Social_Metrics": ["Date", "PostID", "Impressions", "Reactions", "Comments", "Shares", "Hook_Type", "Angle"]
    }

    try:
        # Create tabs if they don't exist
        for sheet_name, headers in SHEET_SETUP.items():
            print(f"🔹 Setting up tab: {sheet_name}")
            
            # 1. Create the sheet (AddSheetRequest)
            # 2. Write the headers (UpdateValuesRequest)
            # Simplified logic for direct row insertion if headers missing:
            brain.sheets_service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f"{sheet_name}!A1",
                valueInputOption="RAW",
                body={"values": [headers]}
            ).execute()
            
        print("✅ Spreadsheet initialized. You can now start the daily loop.")

    except Exception as e:
        print(f"❌ Initialization Failed: {str(e)}")

if __name__ == "__main__":
    main()

# google_sheets_client.py - The "Google Brain" for LinkedIn Auto-Research
# =====================================================================
# Replaces Notion. Manages Spreadsheets for metrics and Docs for content.

import os
import json
import base64
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

# We expect the Service Account JSON as a Base64 string in env for GitHub Actions safety
GCP_JSON_KEY_B64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")

class GoogleBrain:
    def __init__(self):
        self.scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ]
        self.creds = self._get_credentials()
        self.sheets_service = build('sheets', 'v4', credentials=self.creds)
        self.drive_service = build('drive', 'v3', credentials=self.creds)

    def _get_credentials(self):
        if not GCP_JSON_KEY_B64:
            # Fallback to local file for dev
            return service_account.Credentials.from_service_account_file(
                'service_account.json', scopes=self.scopes
            )
        
        # Decode from B64 (used in GitHub Actions)
        json_data = json.loads(base64.b64decode(GCP_JSON_KEY_B64))
        return service_account.Credentials.from_service_account_info(
            json_data, scopes=self.scopes
        )

    def initialize_sheets(self):
        """Create the tabs and headers if they don't exist."""
        print(f"📊 Initializing Sheet: {SPREADSHEET_ID}...")
        
        # Tab 1: Lead_Magnets
        # Tab 2: Social_Metrics
        # Logic to check and create tabs omitted for brevity, focusing on core ops.
        pass

    def create_lead_magnet_doc(self, title, content):
        """Create a Google Doc for the lead magnet and return its link."""
        file_metadata = {
            'name': f"Lead Magnet: {title}",
            'mimeType': 'application/vnd.google-apps.document'
        }
        # In a real implementation, we'd use the Docs API to actually insert 
        # the text. For now, we create the file with name.
        try:
            file = self.drive_service.files().create(body=file_metadata, fields='id, webViewLink').execute()
            print(f"📄 Google Doc Created: {file.get('webViewLink')}")
            return file.get('id'), file.get('webViewLink')
        except Exception as e:
            print(f"❌ Google Drive Error: {str(e)}")
            return None, None

    def log_lead_magnet(self, title, subreddit, doc_link):
        """Append a new row to the Lead_Magnets sheet."""
        values = [[
            os.popen("date +%Y-%m-%d").read().strip(),
            title,
            subreddit,
            doc_link,
            "Draft"
        ]]
        body = {'values': values}
        try:
            self.sheets_service.spreadsheets().values().append(
                spreadsheetId=SPREADSHEET_ID,
                range="Lead_Magnets!A:E",
                valueInputOption="RAW",
                body=body
            ).execute()
            return True
        except Exception as e:
            print(f"❌ Sheets Log Error: {str(e)}")
            return False

    def update_metrics(self, post_id, metrics):
        """Update metrics in the Social_Metrics sheet."""
        # This would perform a search for post_id and update the row.
        # Implementation depends on the sheet structure.
        pass

if __name__ == "__main__":
    brain = GoogleBrain()
    print("Google Brain Client Initialized.")

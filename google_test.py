import gspread
from google.oauth2.service_account import Credentials

# اسم ملف الـ JSON بتاع الـ Service Account
SERVICE_ACCOUNT_FILE = "amazon-api-503717-8d3c37701d16.json"

# صلاحيات Google Sheet
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)

client = gspread.authorize(creds)

print("✅ تم الاتصال بـ Google بنجاح")
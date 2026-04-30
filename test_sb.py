import os, requests
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.getenv("SUPABASE_URL")
anon = os.getenv("SUPABASE_ANON_KEY")

print("Requesting OTP...")
res = requests.post(f"{url}/auth/v1/otp", headers={"apikey": anon}, json={"email": "test@example.com", "create_user": True})
print(res.status_code, res.text)

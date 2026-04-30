import os
import requests
from dotenv import load_dotenv
from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ConfigDict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

class TokenUser(BaseModel):
    email: str
    model_config = ConfigDict(from_attributes=True)

def request_otp(email: str) -> dict:
    url = f"{SUPABASE_URL}/auth/v1/otp"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "create_user": True
    }
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code >= 400:
        raise HTTPException(status_code=400, detail=res.json().get("msg", "Error al enviar OTP de Supabase"))
    return {}

def verify_otp_code(email: str, code: str) -> str:
    url = f"{SUPABASE_URL}/auth/v1/verify"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "type": "email",
        "email": email,
        "token": code
    }
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code >= 400:
        return ""
    
    data = res.json()
    return data.get("access_token", "")

def get_current_user(authorization: str | None = Header(default=None)) -> TokenUser:
    # BYPASS DE AUTENTICACIÓN: Devuelve un usuario por defecto para probar el CRUD
    return TokenUser(email="admin@university.local")

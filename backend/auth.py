import os
import httpx
from dotenv import load_dotenv
from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ConfigDict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

class SupabaseUser(BaseModel):
    id: str
    email: str | None = None
    model_config = ConfigDict(from_attributes=True)

def get_current_user(authorization: str | None = Header(default=None)) -> SupabaseUser:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta token de autorización")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Formato de autorización inválido")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase auth no configurado")
    try:
        response = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": authorization},
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No se pudo validar sesión") from exc
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")
    payload = response.json()
    return SupabaseUser(id=payload["id"], email=payload.get("email"))

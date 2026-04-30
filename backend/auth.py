import os
import random
import smtplib
import string
import time
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ConfigDict

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"

_otp_store: dict[str, dict] = {}
OTP_TTL = 300


class TokenUser(BaseModel):
    email: str
    model_config = ConfigDict(from_attributes=True)


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _send_email(to_email: str, otp: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Tu código de verificación"
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    html_body = f"""
    <html>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#1D4ED8,#2563EB);padding:32px;text-align:center;">
          <h1 style="color:#FFFFFF;margin:0;font-size:22px;letter-spacing:-0.5px;">Verificación de identidad</h1>
        </div>
        <div style="padding:40px 32px;">
          <p style="color:#475569;font-size:15px;margin:0 0 24px;">Usa el siguiente código para iniciar sesión. Válido por <strong>5 minutos</strong>.</p>
          <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#1D4ED8;">{otp}</div>
          <p style="color:#94A3B8;font-size:12px;margin:24px 0 0;text-align:center;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(SMTP_USER, to_email, msg.as_string())


def request_otp(email: str) -> dict:
    otp = _generate_otp()
    _otp_store[email] = {"code": otp, "expires": time.time() + OTP_TTL}

    if DEV_MODE:
        print(f"[DEV OTP] {email} → {otp}")
        return {"dev_otp": otp}

    _send_email(email, otp)
    return {}


def verify_otp_code(email: str, code: str) -> bool:
    entry = _otp_store.get(email)
    if not entry:
        return False
    if time.time() > entry["expires"]:
        _otp_store.pop(email, None)
        return False
    if entry["code"] != code:
        return False
    _otp_store.pop(email, None)
    return True


def create_access_token(email: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": email, "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: str | None = Header(default=None)) -> TokenUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub", "")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return TokenUser(email=email)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

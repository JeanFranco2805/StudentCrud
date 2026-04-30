import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_otp_email(to_email: str, otp_code: str):
    subject = "Código de verificación — Portal Académico"

    html_body = f"""
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 32px; background-color: #f2ece0; border: 1px solid #c8bfaa; border-radius: 6px;">
      <p style="font-size: 12px; color: #6b6254; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 24px;">Portal Académico</p>
      <h1 style="font-size: 22px; color: #1e1e1e; margin: 0 0 16px; font-weight: 600;">Tu código de acceso</h1>
      <p style="font-size: 15px; color: #3a3a3a; margin: 0 0 32px;">Usa el siguiente código para iniciar sesión. Válido por una sola vez.</p>
      <div style="text-align: center; background-color: #e8e0d0; border: 1px solid #c8bfaa; border-radius: 6px; padding: 28px; margin-bottom: 32px;">
        <span style="font-size: 36px; font-weight: 600; letter-spacing: 0.3em; color: #3a5a40;">{otp_code}</span>
      </div>
      <p style="font-size: 13px; color: #6b6254; margin: 0;">Si no solicitaste este código, ignora este mensaje.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())

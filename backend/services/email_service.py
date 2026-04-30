import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


async def send_email(to_email: str, body: str) -> dict:
    msg = MIMEMultipart()
    msg['From'] = SMTP_EMAIL
    msg['To'] = to_email
    msg['Subject'] = "Mensaje desde FastAPI"
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)

    return {"status": "success", "message": f"Correo enviado a {to_email}"}
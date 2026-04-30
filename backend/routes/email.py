from pydantic import BaseModel
from fastapi import APIRouter
from app.services.email_service import send_email

router = APIRouter(prefix="/email", tags=["Email"])


class EmailRequest(BaseModel):
    destinatario: str
    mensaje: str


@router.post("/send")
async def enviar_correo(data: EmailRequest):
    return await send_email(data.destinatario, data.mensaje)
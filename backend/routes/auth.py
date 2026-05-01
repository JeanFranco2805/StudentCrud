from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import auth as auth_service
from auth import TokenUser, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp(body: OTPRequest):
    auth_service.request_otp(body.email)
    return {"message": "Código enviado al correo"}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(body: OTPVerify):
    token = auth_service.verify_otp_code(body.email, body.code)
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido o expirado")
    return TokenResponse(access_token=token)

@router.get("/me", response_model=TokenUser)
def get_me(current_user: TokenUser = Depends(get_current_user)):
    return current_user

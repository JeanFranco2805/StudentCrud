from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets

from database import get_db, engine
from models import Base, User, Student
from email_utils import send_otp_email

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portal Académico API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailRequest(BaseModel):
    email: EmailStr


class OTPRequest(BaseModel):
    email: EmailStr
    otp: str


class StudentCreate(BaseModel):
    nombre: str
    edad: int
    nota: float


def get_current_user(token: str, db: Session) -> User:
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="No autorizado")
    return user


def extract_token(authorization: str = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    return authorization.split(" ")[1]


from fastapi import Header


@app.post("/auth/send-otp")
def send_otp(body: EmailRequest, db: Session = Depends(get_db)):
    import random
    otp_code = str(random.randint(100000, 999999))

    user = db.query(User).filter(User.email == body.email).first()
    if user:
        user.otp = otp_code
        user.token = None
    else:
        user = User(email=body.email, otp=otp_code)
        db.add(user)

    db.commit()
    send_otp_email(body.email, otp_code)
    return {"message": "Código enviado"}


@app.post("/auth/verify-otp")
def verify_otp(body: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if not user or user.otp != body.otp:
        raise HTTPException(status_code=400, detail="Código incorrecto o expirado")

    token = secrets.token_hex(32)
    user.token = token
    user.otp = None
    db.commit()
    return {"token": token}


@app.get("/students")
def get_students(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    token = extract_token(authorization)
    get_current_user(token, db)
    students = db.query(Student).all()
    return students


@app.post("/students", status_code=201)
def create_student(
    body: StudentCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    token = extract_token(authorization)
    get_current_user(token, db)

    if not body.nombre.strip():
        raise HTTPException(status_code=422, detail="El nombre no puede estar vacío")
    if not (0 <= body.nota <= 5):
        raise HTTPException(status_code=422, detail="La nota debe estar entre 0 y 5")

    student = Student(nombre=body.nombre.strip(), edad=body.edad, nota=body.nota)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    body: StudentCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    token = extract_token(authorization)
    get_current_user(token, db)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    student.nombre = body.nombre.strip()
    student.edad = body.edad
    student.nota = body.nota
    db.commit()
    db.refresh(student)
    return student


@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    token = extract_token(authorization)
    get_current_user(token, db)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    db.delete(student)
    db.commit()
    return {"message": "Estudiante eliminado"}

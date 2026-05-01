import os
import requests
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from models.db_model import StudentDB
from models.student_model import StudentCreate, StudentUpdate

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    # Fallback to anon key if service role is missing
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_ANON_KEY")

class StudentController:
    @staticmethod
    def _headers():
        return {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    @staticmethod
    def get_all(db, owner_id: str) -> list[StudentDB]:
        url = f"{SUPABASE_URL}/rest/v1/students?owner_id=eq.{owner_id}&order=id.desc"
        res = requests.get(url, headers=StudentController._headers())
        if res.status_code >= 400:
            print("Supabase Get Error:", res.text)
            return []
        
        return [StudentDB(**row) for row in res.json()]

    @staticmethod
    def get_by_id(student_id: int, db, owner_id: str) -> StudentDB:
        url = f"{SUPABASE_URL}/rest/v1/students?id=eq.{student_id}&owner_id=eq.{owner_id}"
        res = requests.get(url, headers=StudentController._headers())
        if res.status_code >= 400 or not res.json():
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        return StudentDB(**res.json()[0])

    @staticmethod
    def create(student: StudentCreate, db, owner_id: str) -> StudentDB:
        url = f"{SUPABASE_URL}/rest/v1/students"
        payload = student.model_dump()
        payload["owner_id"] = owner_id
        
        res = requests.post(url, headers=StudentController._headers(), json=payload)
        if res.status_code >= 400:
            print("Supabase Create Error:", res.text)
            raise HTTPException(status_code=400, detail="Error al crear estudiante")
            
        return StudentDB(**res.json()[0])

    @staticmethod
    def update(student_id: int, update_data: StudentUpdate, db, owner_id: str) -> StudentDB:
        student = StudentController.get_by_id(student_id, db, owner_id)
        changes = update_data.model_dump(exclude_unset=True)
        if not changes:
            return student
            
        url = f"{SUPABASE_URL}/rest/v1/students?id=eq.{student_id}&owner_id=eq.{owner_id}"
        res = requests.patch(url, headers=StudentController._headers(), json=changes)
        if res.status_code >= 400:
            print("Supabase Update Error:", res.text)
            raise HTTPException(status_code=400, detail="Error al actualizar estudiante")
            
        return StudentDB(**res.json()[0])

    @staticmethod
    def delete(student_id: int, db, owner_id: str) -> None:
        url = f"{SUPABASE_URL}/rest/v1/students?id=eq.{student_id}&owner_id=eq.{owner_id}"
        res = requests.delete(url, headers=StudentController._headers())
        
        if res.status_code >= 400:
            print("Supabase Delete Error:", res.text)
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

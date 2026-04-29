from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from auth import SupabaseUser, get_current_user
from controllers.student_controller import StudentController
from database import get_db
from models.student_model import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/students")


@router.get("/", response_model=list[StudentResponse])
def get_students(
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user),
):
    return StudentController.get_all(db, current_user.id)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user),
):
    return StudentController.get_by_id(student_id, db, current_user.id)


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_students(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user),
):
    return StudentController.create(student, db, current_user.id)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    update_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user),
):
    return StudentController.update(student_id, update_data, db, current_user.id)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user),
):
    StudentController.delete(student_id, db, current_user.id)

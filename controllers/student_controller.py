from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.db_model import StudentDB
from models.student_model import StudentCreate, StudentUpdate


class StudentController:
    @staticmethod
    def get_all(db: Session, owner_id: str) -> list[StudentDB]:
        return (
            db.query(StudentDB)
            .filter(StudentDB.owner_id == owner_id)
            .order_by(StudentDB.id.desc())
            .all()
        )

    @staticmethod
    def get_by_id(student_id: int, db: Session, owner_id: str) -> StudentDB:
        student = (
            db.query(StudentDB)
            .filter(StudentDB.id == student_id, StudentDB.owner_id == owner_id)
            .first()
        )

        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        return student

    @staticmethod
    def create(student: StudentCreate, db: Session, owner_id: str) -> StudentDB:
        new_student = StudentDB(owner_id=owner_id, **student.model_dump())
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        return new_student

    @staticmethod
    def update(
        student_id: int,
        update_data: StudentUpdate,
        db: Session,
        owner_id: str,
    ) -> StudentDB:
        student = StudentController.get_by_id(student_id, db, owner_id)
        changes = update_data.model_dump(exclude_unset=True)

        if not changes:
            return student

        for field, value in changes.items():
            setattr(student, field, value)

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def delete(student_id: int, db: Session, owner_id: str) -> None:
        student = StudentController.get_by_id(student_id, db, owner_id)
        db.delete(student)
        db.commit()

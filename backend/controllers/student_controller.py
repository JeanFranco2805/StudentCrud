from fastapi import HTTPException
from psycopg import Connection

from models.db_model import StudentDB
from models.student_model import StudentCreate, StudentUpdate


class StudentController:
    @staticmethod
    def _row_to_student(row) -> StudentDB:
        return StudentDB(id=row[0], owner_id=row[1], name=row[2], age=row[3], grade=row[4])

    @staticmethod
    def get_all(db: Connection, owner_id: str) -> list[StudentDB]:
        with db.cursor() as cur:
            cur.execute(
                "SELECT id, owner_id, name, age, grade FROM students WHERE owner_id = %s ORDER BY id DESC",
                (owner_id,),
            )
            return [StudentController._row_to_student(row) for row in cur.fetchall()]

    @staticmethod
    def get_by_id(student_id: int, db: Connection, owner_id: str) -> StudentDB:
        with db.cursor() as cur:
            cur.execute(
                "SELECT id, owner_id, name, age, grade FROM students WHERE id = %s AND owner_id = %s",
                (student_id, owner_id),
            )
            student = cur.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        return StudentController._row_to_student(student)

    @staticmethod
    def create(student: StudentCreate, db: Connection, owner_id: str) -> StudentDB:
        with db.cursor() as cur:
            cur.execute(
                "INSERT INTO students (owner_id, name, age, grade) VALUES (%s, %s, %s, %s) RETURNING id, owner_id, name, age, grade",
                (owner_id, student.name, student.age, student.grade),
            )
            new_student = cur.fetchone()
        return StudentController._row_to_student(new_student)

    @staticmethod
    def update(student_id: int, update_data: StudentUpdate, db: Connection, owner_id: str) -> StudentDB:
        student = StudentController.get_by_id(student_id, db, owner_id)
        changes = update_data.model_dump(exclude_unset=True)
        if not changes:
            return student
        with db.cursor() as cur:
            cur.execute(
                "UPDATE students SET name = COALESCE(%s, name), age = COALESCE(%s, age), grade = COALESCE(%s, grade) WHERE id = %s AND owner_id = %s RETURNING id, owner_id, name, age, grade",
                (changes.get("name"), changes.get("age"), changes.get("grade"), student_id, owner_id),
            )
            updated = cur.fetchone()
        return StudentController._row_to_student(updated)

    @staticmethod
    def delete(student_id: int, db: Connection, owner_id: str) -> None:
        with db.cursor() as cur:
            cur.execute(
                "DELETE FROM students WHERE id = %s AND owner_id = %s",
                (student_id, owner_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Estudiante no encontrado")

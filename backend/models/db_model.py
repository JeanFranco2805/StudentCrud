from dataclasses import dataclass


@dataclass
class StudentDB:
    id: int
    owner_id: str
    name: str
    age: int
    grade: float

from sqlalchemy import Column, Float, Integer, String

from database import Base


class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    grade = Column(Float, nullable=False)

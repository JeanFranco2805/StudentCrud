from sqlalchemy import Column, Integer, String, Float
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    otp = Column(String, nullable=True)
    token = Column(String, nullable=True)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    edad = Column(Integer, nullable=False)
    nota = Column(Float, nullable=False)

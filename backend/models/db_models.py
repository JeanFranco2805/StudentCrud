# Importaciones de SQLAlchemy
# Column: representa una columna de la tabla
# Integer, String, Float: tipos de datos para las columnas
from sqlalchemy import Column, Integer, String, Float

# Base: clase declarativa para definir el modelo
# Importada desde database.py donde se definió
from app.database import Base


# Student: modelo ORM que mapea a la tabla 'students' en la base de datos
# Hereda de Base para que SQLAlchemy la reconozca como modelo
class Student(Base):
    __tablename__ = "students"  # Nombre de la tabla en la DB

    # Definición de columnas:
    # id: clave primaria, auto-incremental, con índice
    id = Column(Integer, primary_key=True, index=True)
    
    # name: texto, no puede ser nulo
    name = Column(String, nullable=False)
    
    # age: número entero, no puede ser nulo
    age = Column(Integer, nullable=False)
    
    # grade: número decimal (nota), no puede ser nulo
    grade = Column(Float, nullable=False)
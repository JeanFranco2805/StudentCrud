from pydantic import BaseModel, ConfigDict, Field


class StudentBase(BaseModel):
    name: str = Field(..., min_length=2)
    age: int = Field(..., gt=0)
    grade: float = Field(..., ge=0, le=5)

    model_config = ConfigDict(from_attributes=True)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    age: int | None = Field(default=None, gt=0)
    grade: float | None = Field(default=None, ge=0, le=5)

    model_config = ConfigDict(from_attributes=True)


class StudentResponse(StudentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

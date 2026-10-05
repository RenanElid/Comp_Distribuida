from pydantic import BaseModel, ConfigDict, Field


class DisciplinaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    carga_horaria: int = Field(gt=0)


class DisciplinaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    carga_horaria: int | None = Field(default=None, gt=0)


class DisciplinaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    carga_horaria: int

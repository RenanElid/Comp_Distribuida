from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Turno = Literal["MANHA", "TARDE", "NOITE"]


class TurmaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    ano_letivo: int = Field(ge=2000, le=2100)
    turno: Turno


class TurmaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    ano_letivo: int | None = Field(default=None, ge=2000, le=2100)
    turno: Turno | None = None


class TurmaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    ano_letivo: int
    turno: Turno


class MatriculaCreate(BaseModel):
    aluno_id: int


class MatriculaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    turma_id: int


class AtribuicaoCreate(BaseModel):
    disciplina_id: int
    professor_id: int


class AtribuicaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    turma_id: int
    disciplina_id: int
    professor_id: int

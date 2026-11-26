from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Situacao = Literal["PRESENTE", "FALTA", "ATRASO"]

class FrequenciaCreate(BaseModel):
    matricula_id: int
    data: date
    situacao: Situacao

class FrequenciaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    matricula_id: int
    data: date
    situacao: Situacao

class RegistroChamada(BaseModel):
    matricula_id: int
    situacao: Situacao

class ChamadaCreate(BaseModel):
    turma_id: int
    data: date
    registros: list[RegistroChamada] = Field(min_length=1)

class ChamadaResponse(BaseModel):
    registradas: list[FrequenciaResponse]
    ja_registradas: list[int]

class ResumoFrequencia(BaseModel):
    matricula_id: int
    aluno_id: int
    total: int
    presentes: int
    atrasos: int
    faltas: int
    percentual: float | None

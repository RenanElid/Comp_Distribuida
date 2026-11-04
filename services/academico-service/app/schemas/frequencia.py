from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict

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

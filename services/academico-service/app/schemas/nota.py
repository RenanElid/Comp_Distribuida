from pydantic import BaseModel, ConfigDict, Field

class NotaCreate(BaseModel):
    matricula_id: int
    descricao: str = Field(min_length=1, max_length=50)
    valor: float = Field(ge=0, le=10)

class NotaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    matricula_id: int
    descricao: str
    valor: float

class NotasDaMatricula(BaseModel):
    matricula_id: int
    notas: list[NotaResponse]
    media: float | None

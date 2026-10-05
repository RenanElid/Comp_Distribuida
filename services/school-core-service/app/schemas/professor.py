from pydantic import BaseModel, ConfigDict, Field

from app.schemas.aluno import PADRAO_EMAIL


class ProfessorCreate(BaseModel):
    email: str = Field(pattern=PADRAO_EMAIL, max_length=255)
    senha: str = Field(min_length=8, max_length=72)
    nome: str = Field(min_length=1, max_length=150)
    qualificacao: str | None = Field(default=None, max_length=255)
    contato: str | None = Field(default=None, max_length=100)


class ProfessorUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=150)
    qualificacao: str | None = Field(default=None, max_length=255)
    contato: str | None = Field(default=None, max_length=100)


class ProfessorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    nome: str
    qualificacao: str | None
    contato: str | None
